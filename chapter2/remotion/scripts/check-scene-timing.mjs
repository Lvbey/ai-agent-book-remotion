// 无依赖静态检查：防止动画逻辑帧提前跑完，造成长时间“定格 PPT”。
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'src/sceneTiming.ts'), 'utf8');
const matches = [...source.matchAll(/(\w+):\s*\{duration:\s*(\d+),\s*authoredEnd:\s*(\d+),\s*hold:\s*(\d+)\}/g)];
const specs = Object.fromEntries(matches.map(([, key, duration, authoredEnd, hold]) => [
  key, {duration: +duration, authoredEnd: +authoredEnd, hold: +hold},
]));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(matches.length === 13, `应有 13 个场景时钟，实际 ${matches.length}`);
const deepDive = fs.readFileSync(path.join(root, 'src/scenes/ChapterDeepDive.tsx'), 'utf8');
const regular = Object.keys(specs).filter((key) => !['ApiStructure', 'ChatTemplate', 'PromptEngineering', 'StateBar', 'CompressionStrategies', 'SubAgentIsolation'].includes(key));
const voice=JSON.parse(fs.readFileSync(path.join(root,'src/voice-timeline.json'),'utf8'));
for (const key of Object.keys(specs)) specs[key].duration=voice[key].duration;
let total = 0;
for (const [key, {duration, authoredEnd, hold}] of Object.entries(specs)) {
  total += duration;
  const scene = regular.includes(key)
    ? fs.readFileSync(path.join(root, `src/scenes/${key}.tsx`), 'utf8')
    : deepDive;
  assert(scene.includes(`useStoryFrame('${key}')`), `${key} 没有使用统一时钟`);
  assert(duration > hold && authoredEnd > 0, `${key} 时长参数非法`);
  assert(hold <= 90, `${key} 保留了超过 3 秒的定格尾帧`);
  const playableSeconds = (duration - hold) / 30;
  const oldFinishSeconds = authoredEnd / 30;
  const newFinishSeconds = playableSeconds;
  console.log(`${key.padEnd(22)} ${String(duration / 30).padStart(3)}s  关键动画铺满前 ${newFinishSeconds.toFixed(1)}s  末尾停留 ${(hold / 30).toFixed(1)}s`);
}
assert(total === Object.values(voice).reduce((sum,s)=>sum+s.duration,0), 'Voice duration mismatch');
const main = fs.readFileSync(path.join(root, 'src/MainVideo.tsx'), 'utf8');
for (const key of Object.keys(specs)) {
  assert(main.includes(`duration:SCENE_TIMING.${key}.duration`), `MainVideo 中 ${key} 的时长没有接入统一配置`);
}
for (const file of [...regular.map((key) => `${key}.tsx`), 'ChapterDeepDive.tsx']) {
  const text = fs.readFileSync(path.join(root, 'src/scenes', file), 'utf8');
  assert(!/useCurrentFrame\(\)\s*\*\s*[\d.]+/.test(text), `${file} 仍存在旧的高速动画倍率`);
}

console.log('PASS: 13 scenes use real audio durations and semantic clocks; total frames: '+total);
