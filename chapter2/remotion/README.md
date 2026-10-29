# 《上下文工程》Remotion 科普动画

基于《AI Agents in Depth》第二章“上下文工程”的中文动态图形动画工程。主视觉采用暖纸白、森林绿、珊瑚红和芥末黄，使用项目文件、消息流、缓存块和信息压缩作为统一的视觉隐喻。

## 主要信息

- 分辨率：1920 × 1080（16:9）
- 帧率：30 fps
- 成片时长：6 分钟
- 总帧数：10,800
- 技术栈：React、TypeScript、Remotion、SVG、CSS
- 默认输出：`out/context-engineering.mp4`

## 运行要求

建议 Node.js 20.19+ 或 22.x。Remotion 4 的 Chrome/渲染依赖由 Remotion CLI 管理。首次渲染时请确保网络可下载所需浏览器资源。

## 安装与预览

```bash
npm install
npm run typecheck
npm run dev
```

Studio 启动后选择 `ContextEngineering` Composition 预览。

## 渲染

```bash
# 先渲染前 24 秒测试片段（0-719 帧）
npm run render:preview

# 完整视频
npm run render

# 导出一个指定帧做静帧检查
npx remotion still src/index.ts ContextEngineering out/still.png --frame=5400
```

如需明确指定编码器及覆盖配置：

```bash
npx remotion render src/index.ts ContextEngineering out/context-engineering.mp4 --codec=h264
```

## 项目结构

```text
src/
  index.ts                 Remotion 注册入口
  Root.tsx                 Composition 注册
  MainVideo.tsx            全片场景时间轴
  theme.ts                 分辨率、帧率、颜色设计令牌
  components/
    Background.tsx         统一背景与章节标签
    Typography.tsx         动态文字与字幕组件
    Panel.tsx              卡片式信息组件
  scenes/
    Intro.tsx               信息不足导致任务失败
    ContextMap.tsx          上下文构成
    AgentLoop.tsx            模型与工具的交互循环
    PromptAndSafety.tsx      系统规则、Skills 与提示注入
    Cache.tsx                前缀稳定与缓存
    StateAndCompress.tsx     状态栏与上下文压缩
    Conclusion.tsx           总结与片尾
```

## 工程说明

- 所有动画均基于 `useCurrentFrame`、`interpolate` 与固定配置，未使用系统时间或随机数。
- 场景时间由 `MainVideo.tsx` 集中管理，镜头区间连续，没有场景之间的时间空档。
- 片中出现的项目、工具输出和任务状态是为教学制作的虚构示例，不是实际执行结果。
- 不包含自动生成的旁白音轨。当前版本通过动态图形与中文字幕讲解；可在后续把经确认的旁白录音添加到 `public/` 并按帧同步。
- “KV Cache”指单次推理中的 K/V 缓存；跨请求复用相同前缀在服务商语境中常称 Prompt Cache。具体缓存行为依模型服务、路由和缓存策略而不同。
