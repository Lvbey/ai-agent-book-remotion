// 生成 plan/coverage-map-ep01.json：把知识点定义与旁白单元映射合并为交付表。
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REMOTION = path.resolve(__dirname, '..');
const CHAPTER3 = path.resolve(REMOTION, '..');
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

const kps = read(path.join(REMOTION, 'src/data/ep01-coverage.json'));
const units = read(path.join(REMOTION, 'src/data/ep01-units.generated.json'));
const meta = read(path.join(REMOTION, 'src/data/ep01-meta.generated.json'));

const refMap = new Map();
for (const u of units) {
  for (const id of u.kp) {
    if (!refMap.has(id)) refMap.set(id, []);
    refMap.get(id).push(u.id);
  }
}

const rows = kps.map((kp) => {
  const refs = refMap.get(kp.id) ?? [];
  return {
    id: kp.id,
    sourceHeading: kp.sourceHeading,
    sourceAnchor: kp.sourceAnchor,
    importance: kp.importance,
    learningOutcome: kp.learningOutcome,
    narrationUnitIds: refs,
    visualEventIds: refs.length ? refs : [],
    status: refs.length ? 'covered' : 'uncovered',
  };
});

const covered = rows.filter((r) => r.status === 'covered').length;
const p0 = rows.filter((r) => r.importance === 'P0');
const p0Covered = p0.filter((r) => r.status === 'covered').length;

const out = {
  meta: {
    episode: 'EP01',
    title: '用户记忆系统',
    sourceRepo: 'bojieli/ai-agent-book',
    sourcePath: 'book/chapter3.md',
    sourceBranch: 'main',
    sourceCommit: 'dbc046eb896ac4e39aa19c7774c8bf49583b89a6',
    sourceBlobSha: 'b3d88e68e098c0e473fe28a76887a8a741ff49ae',
    snapshotFetchedAt: '2026-10-30T15:40+08:00',
    snapshotFile: 'chapter3/references/chapter3.source.md',
    totalUnits: meta.unitCount,
    totalSeconds: meta.totalSeconds,
    totalFrames: meta.totalFrames,
    totalKnowledgePoints: rows.length,
    covered,
    coverageRate: covered / rows.length,
    p0Total: p0.length,
    p0Covered,
    p0Rate: p0.length ? p0Covered / p0.length : 1,
    note: 'status=covered 表示该知识点至少被一个语义单元讲解（必要条件）；「讲解到位」需 Gate 5 人工复核。',
  },
  items: rows,
};

fs.mkdirSync(path.join(CHAPTER3, 'plan'), {recursive: true});
fs.writeFileSync(path.join(CHAPTER3, 'plan/coverage-map-ep01.json'), JSON.stringify(out, null, 2), 'utf8');
console.log(`[build-coverage-map] ${covered}/${rows.length} = ${((covered / rows.length) * 100).toFixed(1)}%; P0 ${p0Covered}/${p0.length}`);
