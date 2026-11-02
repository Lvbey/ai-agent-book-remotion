// Gate 4：时间轴一致性检查
// 1) 单元首尾相接无重叠无空洞；2) 每单元 ≥ 最短时长；3) 字幕落在所属单元区间内；
// 4) 字幕按帧顺序单调、不重叠；5) 汇总总时长。
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../src/data');
const read = (p) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, p), 'utf8'));

const units = read('ep01-units.generated.json');
const captions = read('ep01-captions.generated.json');
const meta = read('ep01-meta.generated.json');

const errors = [];
const warnings = [];

let prevEnd = 0;
for (const u of units) {
  if (u.start !== prevEnd) errors.push(`${u.id} 起始帧 ${u.start} ≠ 前一单元结束 ${prevEnd}（空洞/重叠）`);
  prevEnd = u.end;
  if (u.seconds < 3.9) warnings.push(`${u.id} 时长 ${u.seconds.toFixed(2)}s 偏短`);
}
if (units.length && prevEnd !== meta.totalFrames) {
  errors.push(`总帧数不一致：单元累计 ${prevEnd} vs meta ${meta.totalFrames}`);
}

let prevCapEnd = -1;
let prevCapId = '';
for (const c of captions) {
  const owner = units.find((u) => u.id === c.unitId);
  if (!owner) {
    errors.push(`字幕 ${c.id} 找不到所属单元`);
    continue;
  }
  if (c.startFrame < owner.start || c.endFrame > owner.end) {
    errors.push(`字幕 ${c.id} 越出单元区间 [${owner.start}, ${owner.end}]`);
  }
  if (c.startFrame < prevCapEnd) {
    errors.push(`字幕 ${c.id} 与 ${prevCapId} 时间区间重叠`);
  }
  if (c.endMs - c.startMs < 500) warnings.push(`字幕 ${c.id} 显示时长 ${c.endMs - c.startMs}ms 偏短`);
  prevCapEnd = c.endFrame;
  prevCapId = c.id;
}

// 每秒覆盖检查：把全片按 1s 分桶，确认每桶都落在某个单元的有效区间（排除单元间隙）
const perSec = new Array(Math.ceil(meta.totalSeconds)).fill(false);
for (const u of units) {
  const speakEnd = u.start + Math.round(u.speechSeconds * meta.fps); // 讲话主体
  for (let s = Math.floor(u.start / meta.fps); s <= Math.floor(speakEnd / meta.fps); s++) {
    if (s >= 0 && s < perSec.length) perSec[s] = true;
  }
}
const uncovered = perSec.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
if (uncovered.length) warnings.push(`有 ${uncovered.length} 个秒级桶落在单元间隙（属正常呼吸停顿，人工复核）: ${uncovered.slice(0, 20).join(',')}`);

console.log(`[check-timeline] units=${units.length} captions=${captions.length} total=${(meta.totalSeconds / 60).toFixed(2)}min`);
if (warnings.length) {
  console.log('WARNINGS:');
  warnings.forEach((w) => console.log('  - ' + w));
}
if (errors.length) {
  console.log('ERRORS:');
  errors.forEach((e) => console.log('  - ' + e));
  process.exit(1);
}
console.log('[check-timeline] PASS');
