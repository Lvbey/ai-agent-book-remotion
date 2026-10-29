# 《上下文工程》Remotion 动画项目

本目录包含《AI Agent Book》第二章“上下文工程”的科普动画策划文档与 Remotion 实现。

## 项目结构

- `director-plan.md`：知识提取、内容映射、导演方案与视觉规范
- `storyboard.md`：完整分镜、旁白、镜头时间码与验收标准
- `remotion/`：React + TypeScript + Remotion 工程

## 本地运行

进入 `remotion/` 目录：

```bash
npm install
npm run typecheck
npm run dev
```

导出完整 MP4：

```bash
npm run render
```

视频规格：1920×1080、30 fps、6 分钟（10,800 帧）。

## 动画修订说明

首版存在长时间静止的问题。当前已更新 7 个主要场景的实现，加入帧驱动的逐步显现、代码错误揭示、信息块汇聚、工具调用与结果回流、Skills 按需展开、提示注入隔离、缓存前缀匹配、上下文压缩以及前后对比。各场景的关键动作时间已拉伸到对应场景时长内，避免只在开头几秒变化、后面长时间定格。

## 验证状态

已推送并核对 GitHub 文件树。制作环境此前访问 npm registry 时遇到 DNS `EAI_AGAIN`，因此尚未在该环境完成依赖安装、TypeScript 检查、Remotion Studio 预览或视频渲染。请在可访问 npm registry 的环境执行上述命令，并逐场景进行最终视觉验收。

## 资料来源

[指定原文：book/chapter2.md](https://github.com/bojieli/ai-agent-book/blob/main/book/chapter2.md)
