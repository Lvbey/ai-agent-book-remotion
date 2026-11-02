/**
 * 旁白音轨一致性检查（阶段 B 硬门槛）。
 *
 * 校验链：音频索引 → 分段 WAV → 时间轴 → 整轨 WAV → 交付 MP3 → 字级字幕时码。
 * 任何一环缺失或时长对不上都直接失败，避免「看起来有声、实际静音或错位」的成片流出。
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'src/data');
const NARRATION_DIR = path.join(ROOT, 'narration/ep01');
const AUDIO_INDEX = path.join(NARRATION_DIR, 'audio-index.json');
const MASTER_WAV = path.join(NARRATION_DIR, 'master.wav');
const MASTER_MP3 = path.join(ROOT, 'public/narration/ep01-narration.mp3');

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const errors = [];
const warnings = [];
const DURATION_TOLERANCE = 0.002; // 2ms，覆盖 WAV 采样级舍入
// 切口残留能量上限（相对该段峰值）：超过说明裁到了语音，听感是「戛然而止」。
// provider 常从有声处起音，首部只能靠 20ms 淡入兜底，故阈值放宽到 35%。
const MAX_TAIL_EDGE_RATIO = 0.03;
const MAX_HEAD_EDGE_RATIO = 0.35;

const wavInfo = (file) => {
  const buffer = fs.readFileSync(file);
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') return null;
  let offset = 12;
  let fmt = null;
  let dataSize = null;
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const body = offset + 8;
    if (id === 'fmt ') {
      fmt = {
        format: buffer.readUInt16LE(body),
        channels: buffer.readUInt16LE(body + 2),
        rate: buffer.readUInt32LE(body + 4),
        bits: buffer.readUInt16LE(body + 14),
      };
    } else if (id === 'data') {
      dataSize = Math.min(size, buffer.length - body);
    }
    offset = body + size + (size % 2);
  }
  if (!fmt || dataSize === null) return null;
  return {...fmt, dataSize, seconds: dataSize / (fmt.channels * (fmt.bits / 8) * fmt.rate)};
};

// ---------- 1. 索引 ----------
if (!fs.existsSync(AUDIO_INDEX)) {
  console.error('[check-narration] FAIL：缺少 narration/ep01/audio-index.json（阶段 B 未完成）');
  process.exit(1);
}
const index = readJson(AUDIO_INDEX);
if (!index.complete) errors.push(`音频索引不完整，缺少 ${index.missing.length} 个单元：${index.missing.slice(0, 10).join(',')}`);
if (!index.units.length) errors.push('音频索引没有任何单元');

const units = readJson(path.join(DATA_DIR, 'ep01-units.generated.json'));
const captions = readJson(path.join(DATA_DIR, 'ep01-captions.generated.json'));
const meta = readJson(path.join(DATA_DIR, 'ep01-meta.generated.json'));
const narration = readJson(path.join(DATA_DIR, 'ep01-narration.generated.json'));

const byId = new Map(index.units.map((u) => [u.id, u]));
if (byId.size !== index.units.length) errors.push('音频索引存在重复单元 ID');
if (units.length !== index.unitCount) {
  errors.push(`单元数不一致：时间轴 ${units.length} vs 音频索引 ${index.unitCount}`);
}

// ---------- 2. 分段音频 ----------
let totalSpeech = 0;
for (const unit of units) {
  const record = byId.get(unit.id);
  if (!record) {
    errors.push(`单元 ${unit.id} 缺少音频记录`);
    continue;
  }
  const wav = path.join(NARRATION_DIR, record.audio);
  if (!fs.existsSync(wav)) {
    errors.push(`单元 ${unit.id} 缺少音频文件 ${record.audio}`);
    continue;
  }
  const info = wavInfo(wav);
  if (!info) {
    errors.push(`单元 ${unit.id} WAV 无法解析`);
    continue;
  }
  if (info.format !== 1 || info.channels !== 1 || info.bits !== 16 || info.rate !== 48000) {
    errors.push(`单元 ${unit.id} WAV 格式不符（fmt=${info.format} ch=${info.channels} bits=${info.bits} rate=${info.rate}）`);
  }
  if (Math.abs(info.seconds - record.durationSeconds) > DURATION_TOLERANCE) {
    errors.push(`单元 ${unit.id} 时长不符：WAV ${info.seconds.toFixed(3)}s vs 索引 ${record.durationSeconds}s`);
  }
  if (Math.abs(unit.speechSeconds - record.durationSeconds) > 0.001) {
    errors.push(`单元 ${unit.id} 时间轴语音时长 ${unit.speechSeconds}s ≠ 音频 ${record.durationSeconds}s`);
  }
  if (unit.duration < Math.ceil((record.durationSeconds + meta.gapSeconds) * meta.fps)) {
    errors.push(`单元 ${unit.id} 帧长 ${unit.duration} 不足以容纳音频 + 间隙`);
  }
  if (record.timestampSource !== 'provider') warnings.push(`单元 ${unit.id} 无字级时间戳（${record.timestampSource}）`);

  const manifestPath = path.join(NARRATION_DIR, 'segments', unit.id, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    errors.push(`单元 ${unit.id} 缺少 manifest.json`);
  } else {
    const edge = readJson(manifestPath).edgeEnergyRatio;
    if (!edge) {
      errors.push(`单元 ${unit.id} 缺少切口能量记录（请重新执行 narration:synth 触发重裁）`);
    } else {
      if (edge.tail > MAX_TAIL_EDGE_RATIO) {
        errors.push(`单元 ${unit.id} 结尾切在语音上：尾部残留 ${(edge.tail * 100).toFixed(1)}% 峰值（上限 ${MAX_TAIL_EDGE_RATIO * 100}%）`);
      }
      if (edge.head > MAX_HEAD_EDGE_RATIO) {
        errors.push(`单元 ${unit.id} 开头切在语音上：首部残留 ${(edge.head * 100).toFixed(1)}% 峰值（上限 ${MAX_HEAD_EDGE_RATIO * 100}%）`);
      }
    }
  }
  totalSpeech += record.durationSeconds;
}

// ---------- 3. 整轨与交付格式 ----------
if (!narration.available) errors.push('ep01-narration.generated.json 标记为不可用，Remotion 将渲染静音');
if (!narration.masterAudio) errors.push('ep01-narration.generated.json 缺少 masterAudio');

const expectedSeconds = meta.totalFrames / meta.fps;
if (Math.abs(narration.durationSeconds - expectedSeconds) > 0.01) {
  errors.push(`音轨描述时长 ${narration.durationSeconds}s ≠ 时间轴 ${expectedSeconds.toFixed(3)}s`);
}

if (!fs.existsSync(MASTER_WAV)) {
  errors.push('缺少 narration/ep01/master.wav，请执行 npm run narration:track');
} else {
  const master = wavInfo(MASTER_WAV);
  if (!master) errors.push('master.wav 无法解析');
  else {
    if (Math.abs(master.seconds - expectedSeconds) > 0.01) {
      errors.push(`master.wav 时长 ${master.seconds.toFixed(3)}s ≠ 时间轴 ${expectedSeconds.toFixed(3)}s`);
    }
    if (master.rate !== index.config.sample_rate) errors.push(`master.wav 采样率 ${master.rate} ≠ 配置 ${index.config.sample_rate}`);
  }
}

if (!fs.existsSync(MASTER_MP3)) {
  errors.push('缺少 public/narration/ep01-narration.mp3，Remotion staticFile 将失败');
} else {
  if (fs.statSync(MASTER_MP3).size < 1024) errors.push('交付 MP3 体积异常（过小）');
  if (ffmpegPath) {
    try {
      execFileSync(ffmpegPath, ['-v', 'error', '-i', MASTER_MP3, '-f', 'null', '-'], {stdio: 'pipe'});
    } catch (error) {
      errors.push('交付 MP3 解码失败：' + String(error.message).split('\n')[0]);
    }
  }
}

// ---------- 4. 字级字幕时码 ----------
const withTimestamp = captions.filter((c) => typeof c.timestampMs === 'number');
if (narration.wordLevelCaptions && withTimestamp.length !== captions.length) {
  errors.push(`字幕真实时码覆盖不全：${withTimestamp.length}/${captions.length}`);
}
let prevEnd = -1;
let shortCues = 0;
for (const cue of captions) {
  if (cue.startMs >= cue.endMs) errors.push(`字幕 ${cue.id} 区间非法（${cue.startMs}ms → ${cue.endMs}ms）`);
  if (cue.startMs < prevEnd - 1) errors.push(`字幕 ${cue.id} 与上一条重叠`);
  if (cue.endMs - cue.startMs < 200) shortCues += 1;
  if (narration.wordLevelCaptions && typeof cue.confidence !== 'number') {
    errors.push(`字幕 ${cue.id} 缺少 provider 置信度`);
  }
  prevEnd = cue.endMs;
}
if (shortCues) warnings.push(`${shortCues} 条字幕显示时长 < 200ms（逐字短句，人工复核）`);
if (meta.captionTimestampSource !== 'provider') {
  warnings.push(`时间轴 captionTimestampSource=${meta.captionTimestampSource}`);
}

const measuredCharsPerSec = index.totalChars / Math.max(totalSpeech, 1e-6);
const silenceRatio = 1 - index.totalSeconds / meta.totalSeconds;

console.log(
  `[check-narration] units=${index.unitCount} speech=${index.totalSeconds.toFixed(1)}s ` +
    `timeline=${meta.totalSeconds.toFixed(1)}s ${measuredCharsPerSec.toFixed(2)}字/秒 gap占比=${(silenceRatio * 100).toFixed(1)}%`,
);
if (warnings.length) {
  console.log('WARNINGS:');
  warnings.slice(0, 20).forEach((w) => console.log('  - ' + w));
  if (warnings.length > 20) console.log(`  ... 其余 ${warnings.length - 20} 条省略`);
}
if (errors.length) {
  console.log('ERRORS:');
  errors.slice(0, 30).forEach((e) => console.log('  - ' + e));
  if (errors.length > 30) console.log(`  ... 其余 ${errors.length - 30} 条省略`);
  process.exit(1);
}
console.log('[check-narration] PASS');
