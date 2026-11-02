# EP01 14:10 中部 Chip 重叠修复记录

## 问题定位

- 用户反馈：约 **14:10**，画面中间底部内容重叠。
- 对应帧：`25500`（30fps）。
- 对应单元：`EP01-U077`（S4 / Formats / 实验 3-2：统一实现）尾部，下一单元为 `EP01-U078`。
- 原始抽帧：`qa/issue-1410/t001408.png`、`t001410.png`、`t001412.png`。
- 可见缺陷：绿色选择标准 Chip、灰色实验 Chip、黄色注解 Chip 叠在同一位置；另有 `…tionship=为谁` 文本被压在黄色 Chip 内。

## 根因

`Chip` 默认使用 `position:absolute`。Formats 将其放入 `display:flex` 容器，并在外层包一个无固定宽高的 `position:relative` wrapper。绝对定位的 Chip 不参与流式布局，wrapper 因而不占位，所有 Chip 都定位到各自的 `(0,0)`，形成完全重叠。

该写法并非 Formats 独有，因此同步修复所有场景中的同类用法，而非仅调整 14:10 的坐标。

## 修改

1. `src/components/ui.tsx`
   - `Chip` 新增 `flow?: boolean`。
   - `flow=true` 时使用 `position:relative`、`display:inline-flex`，使 Chip 正常参与 flex 布局并保留原有淡入/缩放动画。
2. `src/scenes/*.tsx`
   - 所有流式容器内的 `<Chip x={0} y={0} …>` 改为 `<Chip flow x={0} y={0} …>`。
   - 保留 IntroMap 中通过 `y={i * 52}` 明确纵向定位的绝对布局用法。
3. `src/scenes/Formats.tsx`
   - 同时收紧左卡片列表行距，修复同一帧中“为子女”越出卡片下边框约 20px 的问题。
4. `scripts/check-layout.mjs`（新增）
   - 静态守卫：凡 `(0,0)` Chip 未显式声明 `flow` 即失败，防止回归。
   - 已加入 `package.json` 的 `check:layout` 与 `qa:all`。

## 验证

- `npx tsc --noEmit`：PASS。
- `npm run check:layout`：PASS。
- 14:10 修复静帧：`qa/chip-fix/f25500.png`。
  - 各 Chip 横向/换行排列，无相互覆盖。
  - 左卡片 6 个条目均在边框内。
- 十个场景高负载抽帧：`qa/chip-fix/`。
  - Chip 重叠已消除。
- 14:10 附近动态预览：`out/fix-1410-preview.mp4`（13:58.0～14:25.0）。
- 完整修正版：`out/EP01-silent-review.mp4`（已重渲并替换审核版；14:10 实际抽帧 `qa/issue-1410/fixed-video-t001410.png` 复核通过）。
- 最终成片校验：27:32.07，75,361,085 bytes，ffmpeg 全片解码零错误；`qa/visual-qa-ep01.md` 已基于修正版重跑，连续静止 ≥3s 仍为 0 处。
