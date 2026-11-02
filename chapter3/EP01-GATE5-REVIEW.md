# EP01「用户记忆系统」Gate 0～5 审核交付

> 状态：**无声字幕审核版已产出，等待人工审批。**
> 范围：第三章 引言 + 3.1 全节（8 个三级主题）。未触碰 EP02～EP05；未调用 TTS；未写入任何 API Key。

## 一、成片与规格

| 项 | 值 |
| --- | --- |
| 审核版视频 | `chapter3/remotion/out/EP01-silent-review.mp4`（已含 14:10 Chip 重叠修复） |
| 时长 | **27 分 32 秒**（49,562 帧 @ 30fps，1920×1080） |
| 大小 | 71.9 MB（H.264，CRF 20） |
| 音频 | **无**（无声审核版，画面含「无声审核版·未配音」与「字幕为预估时码」标识） |
| 语义单元 | 148 个 |
| 字幕条 | 725 条（预览时码，未经 ASR 对齐） |
| 视觉事件 | 559 个（逐帧程序化揭示，非贴图） |

## 二、可供审核的文件

| 类别 | 文件 | 说明 |
| --- | --- | --- |
| **成片** | `remotion/out/EP01-silent-review.mp4` | 无声审核版 |
| **字幕** | `subtitles/ep01.preview.srt` / `ep01.preview.json` | 725 条预览字幕 |
| **覆盖率** | `remotion/qa/coverage-report-ep01.md` | 116 个原子知识点逐条映射 |
| **覆盖率（机读）** | `plan/coverage-map-ep01.json` | 知识点 → 单元映射表 |
| **分镜** | `remotion/qa/storyboard-ep01.md` | 148 单元 × 559 视觉事件 |
| **逐秒调度** | `remotion/qa/per-second-schedule-ep01.md` | 全片 1652 秒的逐秒状态 |
| **逐秒视觉 QA** | `remotion/qa/visual-qa-ep01.md` | 真实抽帧差分报告 |
| **14:10 修复记录** | `remotion/qa/issue-1410-chip-overlap.md` | Chip 重叠根因、修复与验证 |
| **逐秒数据** | `remotion/qa/visual-per-second.full.json` | 每秒运动量/单元/场景 |
| **知识点定义** | `remotion/src/data/ep01-coverage.json` | Gate 0 产物（含原文锚点） |
| **旁白/分镜源** | `remotion/src/data/units/s0~s9.json` | Gate 1/2 产物（口播稿 + 视觉事件） |
| **原文快照** | `references/chapter3.source.md` + `fig3-1~3-4.svg` | Gate 0 冻结快照 |

## 三、实测结果

| 检查 | 实测 | 门槛 | 结论 |
| --- | --- | --- | --- |
| 原文快照冻结 | commit `dbc046eb…`，blob SHA `b3d88e68…` | — | 已冻结 |
| 知识点覆盖率 | **100.0%**（116/116） | ≥80%（目标 90%） | **PASS** |
| P0 核心项 | **100.0%**（88/88） | 100% | **PASS** |
| TypeScript 类型检查 | `tsc --noEmit` 0 错误 | 0 错误 | **PASS** |
| 时间轴连续性 | 148 单元、无缝，总时长一致 | 无重叠/断档 | **PASS**（1 处秒级间隙为呼吸停顿） |
| 字幕区间/宽度 | 725 条，无超宽、无负时长 | 区间合法、宽度受限 | **PASS** |
| 逐秒停滞筛查 | 连续静止 ≥3s：**0 处**；非预期停滞：**0 处** | 无停滞段 | **PASS** |
| 布局回归守卫 | `check:layout`：所有流式 Chip 显式声明布局 | 无 (0,0) 绝对定位残留 | **PASS** |
| 14:10 用户反馈修复 | Chip 重叠与卡片越界已修复并重渲 | 抽帧无重叠/越界 | **PASS** |
| 渲染烟测 | 全片 36 分钟渲染成功，解码零错误 | 无报错 | **PASS** |
| 成片抽帧复核 | 6 时间点 + 10 场景高负载帧，排版无溢出/重叠 | 版面正确 | **PASS** |

逐秒运动量分布（0~255，越高变化越明显）：均值 1.443，中位 0.942，P05 0.152，P95 3.398；静止秒 40/1652，均为 <3s 的零散单秒。

## 四、尚未通过 / 待人工确认项

1. **人工复核（Gate 5 必做）**：以下三项自动检查通过，但按交接文档要求须人工目检确认——
   - 旁白文案与原文是否逐句忠实、无知识性错误（建议对照 `storyboard-ep01.md` 的「口播稿」列抽查）。
   - 视觉是否达「教学动画」观感（CodeState 与 Frameworks 存在 23/14 个**零散单秒级**微停顿，均 <3s 连续、未触发停滞判定；如观感偏「静」，可在后续迭代加密这两个场景的过渡动画）。
   - 字幕断句是否符合朗读习惯（预览时码为等宽切分，未做 ASR 对齐）。
2. **字幕为预估时码**：`timestampMs/confidence` 均为 `null`（阶段 A 预期行为）。正式版需 TTS + ASR 回写真实字级时码后重对齐。
3. **未提交 git**：按你选择的「只提交 chapter3/」策略，**尚未执行提交**（`chapter3/` 为未跟踪目录，`chapter2/` 的 26 项既有改动未动）。待你审批通过后再执行 `git add chapter3/ && commit`。

## 五、复现命令

```bash
cd chapter3/remotion
node scripts/build-subtitles.mjs     # 时间轴+字幕（唯一数据源）
node scripts/build-docs.mjs          # 覆盖率/分镜/逐秒文档
npx tsc --noEmit                     # 类型检查
node scripts/check-layout.mjs        # 布局回归守卫（Chip 重叠防回归）
node scripts/check-timeline.mjs      # 时间轴
node scripts/check-subtitles.mjs     # 字幕
node scripts/check-coverage.mjs      # 覆盖率
npx remotion render src/index.ts EP01UserMemory out/EP01-silent-review.mp4
node scripts/check-visual.mjs        # 逐秒停滞筛查
```

## 六、未做事项（按约束）

- 未调用 TTS、未配音。
- 未制作 EP02～EP05 任何正式动画。
- 未写入任何 API Key 到仓库。
- 未修改 `chapter2/` 任何文件。

---
**请审批**：若通过，我将仅提交 `chapter3/` 到主仓库（不触碰 chapter2 既有改动），并等待 EP02 指令。如需修改文案/视觉，请指出具体单元 ID（见分镜表）。
