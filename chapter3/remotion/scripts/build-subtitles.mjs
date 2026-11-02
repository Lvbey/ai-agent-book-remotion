// 生成 EP01 的时间轴与字幕：唯一数据源。
//
// 两级模式，由 narration/ep01/audio-index.json 是否存在自动切换：
//   A（无音频）：按「汉字当量 / 5.0 字每秒」预估单元时长，字幕按字重比例分配，时码标记为预估。
//   B（有音频）：单元时长取真实语音时长（已做首尾静音归一化）+ 固定呼吸间隙；
//              字幕仍按原有标点规则切分，但区间改由 provider 字级时间戳对齐（真实时码）。
// 任何单元缺失音频时立即失败，避免出现「一半真实、一半预估」的混合时间轴。
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {alignCues, spokenChars} from './lib/align-cues.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'src/data');
const UNITS_DIR = path.join(DATA_DIR, 'units');
const SUBTITLE_DIR = path.resolve(ROOT, '../subtitles');
const AUDIO_INDEX = path.join(ROOT, 'narration/ep01/audio-index.json');
const NARRATION_DIR = path.join(ROOT, 'narration/ep01');

const FPS = 30;
const CHARS_PER_SEC = 5.0; // 无音频时的口播速率基准（汉字当量/秒）
const UNIT_GAP_SEC = 0.2; // 语义单元间呼吸停顿
const MIN_UNIT_SEC = 4.0; // 无音频时的单元最短时长
const MAX_CUE_WIDTH = 18; // 单行字幕最大宽度（汉字当量）
const MIN_CUE_SEC = 0.9; // 无音频时单条字幕最短显示时长
const MIN_CUE_FRAMES = 12; // 有音频时单条字幕最少显示帧数（0.4s）
const CUE_TAIL_FRAMES = 8; // 末条字幕在语音结束后的停留帧数

const SECTIONS = ['s0', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9'];
const SECTION_ID = {s0: 'S0', s1: 'S1', s2: 'S2', s3: 'S3', s4: 'S4', s5: 'S5', s6: 'S6', s7: 'S7', s8: 'S8', s9: 'S9'};

/** 汉字当量：CJK 计 1，ASCII 字母数字计 0.4，其余计 0.15。用于时长预估。 */
const speechWeight = (text) => {
  let w = 0;
  for (const ch of text) {
    if (/[一-鿿぀-ヿ]/.test(ch)) w += 1;
    else if (/[A-Za-z0-9]/.test(ch)) w += 0.4;
    else w += 0.15;
  }
  return w;
};

/** 显示宽度：CJK 计 1，其余计 0.55。用于字幕折行。 */
const displayWidth = (text) => {
  let w = 0;
  for (const ch of text) {
    if (/[一-鿿぀-ヿ：，。、；！？（）]/.test(ch)) w += 1;
    else w += 0.55;
  }
  return w;
};

/** 按标点把口播稿切成自然语义字幕条；对无标点的长片按宽度强制折断。 */
const forceSplit = (cue) => {
  if (displayWidth(cue) <= MAX_CUE_WIDTH) return [cue];
  const out = [];
  let cur = '';
  for (const ch of cue) {
    if (cur && displayWidth(cur + ch) > MAX_CUE_WIDTH) {
      out.push(cur);
      cur = ch;
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) out.push(cur);
  return out;
};

const splitCues = (text) => {
  const pieces = text.match(/[^，。！？；：、]+[，。！？；：、]?/g) || [text];
  const merged = [];
  let cur = '';
  for (const piece of pieces) {
    if (cur && displayWidth(cur + piece) > MAX_CUE_WIDTH) {
      merged.push(cur);
      cur = piece;
    } else {
      cur += piece;
    }
  }
  if (cur.trim()) merged.push(cur);
  // 1) 强制折断超宽条
  let cues = merged.flatMap(forceSplit).filter((c) => c.trim().length > 0);
  // 2) 合并过短的尾条（避免 <1s 的碎字幕），前提是不超宽
  const finalCues = [];
  for (const c of cues) {
    const prev = finalCues[finalCues.length - 1];
    if (prev && displayWidth(c) < 5 && displayWidth(prev + c) <= MAX_CUE_WIDTH) {
      finalCues[finalCues.length - 1] = prev + c;
    } else {
      finalCues.push(c);
    }
  }
  return finalCues;
};

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

// ---------- 音频索引（可选） ----------
let audioIndex = null;
if (fs.existsSync(AUDIO_INDEX)) {
  audioIndex = readJson(AUDIO_INDEX);
  if (!audioIndex.complete) {
    console.error('[build-subtitles] 音频索引不完整，缺少单元：' + (audioIndex.missing ?? []).join(','));
    console.error('[build-subtitles] 请先执行 python scripts/tts-synthesize.py --all');
    process.exit(1);
  }
}
const audioByUnit = new Map((audioIndex?.units ?? []).map((u) => [u.id, u]));
const useAudio = audioByUnit.size > 0;

const rawUnits = [];
for (const sec of SECTIONS) {
  const list = readJson(path.join(UNITS_DIR, `${sec}.json`));
  for (const u of list) rawUnits.push({...u, section: SECTION_ID[sec]});
}

if (useAudio) {
  const missing = rawUnits.filter((u) => !audioByUnit.has(u.id)).map((u) => u.id);
  if (missing.length) {
    console.error('[build-subtitles] 音频索引缺少单元：' + missing.join(','));
    process.exit(1);
  }
}

// ---------- 时间轴 ----------
let cursor = 0;
const units = rawUnits.map((u, index) => {
  const audio = audioByUnit.get(u.id);
  const speechSeconds = audio ? audio.durationSeconds : Math.max(MIN_UNIT_SEC, speechWeight(u.text) / CHARS_PER_SEC);
  const duration = audio
    ? Math.ceil((speechSeconds + UNIT_GAP_SEC) * FPS)
    : Math.round((speechSeconds + UNIT_GAP_SEC) * FPS);
  const unit = {
    ...u,
    index,
    start: cursor,
    duration,
    end: cursor + duration,
    seconds: duration / FPS,
    speechSeconds,
    ...(audio ? {audioSeconds: audio.durationSeconds, timestampSource: audio.timestampSource} : {}),
  };
  cursor += duration;
  return unit;
});

const totalFrames = cursor;

// ---------- 字幕切分与定时 ----------
const captions = [];
const unitsWithCues = units.map((u) => {
  const cues = splitCues(u.text);
  const audio = audioByUnit.get(u.id);
  let words = null;
  if (audio && audio.timestampSource === 'provider') {
    const wordsPath = path.join(NARRATION_DIR, audio.words);
    if (fs.existsSync(wordsPath)) words = readJson(wordsPath);
  }
  const aligned = useAudio && words ? alignCues(cues, words, u.speechSeconds) : null;

  const boundaries = [];
  if (aligned) {
    for (let i = 0; i < cues.length; i++) {
      let from = u.start + Math.round(aligned[i].startSec * FPS);
      let to = u.start + Math.round(aligned[i].endSec * FPS);
      from = Math.max(u.start, Math.min(from, u.end - 1));
      to = Math.max(from + 1, Math.min(to, u.end));
      if (i === cues.length - 1) {
        const hold = Math.min(u.end - 2, u.start + Math.round(u.speechSeconds * FPS) + CUE_TAIL_FRAMES);
        to = Math.max(to, hold);
      }
      boundaries.push({from, to});
    }
    // 单调化：前一条结束不得晚于后一条开始
    for (let i = 1; i < boundaries.length; i++) {
      if (boundaries[i].from < boundaries[i - 1].to) boundaries[i].from = boundaries[i - 1].to;
      if (boundaries[i].to <= boundaries[i].from) boundaries[i].to = Math.min(u.end, boundaries[i].from + 1);
    }
    // 最末条不得越过单元末尾
    boundaries[boundaries.length - 1].to = Math.min(boundaries[boundaries.length - 1].to, u.end);
    // 保证最短 0.4s 显示：在不越过下一条起点的前提下前移起点
    for (let i = boundaries.length - 1; i >= 0; i--) {
      const b = boundaries[i];
      if (b.to - b.from < MIN_CUE_FRAMES) {
        const lower = i === 0 ? u.start : boundaries[i - 1].to;
        b.from = Math.max(lower, b.to - MIN_CUE_FRAMES);
      }
    }
  }

  let accFrames = 0;
  const cueList = cues.map((text, i) => {
    let from;
    let to;
    let timestampMs = null;
    let confidence = null;
    if (boundaries.length) {
      from = boundaries[i].from;
      to = boundaries[i].to;
      timestampMs = Math.round(((from + to) * 500) / FPS);
      confidence = aligned[i].confidence === null ? null : Math.round(aligned[i].confidence * 10000) / 10000;
    } else {
      // 阶段 A 或词表缺失：按字重比例分配，时码明确标记为预估（null）
      const weights = cues.map((c) => Math.max(0.4, speechWeight(c)));
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      const span = Math.max(FPS * 1, Math.round(u.duration * 0.92));
      const spanSec = span / FPS;
      const durSec = weights.map((w) => Math.max(MIN_CUE_SEC, (spanSec * w) / totalWeight));
      let over = durSec.reduce((a, b) => a + b, 0) - spanSec;
      for (let guard = 0; guard < 8 && over > 0.001; guard++) {
        const headroom = durSec.map((d) => Math.max(0, d - MIN_CUE_SEC));
        const headroomSum = headroom.reduce((a, b) => a + b, 0);
        if (headroomSum < 1e-6) break;
        durSec.forEach((d, k) => {
          durSec[k] = Math.max(MIN_CUE_SEC, d - (over * headroom[k]) / headroomSum);
        });
        over = durSec.reduce((a, b) => a + b, 0) - spanSec;
      }
      from = u.start + accFrames;
      accFrames += Math.round(durSec[i] * FPS);
      to = u.start + accFrames;
      if (i === cues.length - 1) to = Math.max(to, Math.min(u.end, u.start + Math.round(u.duration * 0.96)));
    }
    const cue = {
      id: `${u.id}-C${String(i + 1).padStart(2, '0')}`,
      unitId: u.id,
      text,
      startMs: Math.round((from / FPS) * 1000),
      endMs: Math.round((to / FPS) * 1000),
      timestampMs,
      confidence,
    };
    captions.push({...cue, startFrame: from, endFrame: to});
    return cue;
  });
  return {...u, cues: cueList};
});

// ---------- 写出生成文件 ----------
fs.mkdirSync(SUBTITLE_DIR, {recursive: true});
fs.writeFileSync(path.join(DATA_DIR, 'ep01-units.generated.json'), JSON.stringify(unitsWithCues, null, 2), 'utf8');
fs.writeFileSync(path.join(DATA_DIR, 'ep01-captions.generated.json'), JSON.stringify(captions, null, 2), 'utf8');

const fallbackUnits = units.filter((u) => u.timestampSource && u.timestampSource !== 'provider').map((u) => u.id);
const realSpeechSeconds = units.reduce((sum, u) => sum + u.speechSeconds, 0);

const meta = {
  episode: 'EP01',
  title: '用户记忆系统',
  fps: FPS,
  width: 1920,
  height: 1080,
  totalFrames,
  totalSeconds: totalFrames / FPS,
  unitCount: units.length,
  captionCount: captions.length,
  charsPerSec: useAudio ? Math.round((units.reduce((s, u) => s + u.text.length, 0) / realSpeechSeconds) * 100) / 100 : CHARS_PER_SEC,
  estimated: !useAudio,
  captionTimestampSource: !useAudio ? 'estimated' : fallbackUnits.length ? 'mixed' : 'provider',
  speechSeconds: Math.round(realSpeechSeconds * 1000) / 1000,
  gapSeconds: UNIT_GAP_SEC,
  audio: useAudio
    ? {
        provider: audioIndex.provider,
        sampleRate: audioIndex.config.sample_rate,
        speaker: audioIndex.config.speaker,
        speechRate: audioIndex.config.speech_rate,
        resource: audioIndex.config.resource,
        unitCount: audioIndex.unitCount,
        fallbackUnits,
        wordLevelTimestamps: fallbackUnits.length === 0,
      }
    : null,
  note: useAudio
    ? '阶段 B 真实语音时间轴：单元时长取配音音频实测值（已裁首尾静音），字幕区间由 provider 字级时间戳对齐。'
    : '阶段 A 预估时间轴：由口播稿字数按 5.0 汉字当量/秒推导，非真实语音时间戳。',
};
fs.writeFileSync(path.join(DATA_DIR, 'ep01-meta.generated.json'), JSON.stringify(meta, null, 2), 'utf8');

// ---------- 旁白音轨描述（供 Remotion 静态资源引用） ----------
// 只描述「应该有什么」；实际音频由 scripts/build-narration-track.mjs 生成，
// 缺失时由 scripts/check-narration.mjs 报错，避免渲染出静音成片却无人察觉。
const narrationDescriptor = {
  available: useAudio,
  masterAudio: useAudio ? 'narration/ep01-narration.mp3' : null,
  durationSeconds: Math.round((totalFrames / FPS) * 1000) / 1000,
  sampleRate: useAudio ? audioIndex.config.sample_rate : null,
  provider: useAudio ? audioIndex.provider : null,
  speaker: useAudio ? audioIndex.config.speaker : null,
  speechRate: useAudio ? audioIndex.config.speech_rate : null,
  unitCount: units.length,
  totalSpeechSeconds: Math.round(realSpeechSeconds * 1000) / 1000,
  wordLevelCaptions: useAudio && fallbackUnits.length === 0,
  units: units.map((u) => ({
    id: u.id,
    startFrame: u.start,
    durationInFrames: u.duration,
    speechSeconds: Math.round(u.speechSeconds * 1000) / 1000,
  })),
};
fs.writeFileSync(path.join(DATA_DIR, 'ep01-narration.generated.json'), JSON.stringify(narrationDescriptor, null, 2), 'utf8');

// ---------- 交付字幕 ----------
const previewJson = {
  meta: {
    ...meta,
    schema: 'Remotion @remotion/captions Caption（扩展 startFrame/endFrame/unitId）',
    estimatedTiming: !useAudio,
    wordLevelTimestamps: useAudio && fallbackUnits.length === 0,
    generatedFrom: 'chapter3/remotion/src/data/units/*.json + narration/ep01/audio-index.json',
  },
  captions: captions.map(({unitId, startFrame, endFrame, ...c}) => c),
};
fs.writeFileSync(path.join(SUBTITLE_DIR, 'ep01.preview.json'), JSON.stringify(previewJson, null, 2), 'utf8');

const srtTime = (ms) => {
  const total = Math.max(0, Math.round(ms));
  const h = Math.floor(total / 3600000);
  const m = Math.floor((total % 3600000) / 60000);
  const s = Math.floor((total % 60000) / 1000);
  const msRem = total % 1000;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(msRem).padStart(3, '0')}`;
};

const srt = captions
  .map((c, i) => `${i + 1}\n${srtTime(c.startMs)} --> ${srtTime(c.endMs)}\n${c.text}\n`)
  .join('\n');
fs.writeFileSync(path.join(SUBTITLE_DIR, 'ep01.preview.srt'), srt, 'utf8');

// 有音频时另存一份正式字幕命名，避免把「预估值码」误交付为正式版
if (useAudio) {
  fs.writeFileSync(path.join(SUBTITLE_DIR, 'ep01.voiced.json'), JSON.stringify(previewJson, null, 2), 'utf8');
  fs.writeFileSync(path.join(SUBTITLE_DIR, 'ep01.voiced.srt'), srt, 'utf8');
}

console.log(`[build-subtitles] mode=${useAudio ? 'B(audio)' : 'A(estimated)'} units=${units.length} captions=${captions.length}`);
console.log(`[build-subtitles] totalFrames=${totalFrames} (${(totalFrames / FPS / 60).toFixed(2)} min) speech=${realSpeechSeconds.toFixed(1)}s charsPerSec=${meta.charsPerSec}`);
if (fallbackUnits.length) console.log(`[build-subtitles] WARNING 缺失字级时间戳的单元（已回退比例分配）: ${fallbackUnits.join(',')}`);
