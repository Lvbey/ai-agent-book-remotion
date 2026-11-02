"""边界诊断：对比 provider 字级时码与真实声学边界，用于校定裁剪参数。

不写缓存、不动产物，只发一次真实请求并打印包络统计。

用法：
    python scripts/tts-boundary-probe.py                 # 默认取 U001 文本
    python scripts/tts-boundary-probe.py EP01-U002
"""
from __future__ import annotations

import array
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('tts', ROOT / 'scripts' / 'tts-synthesize.py')
tts = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tts)

WIN = 0.01  # 10ms 分析窗
REL_THRESHOLD = 0.02  # 相对峰值的判定阈值（-34 dBFS）


def envelope(pcm, sample_rate, win=WIN):
    samples = array.array('h')
    samples.frombytes(pcm)
    size = max(1, int(sample_rate * win))
    values = []
    for start in range(0, len(samples) - size + 1, size):
        chunk = samples[start:start + size]
        values.append((sum(v * v for v in chunk) / size) ** 0.5)
    return samples, values, size


def audible_bounds(values, peak, rel=REL_THRESHOLD):
    threshold = peak * rel
    first = next((i for i, v in enumerate(values) if v > threshold), None)
    last = next((i for i in range(len(values) - 1, -1, -1) if values[i] > threshold), None)
    return first, last, threshold


def main():
    unit_id = sys.argv[1] if len(sys.argv) > 1 else 'EP01-U001'
    units = []
    for name in tts.SECTIONS:
        path = tts.UNITS_DIR / f'{name}.json'
        units.extend(json.loads(path.read_text(encoding='utf-8')))
    unit = next(u for u in units if u['id'] == unit_id)
    config = json.loads(tts.CONFIG_PATH.read_text(encoding='utf-8'))
    key = tts.require_api_key()

    events = tts.request_events(unit['text'], config, key)
    pcm, words = tts.decode(events)
    sample_rate = int(config['sample_rate'])
    samples, values, size = envelope(pcm, sample_rate)
    peak = max(abs(v) for v in samples) or 1
    first, last, threshold = audible_bounds(values, peak)
    duration = len(samples) / sample_rate

    w0 = words[0]['startTime']
    w_last = max(w['endTime'] for w in words)
    print(f'unit            {unit_id}')
    print(f'chars           {len(unit["text"])}')
    print(f'raw duration    {duration:.3f}s')
    print(f'word start      {w0:.3f}s   audible start {(first or 0) * WIN:.3f}s   diff {(first or 0) * WIN - w0:+.3f}s')
    print(f'word end        {w_last:.3f}s   audible end   {(last + 1) * WIN:.3f}s   diff {(last + 1) * WIN - w_last:+.3f}s')
    print(f'tail silence    {duration - (last + 1) * WIN:.3f}s')
    print(f'head silence    {(first or 0) * WIN:.3f}s')
    print(f'threshold       {threshold:.0f} ({REL_THRESHOLD:.0%} of peak {peak})')
    # 尾段 1s 包络
    tail = [(i * WIN, round(values[i] / peak, 2)) for i in range(max(0, len(values) - 100), len(values))]
    print('tail envelope   ' + ' '.join(f'{t:.2f}:{v:.2f}' for t, v in tail[-50:]))


if __name__ == '__main__':
    main()
