/**
 * 静态布局守卫：阻止已修复过的 Chip 重叠问题回归。
 *
 * 背景：Chip 默认 position:absolute；若直接放入 flex 流式容器，
 * 外层 wrapper 会因没有流内尺寸而坍缩为 0×0，所有 Chip 便叠在 (0,0)。
 * 流式布局必须显式写 <Chip flow ...>。
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCENES = path.resolve(__dirname, '../src/scenes');
const failures = [];

for (const file of fs.readdirSync(SCENES).filter((f) => f.endsWith('.tsx'))) {
  const source = fs.readFileSync(path.join(SCENES, file), 'utf8');
  for (const match of source.matchAll(/<Chip\b[\s\S]*?\/>/g)) {
    const tag = match[0];
    if (tag.includes('x={0}') && tag.includes('y={0}') && !/\bflow\b/.test(tag)) {
      const line = source.slice(0, match.index).split('\n').length;
      failures.push(`${file}:${line} ${tag.replace(/\s+/g, ' ')}`);
    }
  }
}

if (failures.length) {
  console.error('[check-layout] FAIL：以下 Chip 疑似在流式布局中缺少 flow：');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log('[check-layout] PASS：所有 (0,0) Chip 均显式声明布局模式');
