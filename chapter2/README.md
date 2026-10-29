# 《上下文工程》Remotion 动画项目

本目录包含《AI Agent Book》第二章“上下文工程”的科普动画策划文档与 Remotion 实现。

## 项目结构

- `director-plan.md`：知识提取、内容映射、导演方案与视觉规范
- `storyboard.md`：完整分镜、旁白、镜头时间码与验收标准
- `remotion/`：可运行的 React + TypeScript + Remotion 工程

## 本地运行

进入 `remotion/` 目录后执行：

```bash
npm install
npm run typecheck
npm run dev
```

导出完整 MP4：

```bash
npm run render
```

默认视频规格为 1920×1080、30 fps、6 分钟（10,800 帧）。

## 验证状态

项目文件与场景时间轴已做静态检查。由于制作环境访问 npm registry 时遇到 DNS `EAI_AGAIN`，尚未在该环境完成依赖安装、TypeScript 检查、Remotion 预览或视频渲染；请在可访问 npm registry 的环境中执行上述命令验证。

## 资料来源

[指定原文：book/chapter2.md](https://github.com/bojieli/ai-agent-book/blob/main/book/chapter2.md)
