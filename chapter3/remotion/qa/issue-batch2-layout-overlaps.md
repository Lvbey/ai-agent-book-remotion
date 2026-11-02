# EP01 第二批重叠修复记录（5 处）

## 问题与根因

| # | 时间点 | 单元 | 现象 | 根因 |
| --- | --- | --- | --- | --- |
| 1 | 06:49 | U020/U039/U040（S2 EvalFrame） | 左下 300/35/50 数字被条形遮住 | `MeterBar` 的 value 绝对定位在条形右端（top:28），条形填满后同色覆盖数值 |
| 2 | 07:21 | U043（S2 EvalFrame） | “配套仓库：user-memory 项目”压住“奖励得分” | 评分 `Item` 为绝对定位且外层无占位高度，后续注解 Chip 在流式布局中回到容器顶部 |
| 3 | 15:58 | U087（S5 CodeState） | destination/departure_date 压在面板边框线上 | 中面板高 300 容纳 6 行等宽文本，长行折行后溢出底边 |
| 4 | 23:11 | U125（S7 Frameworks） | “工作记忆”卡内多个 Chip 重叠 | 架构 Chip 用 `left:10%+i*18%` 绝对错位排布，长标签相互覆盖 |
| 5 | 27:03 | U146（S9 Privacy） | “脱敏召回率”与“正则·基线”重叠 | 召回率 `MeterBar` 绝对定位不占位，对比条目从容器顶部开始流入其区域 |
| 6 | 全片排查发现（S1 ExtractDemo） | 约 01:37（帧 2902） | “提取·压缩·审查”文字被一条横线穿过，类似删除线 | 扫描线（4px 硬边渐变线）扫过文字行时穿过字形间隙，视觉上像删除线 |

## 修改

1. `src/components/ui.tsx` — `MeterBar` 改为「标签行（label 左 + value 右）+ 条形」两行结构，value 不再压条形。
2. `src/scenes/EvalFrame.tsx` — 评分 `Item` 外包 `position:relative; height:66` 占位容器。
3. `src/scenes/CodeState.tsx` — 中面板高度 300→322，状态行 6→5 行，字号 20→19，行距收紧。
4. `src/scenes/Frameworks.tsx` — 架构 Chip 改为 flex wrap 流式排布（`Chip flow`）。
5. `src/scenes/Privacy.tsx` — 召回率 `MeterBar` 包入 `height:96` 占位容器；底部区块 top 640→700 避让。
6. `src/scenes/ExtractDemo.tsx` — 扫描线由 4px 硬边横线改为 44px 柔和垂直渐变光带（仍持续移动，保留逐句分析的动效语义），不再像删除线。

## 全片重叠排查（148 帧）

- 方法：从修正版成片按「每个语义单元 85% 处」抽取 148 帧（全揭示、布局最满状态），2×2 拼成 37 张检查图逐张目检。
- 结果：148 帧中除第 6 项（扫描线穿字，已修复）外，未发现其他文字/元素重叠、压线或溢出。
- 抽帧与拼图：`qa/sweep/frames/`（148 张单帧）、`qa/sweep/tiles/`（37 张拼图）。

## 验证

- `npx tsc --noEmit`：PASS；`npm run check:layout`：PASS。
- 修复静帧：`qa/issue-batch2/fixed/f12270/f13230/f28740/f41730/f48690.png`，逐张复核通过。
- 完整修正版：`out/EP01-silent-review.mp4`（v3 重渲后替换），并复跑逐秒视觉 QA。
