# 《上下文工程》Remotion 完整章节动画课

基于《AI Agents in Depth》第二章“上下文工程”的动画课程工程。目标是让零基础观众通过观看理解本章核心机制、工程取舍和关键实验结论，而不只是了解几个概念。

## 视频规格

- 分辨率：1920 × 1080（16:9）
- 帧率：30 fps
- 当前时间轴：11 分 20 秒，20,400 帧
- 技术栈：React、TypeScript、Remotion、SVG、CSS
- 默认输出：out/context-engineering.mp4

## 本次全章覆盖扩展

新增教学场景：API 消息结构、Chat Template、提示工程与 Few-shot、Agent 状态栏、六种压缩策略与生产分层压缩、子 Agent 上下文隔离。现有场景也扩展了时间轴。章节知识映射见 ../director-plan.md，镜头时间码与完整旁白稿见 ../storyboard.md。

## 安装、预览和渲染

建议 Node.js 20.19+ 或 22.x。

```bash
npm install
npm run typecheck
npm run check:timing
npm run dev
```

Studio 启动后选择 ContextEngineering Composition。

```bash
# 前 24 秒烟雾测试
npm run render:preview

# 完整视频
npm run render

# 渲染某个时间点的静帧（示例：第 10 分钟附近）
npx remotion still src/index.ts ContextEngineering out/still.png --frame=18000
```

## 场景结构

- Intro：信息缺失导致任务失败
- ContextMap：上下文构成与筛选
- ChapterDeepDive：API 消息结构、Chat Template、提示工程、状态栏、压缩策略、子 Agent 隔离
- AgentLoop：工具调用闭环、执行与结果回流
- Cache：稳定前缀与缓存复用
- PromptAndSafety：Skills、提示注入与纵深防御
- StateAndCompress：上下文膨胀、摘要与状态压缩
- Conclusion：全章总结

## 时间轴静帧问题修复（2026-10-29）

之前多个场景直接把 `useCurrentFrame()` 乘以 1.5、7.05、11.25 等倍率，但动画的 `interpolate` 关键帧仍只有几十到几百帧，导致内容在开头几秒出现后长时间停住。例如 00:50–01:14 属于 00:30–01:15 的 ContextMap 场景，原本的帧倍率使多数内容早早结束。

现在 13 个场景改用 `src/sceneTiming.ts` 的 `useStoryFrame(key)`，按真实场景时长映射到各自的分镜关键帧；结尾仅保留 1.5–2 秒的阅读缓冲。ContextMap 增加逐项聚焦、重点更新；压缩策略场景增加生产级分层展示，避免长期停在六行清单。

运行 `npm run check:timing` 可检查时钟接入、时长和 00:50–01:14 对应的分镜推进。**这是代码层面回归检查，不等于逐帧渲染对比。**

建议在 Studio 检查 00:50 / 01:00 / 01:10 / 01:14 的画面差异，并在所有场景的开始、中间、结束位置查看动画是否与旁白同步。更改场景时长时应仅改 `sceneTiming.ts`，并按需要更新 `authoredEnd` / `hold`。

## 验证状态与限制

源码和时间轴已推送到 GitHub，但本轮尚未完成 npm 安装、TypeScript 检查、Studio 预览、视频渲染或逐镜头视觉验收。请勿将“已上传源码”理解为“成片已验证”。

当前尚未嵌入录制或生成的旁白音轨。完整旁白稿位于 storyboard.md；正式成片应将旁白录音、字幕和镜头动作按帧同步。动画中的支付代码、日志和状态为教学示例；原文实验数据必须标注实验条件，不能作为普遍性能承诺。

KV Cache 与 Prompt Cache 的命名及缓存行为依模型服务和推理系统而异。上下文压缩是有损提炼，来源引用只能帮助回查，不能保证摘要无损。
