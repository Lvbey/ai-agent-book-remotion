"""EP01 旁白语音合成（豆包 seed-tts-2.0，逐语义单元合成）。

设计约束（与 voice-stage 一致，并扩展到全片）：
1. 凭据只从环境变量 DOUBAO_TTS_API_KEY 读取；不写入仓库、日志或控制台。
2. 任何异常只输出受控信息（错误码/状态码/自定义说明），不序列化请求头、请求体或服务端原始响应。
3. 每条单元音频以「文本 + 音色 + 语速 + 风格指令 + 采样率」的内容哈希做缓存键，
   重复执行不会重复计费；配置变更会自动失效。
4. provider 返回的字级时间戳原样落盘为 words.json，供字幕真实时码使用；
   缺失时明确标记 timestampSource=estimated，由构建脚本回退为按字重比例分配。
5. 顺序性与确定性：分片并发只影响耗时，audio-index.json 始终按单元顺序输出。

用法：
    python scripts/tts-synthesize.py --list
    python scripts/tts-synthesize.py --audition
    python scripts/tts-synthesize.py --all --jobs 3
    python scripts/tts-synthesize.py --units EP01-U001,EP01-U002 --force
"""
from __future__ import annotations

import argparse
import array
import base64
import hashlib
import json
import os
import sys
import time
import uuid
import wave
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / 'src' / 'data'
UNITS_DIR = DATA_DIR / 'units'
NARRATION_DIR = ROOT / 'narration'
AUDIO_DIR = NARRATION_DIR / 'ep01'
SEGMENT_DIR = AUDIO_DIR / 'segments'
AUDITION_DIR = NARRATION_DIR / 'audition'
INDEX_PATH = AUDIO_DIR / 'audio-index.json'
CONFIG_PATH = NARRATION_DIR / 'voice-config.json'

URL = 'https://openspeech.bytedance.com/api/v3/tts/unidirectional'
UID = 'chapter3-ep01'
SECTIONS = ['s0', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9']
RETRY_STATUS = (429, 500, 502, 503, 504)
MAX_ATTEMPTS = 3
SEGMENT_FORMAT = 4  # 分段产物格式版本：变更布局即失效旧缓存
TRIM_WINDOW_SEC = 0.01  # 收声判定的能量包络窗
TRIM_REL_THRESHOLD = 0.02  # 相对段峰值的收声阈值（约 -34 dBFS）
TRIM_ABS_FLOOR = 48  # PCM16 绝对下限，避免极安静段被底噪主导
LEAD_PAD_SEC = 0.10  # 首字前保留的气口
TAIL_PAD_SEC = 0.22  # 末字后保留的收音衰减
EDGE_FADE_IN_SEC = 0.02  # 起点淡入：provider 常在 t=0 即有满幅起音，需稍长淡化
EDGE_FADE_OUT_SEC = 0.012  # 终点淡出：切口已在静音内，短一点即够


class TtsError(ValueError):
    """受控错误：消息可直接展示给用户。"""


# ---------- 提供方响应解码 ----------

def decode(events):
    """把流式事件解码为 (pcm_bytes, words)。任一异常都不含服务端原文。"""
    audio = bytearray()
    words = []
    complete = False
    for event in events:
        code = event.get('code', 0)
        if code not in (0, 20000000):
            raise TtsError('TTS provider error code: ' + str(code))
        if event.get('data'):
            audio.extend(base64.b64decode(event['data'], validate=True))
        sentence = event.get('sentence')
        if sentence:
            if isinstance(sentence, str):
                sentence = json.loads(sentence)
            words.extend(sentence.get('words', []))
        complete = complete or code == 20000000
    if not complete:
        raise TtsError('Incomplete TTS stream (no completion event)')
    if not audio:
        raise TtsError('Empty audio payload')
    if len(audio) % 2:
        raise TtsError('Invalid PCM payload (odd byte length)')
    return bytes(audio), words


def validate_words(words, duration):
    """校验字级时间戳边界与单调性；不通过即丢弃（由调用方回退）。"""
    cleaned = []
    previous = 0.0
    for item in words:
        try:
            start = float(item['startTime'])
            end = float(item['endTime'])
        except (KeyError, TypeError, ValueError):
            return []
        if not 0 <= start <= end <= duration + 0.05 or start < previous - 0.02:
            return []
        previous = start
        text = str(item.get('word', '')).strip()
        if not text:
            continue
        cleaned.append({
            'word': text,
            'startTime': round(start, 4),
            'endTime': round(end, 4),
            'confidence': item.get('confidence'),
        })
    return cleaned


# ---------- 单元与缓存 ----------

def load_config():
    if not CONFIG_PATH.exists():
        raise TtsError('Missing narration/voice-config.json')
    config = json.loads(CONFIG_PATH.read_text(encoding='utf-8'))
    for key in ('resource', 'speaker', 'sample_rate', 'instruction'):
        if key not in config:
            raise TtsError('voice-config.json missing field: ' + key)
    return config


def load_units():
    """按分节顺序读取口播单元，返回 [{id, text, scene}]。"""
    units = []
    for section in SECTIONS:
        path = UNITS_DIR / (section + '.json')
        if not path.exists():
            raise TtsError('Missing unit source: ' + str(path))
        for unit in json.loads(path.read_text(encoding='utf-8')):
            units.append({'id': unit['id'], 'text': unit['text'], 'scene': unit.get('scene', '')})
    if not units:
        raise TtsError('No narration units found')
    return units


def cache_key(text, config):
    payload = {
        'text': text,
        'resource': config['resource'],
        'speaker': config['speaker'],
        'sample_rate': config['sample_rate'],
        'speech_rate': config['speech_rate'],
        'instruction': config['instruction'],
        'format': 'pcm',
        'subtitle': True,
        'uid': UID,
    }
    raw = json.dumps(payload, sort_keys=True, ensure_ascii=False).encode('utf-8')
    return hashlib.sha256(raw).hexdigest()


def is_cached(unit_id, key, text):
    manifest = SEGMENT_DIR / unit_id / 'manifest.json'
    audio = SEGMENT_DIR / unit_id / 'audio.wav'
    if not manifest.exists() or not audio.exists():
        return False
    try:
        data = json.loads(manifest.read_text(encoding='utf-8'))
    except (OSError, ValueError):
        return False
    return data.get('hash') == key and data.get('text') == text and data.get('format') == SEGMENT_FORMAT


def wav_seconds(pcm, sample_rate):
    """16-bit 单声道 PCM 的时长（秒）。"""
    return len(pcm) / (sample_rate * 2)


def write_wav(path, pcm, sample_rate):
    with wave.open(str(path), 'wb') as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(sample_rate)
        handle.writeframes(pcm)


def rms_envelope(pcm, sample_rate, window_sec=TRIM_WINDOW_SEC):
    """把 PCM 切成等长窗，返回 (窗口 RMS 列表, 每窗采样点数)。"""
    samples = array.array('h')
    samples.frombytes(pcm[: len(pcm) - (len(pcm) % 2)])
    size = max(1, int(sample_rate * window_sec))
    values = []
    for start in range(0, len(samples) - size + 1, size):
        chunk = samples[start:start + size]
        values.append((sum(v * v for v in chunk) / size) ** 0.5)
    return values, size


def speech_bounds(pcm, sample_rate):
    """按能量包络定位真实收声区间，返回 (start, end, head_silence, tail_silence)。

    为什么不能信字级时码：provider 的末词 endTime 比实际收声早 0.3–0.5s
    （实测 U001 早 0.475s），拿它当声学边界会切掉末字尾音。
    """
    duration = wav_seconds(pcm, sample_rate)
    values, size = rms_envelope(pcm, sample_rate)
    if not values:
        return 0.0, duration, 0.0, 0.0
    threshold = max(max(values) * TRIM_REL_THRESHOLD, TRIM_ABS_FLOOR)
    first = next((i for i, v in enumerate(values) if v > threshold), None)
    last = next((i for i in range(len(values) - 1, -1, -1) if values[i] > threshold), None)
    if first is None or last is None:
        return 0.0, duration, 0.0, 0.0
    start = (first * size) / sample_rate
    end = min(duration, ((last + 1) * size) / sample_rate)
    return start, end, start, duration - end


def edge_fade(pcm, sample_rate, fade_in_sec=EDGE_FADE_IN_SEC, fade_out_sec=EDGE_FADE_OUT_SEC):
    """两端做极短淡入淡出，避免硬切产生爆音。"""
    if not pcm:
        return pcm
    samples = array.array('h')
    samples.frombytes(pcm)
    total = len(samples)
    head = min(int(sample_rate * fade_in_sec), total // 2)
    tail = min(int(sample_rate * fade_out_sec), total // 2)
    for i in range(head):
        samples[i] = int(samples[i] * ((i + 1) / (head + 1)))
    for i in range(tail):
        samples[total - 1 - i] = int(samples[total - 1 - i] * ((i + 1) / (tail + 1)))
    return samples.tobytes()


def normalize_segment(pcm, words, sample_rate):
    """按真实收声边界裁掉首尾静音，并把字级时码平移到新原点。

    provider 会在句末附带数百毫秒静音；逐单元拼接会累积成可感知的拖沓，
    因此统一裁到「首个有声窗 - 100ms ~ 末个有声窗 + 220ms」，气口由时间轴常量统一控制。
    边界只由能量决定，与字级时码无关——时码只在裁剪后整体平移。
    """
    duration = wav_seconds(pcm, sample_rate)
    speech_start, speech_end, _, _ = speech_bounds(pcm, sample_rate)
    start = max(0.0, speech_start - LEAD_PAD_SEC)
    end = min(duration, speech_end + TAIL_PAD_SEC)
    if end - start < 0.4:
        return pcm, 0.0, words

    first = max(0, min(int(round(start * sample_rate)), max(0, int(round(duration * sample_rate)) - 1)))
    last = max(first + 1, min(int(round(end * sample_rate)), int(round(duration * sample_rate))))
    offset = first / sample_rate
    trimmed_duration = (last - first) / sample_rate
    shifted = []
    for word in words:
        begin = min(max(0.0, word['startTime'] - offset), trimmed_duration)
        finish = min(max(begin, word['endTime'] - offset), trimmed_duration)
        shifted.append({**word, 'startTime': round(begin, 4), 'endTime': round(finish, 4)})
    return edge_fade(pcm[first * 2:last * 2], sample_rate), offset, shifted



# ---------- 网络请求 ----------

def require_api_key():
    """凭据只从环境变量读取，不落盘、不打日志。"""
    key = os.environ.get('DOUBAO_TTS_API_KEY')
    if not key:
        raise TtsError('DOUBAO_TTS_API_KEY is unavailable in this process')
    return key


def request_events(text, config, key):
    body = {
        'user': {'uid': UID},
        'req_params': {
            'text': text,
            'speaker': config['speaker'],
            'audio_params': {
                'format': 'pcm',
                'sample_rate': config['sample_rate'],
                'speech_rate': config['speech_rate'],
                'enable_subtitle': True,
            },
            'context_texts': [config['instruction']],
        },
    }
    data = json.dumps(body, ensure_ascii=False).encode('utf-8')
    headers = {
        'X-Api-Key': key,
        'X-Api-Resource-Id': config['resource'],
        'X-Api-Request-Id': str(uuid.uuid4()),
        'Content-Type': 'application/json',
    }
    last_status = None
    for attempt in range(MAX_ATTEMPTS):
        request = Request(URL, data=data, headers=headers)
        try:
            with urlopen(request, timeout=120) as response:
                return [json.loads(line) for line in response if line.strip()]
        except HTTPError as exc:
            last_status = exc.code
            if exc.code not in RETRY_STATUS or attempt == MAX_ATTEMPTS - 1:
                raise TtsError('TTS HTTP status ' + str(exc.code)) from None
        except (URLError, TimeoutError, OSError):
            last_status = 'network'
            if attempt == MAX_ATTEMPTS - 1:
                raise TtsError('TTS connection failed after ' + str(MAX_ATTEMPTS) + ' attempts') from None
        time.sleep(2 ** attempt)
    raise TtsError('TTS request failed (last status: ' + str(last_status) + ')')


# ---------- 单元合成 ----------

def write_segment(unit, config, digest, pcm, words, source, retrimmed=False):
    """裁剪 → 落盘 → 返回 manifest 记录。合成与本地重裁共用此路径。"""
    unit_id = unit['id']
    sample_rate = int(config['sample_rate'])
    out_dir = SEGMENT_DIR / unit_id
    raw_duration = wav_seconds(pcm, sample_rate)
    speech_start, speech_end, head_silence, tail_silence = speech_bounds(pcm, sample_rate)

    write_wav(out_dir / 'audio.raw.wav', pcm, sample_rate)
    trimmed, trim_offset, words = normalize_segment(pcm, words, sample_rate)
    duration = wav_seconds(trimmed, sample_rate)
    write_wav(out_dir / 'audio.wav', trimmed, sample_rate)

    words_payload = [{'word': w['word'], 'startTime': w['startTime'], 'endTime': w['endTime'],
                      'confidence': w['confidence']} for w in words]
    (out_dir / 'words.json').write_text(
        json.dumps(words_payload, ensure_ascii=False, indent=2), encoding='utf-8')

    # 切口残留能量：接近 0 才说明裁在真正的静音里，否则就是切到语音了。
    envelope, _ = rms_envelope(trimmed, sample_rate)
    peak = max(envelope) if envelope else 0.0
    head_ratio = envelope[0] / peak if envelope and peak else 0.0
    tail_ratio = envelope[-1] / peak if envelope and peak else 0.0

    manifest = {
        'id': unit_id,
        'format': SEGMENT_FORMAT,
        'hash': digest,
        'text': unit['text'],
        'chars': len(unit['text']),
        'durationSeconds': round(duration, 4),
        'rawDurationSeconds': round(raw_duration, 4),
        'trimOffsetSeconds': round(trim_offset, 4),
        'speechStartSeconds': round(speech_start, 4),
        'speechEndSeconds': round(speech_end, 4),
        'headSilenceSeconds': round(head_silence, 4),
        'tailSilenceSeconds': round(tail_silence, 4),
        'edgeEnergyRatio': {'head': round(head_ratio, 4), 'tail': round(tail_ratio, 4)},
        'sampleRate': sample_rate,
        'timestampSource': source,
        'wordCount': len(words),
        'audio': 'segments/' + unit_id + '/audio.wav',
        'audioRaw': 'segments/' + unit_id + '/audio.raw.wav',
        'words': 'segments/' + unit_id + '/words.json',
        'config': {k: config[k] for k in ('resource', 'speaker', 'sample_rate', 'speech_rate')},
    }
    (out_dir / 'manifest.json').write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    if retrimmed:
        manifest = {**manifest, 'retrimmed': True}
    return {'cached': False, **manifest}


def retrim_from_raw(unit, config, digest, manifest, raw_path):
    """用已落盘的原始音频重跑裁剪，不重复请求 provider。

    旧版本的 words.json 存的是「已平移」时码，按 manifest 里的 trimOffsetSeconds
    还原回原始坐标后再裁，保证字级时码不漂移。
    """
    sample_rate = int(config['sample_rate'])
    try:
        with wave.open(str(raw_path), 'rb') as handle:
            if (handle.getnchannels() != 1 or handle.getsampwidth() != 2
                    or handle.getframerate() != sample_rate):
                return None
            pcm = handle.readframes(handle.getnframes())
        stored = json.loads((raw_path.parent / 'words.json').read_text(encoding='utf-8'))
    except (OSError, ValueError, wave.Error):
        return None
    if not stored:
        return None
    offset = float(manifest.get('trimOffsetSeconds') or 0.0)
    words = [{'word': w['word'],
              'startTime': float(w['startTime']) + offset,
              'endTime': float(w['endTime']) + offset,
              'confidence': w.get('confidence')} for w in stored]
    return write_segment(unit, config, digest, pcm, words,
                         manifest.get('timestampSource', 'provider'), retrimmed=True)


def synthesize_unit(unit, config, key, force=False):
    unit_id = unit['id']
    text = unit['text']
    digest = cache_key(text, config)
    out_dir = SEGMENT_DIR / unit_id
    if not force:
        if is_cached(unit_id, digest, text):
            manifest = json.loads((out_dir / 'manifest.json').read_text(encoding='utf-8'))
            return {'id': unit_id, 'cached': True, **manifest}
        # 缓存命中但产物格式过期：原始音频仍在，本地重裁即可，不必重新计费。
        manifest_path = out_dir / 'manifest.json'
        raw_path = out_dir / 'audio.raw.wav'
        if manifest_path.exists() and raw_path.exists():
            try:
                manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
            except (OSError, ValueError):
                manifest = None
            if manifest and manifest.get('hash') == digest and manifest.get('text') == text:
                record = retrim_from_raw(unit, config, digest, manifest, raw_path)
                if record is not None:
                    return record

    events = request_events(text, config, key)
    pcm, raw_words = decode(events)
    sample_rate = int(config['sample_rate'])
    raw_duration = wav_seconds(pcm, sample_rate)
    if raw_duration < 0.3:
        raise TtsError(unit_id + ': audio too short (' + format(raw_duration, '.2f') + 's)')

    words = validate_words(raw_words, raw_duration)
    source = 'provider'
    if not words:
        # 重试一次仍无字级时间戳时保留音频，但显式降级，避免整片合成被单条拖垮。
        time.sleep(1)
        events = request_events(text, config, key)
        pcm, raw_words = decode(events)
        raw_duration = wav_seconds(pcm, sample_rate)
        words = validate_words(raw_words, raw_duration)
        if not words:
            source = 'estimated'

    out_dir.mkdir(parents=True, exist_ok=True)
    return write_segment(unit, config, digest, pcm, words, source)


def run_units(units, config, jobs, force):
    key_value = require_api_key()

    results = {}
    failures = []
    total = len(units)
    done = 0
    with ThreadPoolExecutor(max_workers=max(1, jobs)) as pool:
        futures = {pool.submit(synthesize_unit, unit, config, key_value, force): unit for unit in units}
        for future in as_completed(futures):
            unit = futures[future]
            done += 1
            try:
                record = future.result()
            except TtsError as exc:
                failures.append({'id': unit['id'], 'error': str(exc)})
                print('[' + str(done) + '/' + str(total) + '] ' + unit['id'] + ' FAILED: ' + str(exc), flush=True)
                continue
            except Exception as exc:  # 不输出细节，避免泄露请求内容
                failures.append({'id': unit['id'], 'error': type(exc).__name__})
                print('[' + str(done) + '/' + str(total) + '] ' + unit['id'] + ' FAILED: ' + type(exc).__name__, flush=True)
                continue
            results[unit['id']] = record
            flag = 'cached' if record['cached'] else ('retrim' if record.get('retrimmed') else 'synth')
            print('[' + str(done) + '/' + str(total) + '] ' + unit['id'] + ' ' +
                  format(record['durationSeconds'], '.2f') + 's ' + flag +
                  (' words=' + str(record['wordCount']) if record['timestampSource'] == 'provider' else ' words=0(fallback)'),
                  flush=True)
    return results, failures


def write_index(all_units, results, config):
    """合并历史缓存记录并写出 audio-index.json（按单元顺序，供时间轴构建消费）。"""
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    existing = {}
    if INDEX_PATH.exists():
        try:
            for item in json.loads(INDEX_PATH.read_text(encoding='utf-8')).get('units', []):
                existing[item['id']] = item
        except (OSError, ValueError):
            existing = {}
    for unit_id, record in results.items():
        existing[unit_id] = record

    ordered = []
    missing = []
    for unit in all_units:
        record = existing.get(unit['id'])
        if not record:
            missing.append(unit['id'])
            continue
        ordered.append({
            'id': record['id'],
            'format': record['format'],
            'text': record['text'],
            'chars': record['chars'],
            'hash': record['hash'],
            'durationSeconds': record['durationSeconds'],
            'rawDurationSeconds': record.get('rawDurationSeconds'),
            'sampleRate': record['sampleRate'],
            'timestampSource': record['timestampSource'],
            'wordCount': record['wordCount'],
            'audio': record['audio'],
            'words': record['words'],
        })

    payload = {
        'episode': 'EP01',
        'provider': 'doubao-seed-tts-2.0',
        'config': {k: config[k] for k in ('resource', 'speaker', 'sample_rate', 'speech_rate', 'instruction')},
        'unitCount': len(ordered),
        'totalChars': sum(item['chars'] for item in ordered),
        'totalSeconds': round(sum(item['durationSeconds'] for item in ordered), 3),
        'complete': not missing,
        'missing': missing,
        'fallbackUnits': [item['id'] for item in ordered if item['timestampSource'] != 'provider'],
        'units': ordered,
    }
    INDEX_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
    return payload


def build_audition(units, results, config):
    """把试听单元的 PCM 顺序拼接，生成 30-45 秒试听文件。"""
    AUDITION_DIR.mkdir(parents=True, exist_ok=True)
    sample_rate = int(config['sample_rate'])
    pcm = bytearray()
    for unit in units:
        record = results.get(unit['id'])
        if not record:
            raise TtsError('Audition aborted: unit not synthesized (' + unit['id'] + ')')
        with wave.open(str(SEGMENT_DIR / unit['id'] / 'audio.wav'), 'rb') as handle:
            pcm.extend(handle.readframes(handle.getnframes()))
    duration = len(pcm) / (sample_rate * 2)
    wav_path = AUDITION_DIR / 'ep01-audition.wav'
    with wave.open(str(wav_path), 'wb') as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(sample_rate)
        handle.writeframes(bytes(pcm))
    status = 'ready-for-listening' if 30 <= duration <= 45 else 'duration-review-required'
    manifest = {
        'purpose': 'voice identity / speech rate / term pronunciation review',
        'unitIds': [u['id'] for u in units],
        'durationSeconds': round(duration, 3),
        'status': status,
        'text': ''.join(u['text'] for u in units),
        'config': {k: config[k] for k in ('resource', 'speaker', 'sample_rate', 'speech_rate', 'instruction')},
    }
    (AUDITION_DIR / 'manifest.json').write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    return manifest, wav_path


# ---------- CLI ----------

def main(argv=None):
    parser = argparse.ArgumentParser(description='EP01 旁白语音合成（逐语义单元）')
    parser.add_argument('--list', action='store_true', help='列出单元、字数与缓存状态')
    parser.add_argument('--audition', action='store_true', help='合成试听片段（默认开场 3 单元）')
    parser.add_argument('--all', action='store_true', help='合成全部单元')
    parser.add_argument('--units', default='', help='仅合成指定单元，逗号分隔')
    parser.add_argument('--jobs', type=int, default=3, help='并发请求数（默认 3）')
    parser.add_argument('--force', action='store_true', help='忽略缓存强制重合成')
    args = parser.parse_args(argv)

    config = load_config()
    units = load_units()

    if args.list:
        index = {}
        if INDEX_PATH.exists():
            index = {u['id']: u for u in json.loads(INDEX_PATH.read_text(encoding='utf-8')).get('units', [])}
        for unit in units:
            digest = cache_key(unit['text'], config)
            state = 'cached' if is_cached(unit['id'], digest, unit['text']) else 'pending'
            known = index.get(unit['id'])
            seconds = format(known['durationSeconds'], '.1f') if known else '-'
            print(unit['id'] + '\t' + str(len(unit['text'])).rjust(3) + '字\t' + seconds.rjust(6) + 's\t' + state)
        print('total units=' + str(len(units)) + ' chars=' + str(sum(len(u['text']) for u in units)))
        return 0

    if args.audition:
        ids = config.get('auditionUnits') or [u['id'] for u in units[:3]]
        by_id = {u['id']: u for u in units}
        picked = [by_id[i] for i in ids if i in by_id]
        if not picked:
            raise TtsError('auditionUnits 未匹配到任何单元')
        results, failures = run_units(picked, config, 1, args.force)
        if failures:
            raise TtsError('试听合成失败：' + failures[0]['id'] + ' ' + failures[0]['error'])
        # 试听只产出 audition 清单，不写全局 audio-index.json：
        # 否则会让时间轴构建看到一个「不完整」的音频索引而报错中断渲染流程。
        manifest, wav_path = build_audition(picked, results, config)
        print(json.dumps({
            'audition': str(wav_path.relative_to(ROOT)),
            'durationSeconds': manifest['durationSeconds'],
            'status': manifest['status'],
            'unitIds': manifest['unitIds'],
        }, ensure_ascii=False))
        return 0

    if args.units:
        wanted = [item.strip() for item in args.units.split(',') if item.strip()]
        known = {u['id'] for u in units}
        unknown = [item for item in wanted if item not in known]
        if unknown:
            raise TtsError('未知单元 ID: ' + ','.join(unknown))
        targets = [u for u in units if u['id'] in wanted]
    elif args.all:
        targets = units
    else:
        parser.print_help()
        return 2

    results, failures = run_units(targets, config, args.jobs, args.force)
    payload = write_index(units, results, config)
    summary = {
        'requested': len(targets),
        'succeeded': len(results),
        'failed': len(failures),
        'cached': sum(1 for r in results.values() if r['cached']),
        'indexed': payload['unitCount'],
        'complete': payload['complete'],
        'missing': len(payload['missing']),
        'fallbackUnits': payload['fallbackUnits'],
        'totalSeconds': payload['totalSeconds'],
    }
    print(json.dumps(summary, ensure_ascii=False))
    if failures:
        print('FAILURES: ' + json.dumps(failures, ensure_ascii=False))
        return 1
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except TtsError as exc:
        print(str(exc))
        sys.exit(1)
    except KeyboardInterrupt:
        print('Interrupted')
        sys.exit(130)
    except Exception as exc:  # 只暴露类型，不打印可能含请求内容的堆栈
        print('Synthesis failed: ' + type(exc).__name__)
        sys.exit(1)
