/**
 * 把逐单元的旁白 WAV 按帧对齐拼成整轨，并编码为 Remotion 可用的静态资源。
 *
 * 为什么按帧对齐而不是简单首尾相接：
 *   画面时间轴由 build-subtitles.mjs 以「整帧」为单位排布，音频必须以采样级精确
 *   地落在对应帧起点上，否则误差会逐单元累积，数分钟后出现明显的声画偏移。
 *   48000 Hz / 30 fps = 1600 samples/帧，因此 startFrame × 1600 即目标采样点。
 *
 * 输出：
 *   narration/ep01/master.wav                  未压缩整轨（可复现、体积大，不入库）
 *   public/narration/ep01-narration.mp3        Remotion 渲染用音轨
 *   narration/ep01/master.manifest.json        时长、采样点、电平与偏差自检结果
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const NARRATION_DIR = path.join(ROOT, 'narration/ep01');
const AUDIO_INDEX = path.join(NARRATION_DIR, 'audio-index.json');
const UNITS_FILE = path.join(ROOT, 'src/data/ep01-units.generated.json');
const META_FILE = path.join(ROOT, 'src/data/ep01-meta.generated.json');
const MASTER_WAV = path.join(NARRATION_DIR, 'master.wav');
const PUBLIC_DIR = path.join(ROOT, 'public/narration');
const MASTER_MP3 = path.join(PUBLIC_DIR, 'ep01-narration.mp3');
const MASTER_MANIFEST = path.join(NARRATION_DIR, 'master.manifest.json');

const SAMPLE_RATE = 48000;
const BYTES_PER_SAMPLE = 2;
/**
 * 交付响度：TTS 干声峰值高、有效值低（实测整片 -23.4 LUFS / 峰值 -2.3 dBFS），
 * 直接交付在网络播放器里偏轻；同时单声道上混立体声会被等功率声像定律再压 3 dB。
 * 因此整轨统一做两遍 loudnorm，并按立体声输出，使成片响度与声道都不再依赖下游行为。
 */
const TARGET_LUFS = -18;
const TARGET_TP = -1.5;
const TARGET_LRA = 11;

/** 读取 PCM16 单声道 WAV，校验格式并返回 data 段。 */
const readWavPcm = (file) => {
  const buffer = fs.readFileSync(file);
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error(`${path.basename(file)} 不是合法 WAV`);
  }
  let offset = 12;
  let fmt = null;
  let data = null;
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
      data = buffer.subarray(body, Math.min(body + size, buffer.length));
    }
    offset = body + size + (size % 2);
  }
  if (!fmt || !data) throw new Error(`${path.basename(file)} 缺少 fmt/data 段`);
  if (fmt.format !== 1 || fmt.channels !== 1 || fmt.bits !== 16 || fmt.rate !== SAMPLE_RATE) {
    throw new Error(
      `${path.basename(file)} 格式不符：format=${fmt.format} ch=${fmt.channels} bits=${fmt.bits} rate=${fmt.rate}`,
    );
  }
  return data;
};

const pcm16Stats = (buffer) => {
  let peak = 0;
  let sumSq = 0;
  const count = buffer.length / BYTES_PER_SAMPLE;
  for (let i = 0; i < buffer.length; i += 2) {
    const v = buffer.readInt16LE(i);
    const abs = Math.abs(v);
    if (abs > peak) peak = abs;
    sumSq += v * v;
  }
  return {peak, rms: count ? Math.sqrt(sumSq / count) : 0};
};

const main = () => {
  if (!fs.existsSync(AUDIO_INDEX)) {
    throw new Error('缺少 narration/ep01/audio-index.json，请先执行 python scripts/tts-synthesize.py --all');
  }
  const index = JSON.parse(fs.readFileSync(AUDIO_INDEX, 'utf8'));
  if (!index.complete) throw new Error('音频索引不完整，缺少：' + (index.missing ?? []).join(','));
  const units = JSON.parse(fs.readFileSync(UNITS_FILE, 'utf8'));
  const meta = JSON.parse(fs.readFileSync(META_FILE, 'utf8'));
  const byId = new Map(index.units.map((u) => [u.id, u]));

  const samplesPerFrame = SAMPLE_RATE / meta.fps;
  if (!Number.isInteger(samplesPerFrame)) {
    throw new Error(`采样率 ${SAMPLE_RATE} 不能被 ${meta.fps}fps 整除，无法做采样级帧对齐`);
  }
  const totalSamples = Math.round(meta.totalFrames * samplesPerFrame);

  fs.mkdirSync(PUBLIC_DIR, {recursive: true});
  fs.mkdirSync(NARRATION_DIR, {recursive: true});

  const fd = fs.openSync(MASTER_WAV, 'w');
  const header = Buffer.alloc(44);
  header.write('RIFF', 0, 'ascii');
  header.write('WAVE', 8, 'ascii');
  header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * BYTES_PER_SAMPLE, 28);
  header.writeUInt16LE(BYTES_PER_SAMPLE, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36, 'ascii');
  fs.writeSync(fd, header);

  const silenceChunk = Buffer.alloc(4800 * BYTES_PER_SAMPLE); // 100ms 静音块，避免大块分配
  let written = 0; // 已写入采样数
  let maxDrift = 0;
  let sumSq = 0;
  let peak = 0;

  const writeSilence = (samples) => {
    let remaining = samples;
    while (remaining > 0) {
      const take = Math.min(remaining, 4800);
      fs.writeSync(fd, silenceChunk, 0, take * BYTES_PER_SAMPLE);
      remaining -= take;
    }
  };

  for (const unit of units) {
    const record = byId.get(unit.id);
    if (!record) throw new Error(`单元 ${unit.id} 缺少音频`);
    const target = unit.start * samplesPerFrame;
    if (target < written) {
      throw new Error(`单元 ${unit.id} 起点 ${target} 早于已写入位置 ${written}（时间轴与音频冲突）`);
    }
    const drift = target - written;
    if (drift > maxDrift) maxDrift = drift;
    writeSilence(drift);
    written = target;

    const pcm = readWavPcm(path.join(NARRATION_DIR, record.audio));
    if (pcm.length % BYTES_PER_SAMPLE) throw new Error(`单元 ${unit.id} PCM 长度非偶数`);
    const audioSamples = pcm.length / BYTES_PER_SAMPLE;
    if (written + audioSamples > totalSamples) {
      throw new Error(`单元 ${unit.id} 音频越出舞台总长（${written + audioSamples} > ${totalSamples}）`);
    }
    fs.writeSync(fd, pcm);
    written += audioSamples;

    const stats = pcm16Stats(pcm);
    peak = Math.max(peak, stats.peak);
    sumSq += stats.rms * stats.rms * audioSamples;
  }

  if (written < totalSamples) writeSilence(totalSamples - written);
  written = totalSamples;

  const dataBytes = written * BYTES_PER_SAMPLE;
  fs.writeSync(fd, Buffer.alloc(0));
  fs.closeSync(fd);
  const patch = Buffer.alloc(8);
  patch.writeUInt32LE(36 + dataBytes, 0);
  patch.writeUInt32LE(dataBytes, 4);
  const handle = fs.openSync(MASTER_WAV, 'r+');
  fs.writeSync(handle, patch.subarray(0, 4), 0, 4, 4); // RIFF chunk size
  fs.writeSync(handle, patch.subarray(4, 8), 0, 4, 40); // data chunk size
  fs.closeSync(handle);

  const durationSeconds = written / SAMPLE_RATE;
  const masterBytes = fs.statSync(MASTER_WAV).size;
  if (masterBytes !== 44 + dataBytes) {
    throw new Error(`主轨 WAV 体积异常：${masterBytes} ≠ ${44 + dataBytes}`);
  }

  if (!ffmpegPath) throw new Error('未找到 ffmpeg-static 可执行文件');

  const run = (args) => {
    const result = spawnSync(ffmpegPath, args, {encoding: 'utf8', maxBuffer: 64 * 1024 * 1024});
    if (result.status !== 0) {
      throw new Error('ffmpeg 失败：' + (result.stderr || result.error?.message || '').trim().slice(-400));
    }
    return result.stderr || '';
  };

  // 第一遍：只测量整轨响度，不写文件。
  const measureStderr = run([
    '-hide_banner', '-nostats', '-i', MASTER_WAV,
    '-af', `loudnorm=I=${TARGET_LUFS}:TP=${TARGET_TP}:LRA=${TARGET_LRA}:print_format=json`,
    '-f', 'null', '-',
  ]);
  const jsonBlocks = [...measureStderr.matchAll(/\{[\s\S]*?\}/g)].map((m) => m[0]);
  let measured = null;
  for (const block of jsonBlocks.reverse()) {
    try {
      const parsed = JSON.parse(block);
      if ('input_i' in parsed) {
        measured = parsed;
        break;
      }
    } catch {
      /* 非 JSON 块，跳过 */
    }
  }
  if (!measured) throw new Error('第一遍 loudnorm 未返回可解析的测量结果');

  // 第二遍：带测量值做归一化，linear 模式优先保证动态不被压缩，TP 超限时由 ffmpeg 自行钳制。
  const normalizeFilter =
    `loudnorm=I=${TARGET_LUFS}:TP=${TARGET_TP}:LRA=${TARGET_LRA}` +
    `:measured_I=${measured.input_i}:measured_TP=${measured.input_tp}` +
    `:measured_LRA=${measured.input_lra}:measured_thresh=${measured.input_thresh}` +
    `:offset=${measured.target_offset}:linear=true:print_format=summary`;

  run([
    '-y', '-hide_banner', '-nostats',
    '-i', MASTER_WAV,
    '-af', normalizeFilter,
    '-ac', '2', '-ar', String(SAMPLE_RATE),
    '-c:a', 'libmp3lame', '-b:a', '192k',
    MASTER_MP3,
  ]);

  // 复核：编码后的成品响度必须落在目标附近，避免「标称归一但实际没生效」。
  const verifyStderr = run([
    '-hide_banner', '-nostats', '-i', MASTER_MP3,
    '-af', 'ebur128=peak=true', '-f', 'null', '-',
  ]);
  // 注：ebur128 的进度行会持续打印瞬时值（初始为 -70 LUFS），只取 Summary 段才准确。
  const summary = verifyStderr.slice(verifyStderr.lastIndexOf('Summary:'));
  const pick = (label) => {
    const m = summary.match(new RegExp(`${label}:\\s*(-?\\d+(?:\\.\\d+)?)`));
    return m ? Number(m[1]) : null;
  };
  const encLufs = pick('I');
  const encPeak = pick('Peak');
  if (encLufs === null || Math.abs(encLufs - TARGET_LUFS) > 1.5) {
    throw new Error(`整轨响度未达目标：${encLufs} LUFS（目标 ${TARGET_LUFS}）`);
  }
  if (encPeak !== null && encPeak > -0.5) {
    throw new Error(`整轨真峰值过高：${encPeak} dBFS`);
  }

  const manifest = {
    episode: 'EP01',
    source: 'narration/ep01/segments/*/audio.wav',
    durationSeconds: Math.round(durationSeconds * 1000) / 1000,
    totalFrames: meta.totalFrames,
    fps: meta.fps,
    sampleRate: SAMPLE_RATE,
    samplesPerFrame,
    totalSamples: written,
    masterWavBytes: masterBytes,
    masterMp3Bytes: fs.statSync(MASTER_MP3).size,
    maxGapSamples: maxDrift,
    peak,
    peakDbfs: Math.round(20 * Math.log10(Math.max(peak, 1) / 32768) * 10) / 10,
    rmsDbfs: Math.round(20 * Math.log10(Math.max(Math.sqrt(sumSq / Math.max(1, written)), 1) / 32768) * 10) / 10,
    outputChannels: 2,
    loudness: {
      targetLufs: TARGET_LUFS,
      targetTruePeak: TARGET_TP,
      measuredInputLufs: Number(measured.input_i),
      measuredInputTruePeak: Number(measured.input_tp),
      outputLufs: encLufs,
      outputTruePeak: encPeak,
    },
    frameAligned: true,
  };
  fs.writeFileSync(MASTER_MANIFEST, JSON.stringify(manifest, null, 2), 'utf8');

  console.log(
    `[build-narration-track] ${durationSeconds.toFixed(2)}s ${meta.totalFrames} 帧 ` +
      `peak=${manifest.peakDbfs}dBFS rms=${manifest.rmsDbfs}dBFS ` +
      `loudness ${measured.input_i}→${encLufs} LUFS (TP ${encPeak}dBFS) ` +
      `→ public/narration/ep01-narration.mp3 (${(manifest.masterMp3Bytes / 1024 / 1024).toFixed(1)} MB)`,
  );
};

try {
  main();
} catch (error) {
  console.error('[build-narration-track] FAIL：' + error.message);
  process.exit(1);
}
