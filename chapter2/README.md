# 《上下文工程》完整章节动画课程

本目录包含第二章的全章知识映射、分镜与 Remotion 工程。

- director-plan.md：完整知识清单与内容映射
- storyboard.md：13 个章节场景、时间轴与旁白稿
- remotion/：动画工程源码

## 运行

```bash
cd remotion
npm install
npm run typecheck
npm run dev
npm run render
```

视频时间轴规格：1920×1080、30 fps、11 分 20 秒、20,400 帧。

## 重要说明

这次不再把目标限定为 6 分钟的概念科普，而是扩展为覆盖整章核心机制的教学版，增加 API 消息结构、Chat Template、提示工程/Few-shot、状态栏、六种压缩策略、生产分层压缩和子 Agent 隔离等内容。

源码已推送，但尚未完成 TypeScript 检查、Studio 预览、渲染和逐镜头视觉验收；旁白也尚未录制或合成。因此当前状态是“扩展版工程与教学脚本已提交”，不是“最终成片已通过验收”。

原文：[AI Agents in Depth · Chapter 2](https://github.com/bojieli/ai-agent-book/blob/main/book/chapter2.md)
