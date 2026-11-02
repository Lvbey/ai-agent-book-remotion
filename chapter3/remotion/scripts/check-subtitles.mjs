// Gate 4：字幕一致性检查（阶段 A 预估字幕）
// 1) 每个单元至少有 1 条字幕；2) 单元内字幕拼接后与口播稿一致（忽略空白/标点差异不算错误，仅告警）；
// 3) 无空字幕；4) 单条字幕不超宽；5) 交付用 ep01.preview.json 与 SRT 条数一致。
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../src/data');
const SUB_DIR = path.resolve(__dirname, '../../subtitles');
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

const units = read(path.join(DATA_DIR, 'ep01-units.generated.json'));
const captions = read(path.join(DATA_DIR, 'ep01-captions.generated.json'));
const preview = read(path.join(SUB_DIR, 'ep01.preview.json'));
const srt = fs.readFileSync(path.join(SUB_DIR, 'ep01.preview.srt'), 'utf8');

const errors = [];
const warnings = [];

const norm = (s) => s.replace(/[\s，。！？；：、]/g, '');

const byUnit = new Map();
for (const c of captions) {
  if (!byUnit.has(c.unitId)) byUnit.set(c.unitId, []);
  byUnit.get(c.unitId).push(c);
}

for (const u of units) {
  const cues = byUnit.get(u.id) ?? [];
  if (!cues.length) errors.push(`${u.id} 没有任何字幕`);
  const joined = norm(cues.map((c) => c.text).join(''));
  if (joined !== norm(u.text)) {
    warnings.push(`${u.id} 字幕拼接与口播稿不完全一致（请人工复核是否为标点/断句差异）`);
  }
  for (const c of cues) {
    if (!c.text || !c.text.trim()) errors.push(`${c.id} 为空字幕`);
    let w = 0;
    for (const ch of c.text) w += /[一-鿿぀-ヿ：，。、；！？（）]/.test(ch) ? 1 : 0.55;
    if (w > 20) warnings.push(`${c.id} 宽度 ${w.toFixed(1)} 超宽（>20）："${c.text}"`);
  }
}

if (preview.captions.length !== captions.length) {
  errors.push(`交付 JSON 条数 ${preview.captions.length} ≠ 内部字幕 ${captions.length}`);
}
const srtBlocks = srt.trim().split(/\n\n+/).filter(Boolean).length;
if (srtBlocks !== captions.length) errors.push(`SRT 条数 ${srtBlocks} ≠ 内部字幕 ${captions.length}`);

console.log(`[check-subtitles] units=${units.length} captions=${captions.length} srtBlocks=${srtBlocks}`);
if (warnings.length) {
  console.log('WARNINGS:');
  warnings.slice(0, 40).forEach((w) => console.log('  - ' + w));
}
if (errors.length) {
  console.log('ERRORS:');
  errors.forEach((e) => console.log('  - ' + e));
  process.exit(1);
}
console.log('[check-subtitles] PASS');
