/**
 * 生成 Gate 0/1/2/4 的审核文档：
 *   qa/coverage-report-ep01.md    覆盖率报告（知识点 → 单元映射）
 *   qa/storyboard-ep01.md         动态分镜表（单元 + 视觉事件级）
 *   qa/per-second-schedule-ep01.md 逐秒调度表（全片每一秒的视觉状态与字幕）
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REMOTION = path.resolve(__dirname, '..');
const CHAPTER3 = path.resolve(REMOTION, '..');
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

const kps = read(path.join(REMOTION, 'src/data/ep01-coverage.json'));
const units = read(path.join(REMOTION, 'src/data/ep01-units.generated.json'));
const caps = read(path.join(REMOTION, 'src/data/ep01-captions.generated.json'));
const meta = read(path.join(REMOTION, 'src/data/ep01-meta.generated.json'));

const FPS = meta.fps;
const TOTAL = meta.totalFrames;

const SECTION_TITLES = {
  S0: '开场 · 本章定位',
  S1: '跨会话记忆是怎么来的',
  S2: '评估：八项能力与三层次框架',
  S3: '记忆的层次结构',
  S4: '四种存储格式',
  S5: '进阶表示：User as Code',
  S6: '认知科学基础',
  S7: '记忆框架案例',
  S8: '压缩与整理',
  S9: '隐私保护：日志脱敏',
};
const SCENE_TITLES = {
  IntroMap: '章节知识脉络',
  ExtractDemo: '记忆提取流水线',
  EvalFrame: '三层次评估框架',
  Layers: '记忆的层次结构',
  Formats: '四种存储格式',
  CodeState: '可执行用户状态',
  Cognition: '认知科学分类',
  Frameworks: 'Mem0 与 Memobase',
  Compress: '三层压缩策略',
  Privacy: '日志脱敏流水线',
};

const tc = (frame) => {
  const s = Math.floor(frame / FPS);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};
const tcSec = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

// 与 clock.ts 的 reveal() 保持一致
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const reveal = (p, i, n, overlap = 1.55) => clamp01((p - i / Math.max(1, n)) / (overlap / Math.max(1, n)));

const kpById = new Map(kps.map((k) => [k.id, k]));
const unitById = new Map(units.map((u) => [u.id, u]));
const capsByUnit = new Map();
for (const c of caps) {
  if (!capsByUnit.has(c.unitId)) capsByUnit.set(c.unitId, []);
  capsByUnit.get(c.unitId).push(c);
}

fs.mkdirSync(path.join(REMOTION, 'qa'), {recursive: true});

/* ---------------------------------------------------------------- 覆盖率报告 */
{
  const refMap = new Map();
  for (const u of units) for (const id of u.kp) {
    if (!refMap.has(id)) refMap.set(id, []);
    refMap.get(id).push(u.id);
  }

  const byHeading = new Map();
  for (const kp of kps) {
    if (!byHeading.has(kp.sourceHeading)) byHeading.set(kp.sourceHeading, []);
    byHeading.get(kp.sourceHeading).push(kp);
  }

  const L = [];
  L.push('# EP01 覆盖率报告');
  L.push('');
  L.push(`- 集：EP01 用户记忆系统（引言 + 3.1 全节 8 个三级主题）`);
  L.push(`- 原文来源：\`bojieli/ai-agent-book\`@\`main\` → \`book/chapter3.md\``);
  L.push(`- 原文快照 commit：\`${meta.sourceCommit ?? 'dbc046eb896ac4e39aa19c7774c8bf49583b89a6'}\``);
  L.push(`- 原文快照 blob SHA：\`b3d88e68e098c0e473fe28a76887a8a741ff49ae\``);
  L.push(`- 快照本地副本：\`chapter3/references/chapter3.source.md\``);
  L.push(`- 成片时长：${tcSec(Math.floor(TOTAL / FPS))}（${TOTAL} 帧 @ ${FPS}fps，${meta.width}×${meta.height}）`);
  L.push(`- 语义单元：${units.length}；字幕条：${caps.length}`);
  L.push('');

  const covered = kps.filter((k) => (refMap.get(k.id) ?? []).length > 0);
  const p0 = kps.filter((k) => k.importance === 'P0');
  const p0c = p0.filter((k) => (refMap.get(k.id) ?? []).length > 0);
  const p1 = kps.filter((k) => k.importance === 'P1');
  const p1c = p1.filter((k) => (refMap.get(k.id) ?? []).length > 0);
  const p2 = kps.filter((k) => k.importance === 'P2');
  const p2c = p2.filter((k) => (refMap.get(k.id) ?? []).length > 0);

  L.push('## 一、总览');
  L.push('');
  L.push('| 指标 | 实测 | 门槛 | 结论 |');
  L.push('| --- | --- | --- | --- |');
  const rate = covered.length / kps.length;
  L.push(`| 知识点覆盖率 | **${(rate * 100).toFixed(1)}%**（${covered.length}/${kps.length}） | ≥ 80%（目标 90%） | ${rate >= 0.9 ? 'PASS（达 90% 目标）' : rate >= 0.8 ? 'PASS（达最低门槛）' : 'FAIL'} |`);
  L.push(`| P0 核心项 | **${(p0c.length / p0.length * 100).toFixed(1)}%**（${p0c.length}/${p0.length}） | 100% | ${p0c.length === p0.length ? 'PASS' : 'FAIL'} |`);
  L.push(`| P1 重要项 | ${(p1c.length / p1.length * 100).toFixed(1)}% （${p1c.length}/${p1.length}） | — | — |`);
  L.push(`| P2 补充项 | ${(p2c.length / p2.length * 100).toFixed(1)}% （${p2c.length}/${p2.length}） | — | — |`);
  L.push('');

  L.push('## 二、分章节覆盖');
  L.push('');
  L.push('| 原文小节 | 知识点数 | 已覆盖 | P0 | P0 已覆盖 |');
  L.push('| --- | --- | --- | --- | --- |');
  for (const [h, list] of byHeading) {
    const c = list.filter((k) => (refMap.get(k.id) ?? []).length > 0).length;
    const hp = list.filter((k) => k.importance === 'P0');
    const hpc = hp.filter((k) => (refMap.get(k.id) ?? []).length > 0).length;
    L.push(`| ${h} | ${list.length} | ${c} | ${hp.length} | ${hpc} |`);
  }
  L.push('');

  L.push('## 三、知识点逐条映射');
  L.push('');
  L.push('| ID | 级别 | 原文锚点 | 学习产出 | 覆盖单元 | 状态 |');
  L.push('| --- | --- | --- | --- | --- | --- |');
  for (const kp of kps) {
    const refs = refMap.get(kp.id) ?? [];
    L.push(
      `| \`${kp.id}\` | ${kp.importance} | \`${kp.sourceAnchor}\` | ${kp.learningOutcome} | ${refs.length ? refs.join(' ') : '—'} | ${refs.length ? '已覆盖' : '**未覆盖**'} |`
    );
  }
  L.push('');
  L.push('> `status=已覆盖` 表示该知识点至少被一个语义单元讲解（必要条件）；「讲解是否到位」由 Gate 5 人工复核确认。');
  L.push('');
  fs.writeFileSync(path.join(REMOTION, 'qa/coverage-report-ep01.md'), L.join('\n'), 'utf8');
}

/* ---------------------------------------------------------------- 分镜表 */
{
  const L = [];
  L.push('# EP01 动态分镜表');
  L.push('');
  const audioLabel = meta.estimated
    ? '无声字幕审核版（预估值码）'
    : `配音版（${meta.audio?.provider ?? 'TTS'} · ${meta.audio?.speaker ?? ''}｜真实语音时码）`;
  L.push(`- 时长 ${tcSec(Math.floor(TOTAL / FPS))}｜${TOTAL} 帧 @ ${FPS}fps｜${meta.width}×${meta.height}｜${audioLabel}`);
  L.push(`- 语义单元 ${units.length} 个，视觉事件 ${units.reduce((a, u) => a + u.steps.length, 0)} 个`);
  L.push('- 视觉事件揭示模型：`reveal(p, i, n, overlap=1.55)`，相邻事件窗口重叠，保证任意时刻至少有一个元素处于状态变化中');
  L.push('');

  // 分区总览
  const secs = new Map();
  for (const u of units) {
    if (!secs.has(u.section)) secs.set(u.section, {n: 0, frames: 0, from: u.start, to: u.end, scenes: new Set()});
    const s = secs.get(u.section);
    s.n++;
    s.frames += u.duration;
    s.to = u.end;
    s.scenes.add(u.scene);
  }
  L.push('## 一、分区总览');
  L.push('');
  L.push('| 分区 | 标题 | 时间码 | 时长 | 单元数 | 场景组件 |');
  L.push('| --- | --- | --- | --- | --- | --- |');
  for (const [k, v] of secs) {
    L.push(
      `| ${k} | ${SECTION_TITLES[k] ?? k} | ${tc(v.from)} → ${tc(v.to)} | ${(v.frames / FPS).toFixed(1)}s | ${v.n} | ${[...v.scenes].map((s) => `\`${s}\``).join(' ')} |`
    );
  }
  L.push('');

  L.push('## 二、单元分镜卡');
  L.push('');
  let lastSection = null;
  for (const u of units) {
    if (u.section !== lastSection) {
      lastSection = u.section;
      L.push(`### ${u.section} · ${SECTION_TITLES[u.section] ?? u.section}`);
      L.push('');
    }
    const n = Math.max(1, u.steps.length);
    L.push(`#### ${u.id}　${u.title}`);
    L.push('');
    L.push(`- **时间码** ${tc(u.start)} → ${tc(u.end)}（${u.seconds.toFixed(2)}s，${u.duration} 帧）`);
    L.push(`- **场景组件** \`${u.scene}\`（${SCENE_TITLES[u.scene] ?? u.scene}）`);
    L.push(`- **知识点** ${u.kp.length ? u.kp.map((k) => `\`${k}\``).join(' ') : '—'}`);
    L.push(`- **口播稿** ${u.text}`);
    L.push('');
    L.push('| # | 视觉事件 | 类型 | 起始进度 p | 完全揭示于 p | 时间窗 |');
    L.push('| --- | --- | --- | --- | --- | --- |');
    u.steps.forEach((s, i) => {
      const from = i / n;
      const to = Math.min(1, (i + 1.55) / n);
      L.push(
        `| ${i + 1} | ${s.label} | \`${s.kind}\` | ${from.toFixed(3)} | ${to.toFixed(3)} | ${tc(u.start + Math.round(from * u.duration))} → ${tc(u.start + Math.round(to * u.duration))} |`
      );
    });
    if (u.steps.length === 0) L.push('| — | （该单元为纯口播/场景保持，无新增视觉事件） | | | | |');
    L.push('');
    const cs = capsByUnit.get(u.id) ?? [];
    if (cs.length) {
      L.push(`<details><summary>字幕 ${cs.length} 条</summary>`);
      L.push('');
      L.push('| 字幕 ID | 文本 | 起 | 止 |');
      L.push('| --- | --- | --- | --- |');
      for (const c of cs) {
        L.push(
          `| \`${c.id}\` | ${c.text} | ${(c.startMs / 1000).toFixed(2)}s | ${(c.endMs / 1000).toFixed(2)}s |`
        );
      }
      L.push('');
      L.push('</details>');
      L.push('');
    }
  }
  fs.writeFileSync(path.join(REMOTION, 'qa/storyboard-ep01.md'), L.join('\n'), 'utf8');
}

/* ---------------------------------------------------------------- 逐秒调度表 */
{
  const L = [];
  const totalSec = Math.floor(TOTAL / FPS);
  L.push('# EP01 逐秒调度表');
  L.push('');
  L.push(`- 全片 ${totalSec} 秒；每行给出该秒「处于揭示中的视觉事件」「已固化事件数」「当前字幕」`);
  L.push('- 揭示中与 clock.ts 的 `reveal()` 完全一致，可直接与成片逐帧对照');
  L.push('');

  let lastSection = null;
  for (let s = 0; s < totalSec; s++) {
    const f = s * FPS;
    // 定位单元
    let lo = 0;
    let hi = units.length - 1;
    let u = null;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (units[mid].start <= f) {
        u = units[mid];
        lo = mid + 1;
      } else hi = mid - 1;
    }
    if (!u) continue;
    if (u.section !== lastSection) {
      lastSection = u.section;
      L.push(`## ${u.section} · ${SECTION_TITLES[u.section] ?? u.section}`);
      L.push('');
      L.push('| 秒 | 时间码 | 单元 | 场景 | 揭示中事件 | 已固化 | 字幕 |');
      L.push('| --- | --- | --- | --- | --- | --- | --- |');
    }
    const p = clamp01((f - u.start) / u.duration);
    const n = Math.max(1, u.steps.length);
    const animating = [];
    let solid = 0;
    u.steps.forEach((st, i) => {
      const r = reveal(p, i, n);
      if (r >= 1) solid++;
      else if (r > 0) animating.push(st.label);
    });
    // 场景累积：之前单元的事件均视为已固化
    const cs = capsByUnit.get(u.id) ?? [];
    const cap = cs.find((c) => f >= Math.round((c.startMs / 1000) * FPS) && f < Math.round((c.endMs / 1000) * FPS));
    L.push(
      `| ${s} | ${tcSec(s)} | \`${u.id}\` | \`${u.scene}\` | ${animating.length ? animating.join(' / ') : '（无）'} | ${solid} | ${cap ? cap.text : '—'} |`
    );
  }
  L.push('');
  fs.writeFileSync(path.join(REMOTION, 'qa/per-second-schedule-ep01.md'), L.join('\n'), 'utf8');
}

console.log('[build-docs] qa/coverage-report-ep01.md');
console.log('[build-docs] qa/storyboard-ep01.md');
console.log('[build-docs] qa/per-second-schedule-ep01.md');
