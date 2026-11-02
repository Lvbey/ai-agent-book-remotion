/**
 * 逐秒视觉 QA：对成片做真实抽帧差分，检测画面停滞（静态贴图）区段。
 *
 * 方法（校准过的阈值，详见 Gate 4 记录）：
 *   1. ffmpeg 以 10fps 抽取灰度帧（scale=224x126），输出 rawvideo gray
 *   2. 逐帧计算相邻帧的平均绝对差分（0~255），按秒聚合为该秒的「总运动量」
 *      —— 每秒运动量 = 该秒内 10 帧采样点之间 9 个差分之和，能稳定区分
 *         「编码噪声级静止」（≈0.02）与「正常细腻动画」（≈0.7）
 *   3. 连续运动量过低的秒数构成「停滞段」，超出阈值即判为缺陷
 *   4. 与语义单元边界对齐：落在单元尾部呼吸区/单元间隙的静止属预期行为
 *
 * 用法：node scripts/check-visual.mjs [视频路径]
 * 产物：qa/visual-per-second.json、qa/visual-qa-ep01.md、qa/visual-per-second.full.json
 */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';

const ROOT = path.resolve(process.cwd());
const VIDEO = process.argv[2] || path.join(ROOT, 'out/EP01-silent-review.mp4');

const FPS = 30;
const SAMPLE_FPS = 10; // 抽帧率：聚合到秒级，兼顾稳健与内存
const W = 224;
const H = 126;
const FRAME_BYTES = W * H;

// 判定阈值（基于真实片段校准：噪声底 ≈0.02，正常动画中位 ≈0.7）
const MOTION_DEAD = 0.1; // 低于此值视为「几乎无变化」（0~255，秒级累计）
const MOTION_LOW = 0.3; // 低于此值视为「变化偏弱」
const MAX_STATIC_RUN = 3; // 连续静止超过该秒数即判为停滞缺陷
const MAX_LOW_RUN = 8; // 连续弱变化超过该秒数即给出提示

const units = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src/data/ep01-units.generated.json'), 'utf8')
);
const totalFrames = units[units.length - 1].end;
const totalSeconds = Math.floor(totalFrames / FPS);

if (!fs.existsSync(VIDEO)) {
  console.error(`[check-visual] 找不到成片：${VIDEO}`);
  process.exit(1);
}

console.log(`[check-visual] 源：${path.relative(ROOT, VIDEO)}`);
console.log(`[check-visual] 抽取 @${SAMPLE_FPS}fps → ${W}x${H} gray，再聚合到 ${totalSeconds} 秒`);

const raw = execFileSync(
  ffmpegPath,
  [
    '-v', 'error',
    '-i', VIDEO,
    '-vf', `scale=${W}:${H},format=gray`,
    '-r', String(SAMPLE_FPS),
    '-f', 'rawvideo',
    '-pix_fmt', 'gray',
    '-',
  ],
  {maxBuffer: 1 << 30, encoding: 'buffer'}
);

const frameCount = Math.floor(raw.length / FRAME_BYTES);
console.log(`[check-visual] 实际抽取采样帧数：${frameCount}`);
if (frameCount < totalSeconds * SAMPLE_FPS - SAMPLE_FPS * 2) {
  console.error('[check-visual] FAIL 抽帧数显著少于预期，成片可能截断');
  process.exit(1);
}

const frame = (i) => raw.subarray(i * FRAME_BYTES, (i + 1) * FRAME_BYTES);

// 逐帧差分
const frameDiff = new Array(frameCount).fill(0);
for (let i = 1; i < frameCount; i++) {
  const a = frame(i - 1);
  const b = frame(i);
  let sum = 0;
  for (let p = 0; p < FRAME_BYTES; p++) sum += Math.abs(b[p] - a[p]);
  frameDiff[i] = sum / FRAME_BYTES;
}
frameDiff[0] = frameDiff[1] ?? 0;

// 聚合到秒：第 s 秒的运动量 = 落在 [s*SAMPLE_FPS, (s+1)*SAMPLE_FPS) 内的差分之和
const motion = new Array(totalSeconds).fill(0);
for (let i = 1; i < frameCount; i++) {
  const s = Math.min(totalSeconds - 1, Math.floor(i / SAMPLE_FPS));
  motion[s] += frameDiff[i];
}
motion[0] = motion[0] || (motion[1] ?? 0);

/** 按帧号定位单元。 */
const unitAt = (f) => {
  let lo = 0;
  let hi = units.length - 1;
  let res = null;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (units[mid].start <= f) {
      res = units[mid];
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return res;
};

const rows = [];
for (let s = 0; s < totalSeconds; s++) {
  const f = s * FPS;
  const u = unitAt(f);
  const inUnit = u && f < u.end;
  const isGap = !inUnit;
  // 单元尾部 8% 为呼吸区，字幕已结束、画面保持，属预期静止
  const tailStart = u ? u.start + Math.round(u.duration * 0.92) : 0;
  const inTail = inUnit && f >= tailStart;
  rows.push({
    second: s,
    timecode: `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`,
    frame: f,
    motion: Number(motion[s].toFixed(3)),
    section: u ? u.section : '-',
    unitId: u ? u.id : '-',
    scene: u ? u.scene : '-',
    gap: isGap,
    tail: inTail,
  });
}

/** 扫描连续静止段。 */
const scanRuns = (predicate, minRun) => {
  const runs = [];
  let cur = null;
  for (const r of rows) {
    if (predicate(r)) {
      if (!cur) cur = {from: r.second, to: r.second, items: []};
      else cur.to = r.second;
      cur.items.push(r);
    } else if (cur) {
      if (cur.to - cur.from + 1 >= minRun) runs.push(cur);
      cur = null;
    }
  }
  if (cur && cur.to - cur.from + 1 >= minRun) runs.push(cur);
  return runs;
};

const deadRuns = scanRuns((r) => r.motion < MOTION_DEAD, MAX_STATIC_RUN);
const lowRuns = scanRuns((r) => r.motion < MOTION_LOW, MAX_LOW_RUN);

// 停滞段中「非预期」的：既不落在间隙，也不落在单元呼吸尾部
const unexpected = deadRuns.filter((run) => {
  const n = run.items.length;
  const ok = run.items.filter((r) => r.gap || r.tail).length;
  return ok / n < 0.6;
});

const tc = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

const byScene = {};
for (const r of rows) {
  const k = r.scene;
  byScene[k] = byScene[k] || {seconds: 0, sum: 0, min: Infinity, dead: 0};
  byScene[k].seconds++;
  byScene[k].sum += r.motion;
  byScene[k].min = Math.min(byScene[k].min, r.motion);
  if (r.motion < MOTION_DEAD) byScene[k].dead++;
}

const motions = rows.map((r) => r.motion).sort((a, b) => a - b);
const pct = (p) => motions[Math.min(motions.length - 1, Math.floor(motions.length * p))];

const report = {
  source: path.relative(ROOT, VIDEO),
  fps: FPS,
  sampleFps: SAMPLE_FPS,
  sampleFrames: frameCount,
  seconds: totalSeconds,
  totalSecondsExpected: totalSeconds,
  thresholds: {MOTION_DEAD, MOTION_LOW, MAX_STATIC_RUN, MAX_LOW_RUN},
  stats: {
    mean: Number((motions.reduce((a, b) => a + b, 0) / motions.length).toFixed(3)),
    p05: Number(pct(0.05).toFixed(3)),
    p25: Number(pct(0.25).toFixed(3)),
    median: Number(pct(0.5).toFixed(3)),
    p95: Number(pct(0.95).toFixed(3)),
    deadSeconds: rows.filter((r) => r.motion < MOTION_DEAD).length,
  },
  byScene: Object.fromEntries(
    Object.entries(byScene).map(([k, v]) => [
      k,
      {
        seconds: v.seconds,
        avgMotion: Number((v.sum / v.seconds).toFixed(3)),
        minMotion: Number(v.min.toFixed(3)),
        deadSeconds: v.dead,
      },
    ])
  ),
  deadRuns: deadRuns.map((r) => ({
    from: tc(r.from),
    to: tc(r.to),
    seconds: r.to - r.from + 1,
    avgMotion: Number((r.items.reduce((a, b) => a + b.motion, 0) / r.items.length).toFixed(3)),
    scene: r.items[0].scene,
    section: r.items[0].section,
    expected: !unexpected.includes(r),
  })),
  lowRuns: lowRuns.map((r) => ({
    from: tc(r.from),
    to: tc(r.to),
    seconds: r.to - r.from + 1,
    avgMotion: Number((r.items.reduce((a, b) => a + b.motion, 0) / r.items.length).toFixed(3)),
    scene: r.items[0].scene,
  })),
  perSecond: rows,
};

fs.mkdirSync(path.join(ROOT, 'qa'), {recursive: true});
fs.writeFileSync(
  path.join(ROOT, 'qa/visual-per-second.json'),
  JSON.stringify({...report, perSecond: undefined}, null, 2)
);
fs.writeFileSync(
  path.join(ROOT, 'qa/visual-per-second.full.json'),
  JSON.stringify(report, null, 2)
);

// Markdown 报告
const L = [];
L.push('# EP01 逐秒视觉 QA 报告（真实抽帧差分）');
L.push('');
L.push(`- 成片：\`${path.relative(path.join(ROOT, '..'), VIDEO)}\``);
L.push(`- 方法：ffmpeg @${SAMPLE_FPS}fps 抽帧 → ${W}×${H} 灰度 → 逐帧平均绝对差分 → 按秒聚合（0~255）`);
L.push(`- 覆盖：${totalSeconds} 秒（采样帧 ${frameCount}）`);
L.push(`- 判定阈值（基于真实片段校准：噪声底 ≈0.02，正常动画中位 ≈0.7）：静止 < ${MOTION_DEAD}；弱变化 < ${MOTION_LOW}；连续静止 ≥ ${MAX_STATIC_RUN}s 判停滞`);
L.push('');
L.push('## 一、全局分布');
L.push('');
L.push('| 指标 | 值 |');
L.push('| --- | --- |');
L.push(`| 平均运动量 | ${report.stats.mean} |`);
L.push(`| P05 / P25 | ${report.stats.p05} / ${report.stats.p25} |`);
L.push(`| 中位数 | ${report.stats.median} |`);
L.push(`| P95 | ${report.stats.p95} |`);
L.push(`| 静止秒数（< ${MOTION_DEAD}） | ${report.stats.deadSeconds} / ${totalSeconds} |`);
L.push('');
L.push('## 二、分场景运动量');
L.push('');
L.push('| 场景组件 | 秒数 | 平均运动量 | 最低运动量 | 静止秒数 |');
L.push('| --- | --- | --- | --- | --- |');
for (const [k, v] of Object.entries(report.byScene)) {
  L.push(`| \`${k}\` | ${v.seconds} | ${v.avgMotion} | ${v.minMotion} | ${v.deadSeconds} |`);
}
L.push('');
L.push('## 三、停滞段（连续静止 ≥ ' + MAX_STATIC_RUN + 's）');
L.push('');
if (deadRuns.length === 0) {
  L.push('无。全片不存在连续静止段。');
} else {
  L.push('| 起 | 止 | 时长 | 平均运动量 | 场景 | 分区 | 判定 |');
  L.push('| --- | --- | --- | --- | --- | --- | --- |');
  for (const r of report.deadRuns) {
    L.push(
      `| ${r.from} | ${r.to} | ${r.seconds}s | ${r.avgMotion} | \`${r.scene}\` | ${r.section} | ${r.expected ? '预期（间隙/呼吸）' : '**非预期，需修**'} |`
    );
  }
}
L.push('');
L.push(`非预期停滞段：**${unexpected.length}** 处。`);
L.push('');
L.push('## 四、弱变化段（连续 < ' + MOTION_LOW + '，≥ ' + MAX_LOW_RUN + 's，提示级）');
L.push('');
if (lowRuns.length === 0) {
  L.push('无。');
} else {
  L.push('| 起 | 止 | 时长 | 平均运动量 | 场景 |');
  L.push('| --- | --- | --- | --- | --- |');
  for (const r of report.lowRuns.slice(0, 60)) {
    L.push(`| ${r.from} | ${r.to} | ${r.seconds}s | ${r.avgMotion} | \`${r.scene}\` |`);
  }
  if (lowRuns.length > 60) L.push(`| … | … | 另有 ${lowRuns.length - 60} 段，见 JSON | | |`);
}
L.push('');
L.push('> 逐秒明细见 `qa/visual-per-second.full.json`（含每一秒的运动量、所属单元与场景）。');
L.push('');

fs.writeFileSync(path.join(ROOT, 'qa/visual-qa-ep01.md'), L.join('\n'));

const pass = frameCount >= totalSeconds * SAMPLE_FPS - SAMPLE_FPS * 2 && unexpected.length === 0;
console.log(
  `[check-visual] 静止段 ${deadRuns.length} 处，其中非预期 ${unexpected.length} 处；弱变化段 ${lowRuns.length} 处`
);
console.log(`[check-visual] ${pass ? 'PASS' : 'FAIL'}`);
process.exit(pass ? 0 : 1);
