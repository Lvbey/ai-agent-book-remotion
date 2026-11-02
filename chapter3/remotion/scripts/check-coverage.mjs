// Gate 4：覆盖率核验
// 口径：一个原子知识点被「真正讲解」= 至少有一个语义单元把该 kp 列入 kp 数组，
// 且该单元确实渲染了对应的视觉事件（由 Gate 3 的分镜保证）。
// 这里核验「被引用」这一必要条件；是否「讲解到位」属于 Gate 5 人工审核。
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../src/data');
const read = (p) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, p), 'utf8'));

const kps = read('ep01-coverage.json');
const units = read('ep01-units.generated.json');

const refMap = new Map();
for (const u of units) {
  for (const id of u.kp) {
    if (!refMap.has(id)) refMap.set(id, []);
    refMap.get(id).push(u.id);
  }
}

const unknown = [];
for (const u of units) {
  for (const id of u.kp) if (!kps.find((k) => k.id === id)) unknown.push(`${u.id} 引用了未定义的知识点 ${id}`);
}

const total = kps.length;
let covered = 0;
let p0Total = 0;
let p0Covered = 0;
const uncovered = [];
for (const kp of kps) {
  const refs = refMap.get(kp.id) ?? [];
  const ok = refs.length > 0;
  if (ok) covered++;
  else uncovered.push(kp);
  if (kp.importance === 'P0') {
    p0Total++;
    if (ok) p0Covered++;
  }
}

const pct = ((covered / total) * 100).toFixed(1);
const p0Pct = ((p0Covered / p0Total) * 100).toFixed(1);

console.log(`[check-coverage] 原子知识点 ${covered}/${total} = ${pct}%（最低 80%，目标 90%）`);
console.log(`[check-coverage] P0 核心项 ${p0Covered}/${p0Total} = ${p0Pct}%（必须 100%）`);
if (unknown.length) {
  console.log('ERRORS（引用未定义知识点）:');
  unknown.forEach((e) => console.log('  - ' + e));
}
if (uncovered.length) {
  console.log('未覆盖知识点:');
  uncovered.forEach((k) => console.log(`  - [${k.importance}] ${k.id} ${k.learningOutcome}`));
}
if (unknown.length || p0Covered !== p0Total || covered / total < 0.8) {
  console.log('[check-coverage] FAIL');
  process.exit(1);
}
console.log(`[check-coverage] PASS（${covered / total >= 0.9 ? '达到' : '未达到'} 90% 目标）`);
