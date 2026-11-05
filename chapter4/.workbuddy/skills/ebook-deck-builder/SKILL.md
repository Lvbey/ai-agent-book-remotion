---
name: ebook-deck-builder
description: 把一本电子书（epub/pdf/markdown）的某一章，做成单文件、零外链、16:9 一屏一页的中文 HTML 幻灯片演示。适用于"读完这章能掌握 80%"的深读型 deck：深色未来感时间线风格，封面/结尾有设计感，左右翻页带刻度条导航。当用户要求把书/文档/长文做成网页幻灯片、reading deck、章节精读演示时使用。也用于在此类 deck 上继续追加章节、返工某页、批量修复排版。
agent_created: true
---

# 电子书章节 → HTML 幻灯片 deck

## 这个技能解决什么

把一章书变成一套**能替代读原文的网页幻灯片**：单文件、离线可开、左右翻页、
1280×720 固定舞台等比缩放（任何窗口都是一屏一页）、深色未来感时间线视觉。

判据不是"好看"，而是**目标读者看完能复述出 80% 的结论**。

## 什么时候用

- "把第 X 章做成 PPT / 幻灯片 / 演示 / reading deck"
- "继续做 5.1.3"（在已有 deck 上追加）
- "第 10 页有问题"（返工单页）
- "把这份长文/文档做成能翻页的网页"

不适用：商业提案（要留白和品牌色）、需要动画视频（走 Remotion）、需要可编辑 pptx（走 workbuddy-pptx）。

## 交付物形态（不可协商）

| 项 | 要求 |
|---|---|
| 文件 | **单个 .html**，双击可开 |
| 依赖 | 零外链：无 CDN、无 webfont、无图片、无 reveal.js |
| 尺寸 | 1280×720 舞台 + `scale(var(--s))` 等比缩放 |
| 翻页 | ← → / 空格 / PgUp / PgDn / Home / End / 滚轮 / 触屏 / 点刻度条；`F` 全屏；`#N` 直达 |
| 导航 | 底部刻度条一页一格，按小节分色，可点 |
| 中文 | 全角标点用「」，但禁止机械批量替换（见 pitfalls 坑 2） |

## 工作流

### 0. 先把原文变成纯文本

epub 解压后找到章节 xhtml，用脚本转纯文本（保留标题层级、列表、表格、代码块），
存成 `refs/chN.txt`。**不要一边读 html 一边排版**，标签会干扰判断。

```bash
mkdir -p /tmp/ebook && cd /tmp/ebook && unzip -o -q book.epub
find . -name "*.xhtml" | sort          # 定位章节
```

转换时把 `<h1-6>` 转成 `## `，`<p>/<li>/<tr>` 转成换行，`<pre>` 转成代码围栏，最后 `html.unescape`。

### 1. 拆结构，定页数

列出本章所有 `h2/h3`，得到二级小节清单。一页承载约 60–120 字正文 + 3 张卡或 1 张表，据此估算：

```
页数 ≈ 1(封面) + 1(章节地图) + Σ每小节[1(分隔页) + 2~4(正文)] + 1(小结) + 1(结尾)
```

### 2. 先做一个"风格样片"给用户审

**不要一口气做完整章。** 先做 1 个分隔页 + 2 个正文页（约 8–10 页）交审，
确认视觉与信息密度后再批量铺开。返工 8 页的成本远低于返工 40 页。

开工前必须问清三件事（否则一定返工）：
1. 审核范围是哪几节
2. 原文里的"实验 / 案例"要单独立页还是压成卡片
3. 代码片段是精简、整段贴出、还是只讲设计思想

### 3. 复制骨架，填内容

```bash
cp {skill}/assets/deck-shell.html work/chN-slides.html
```

骨架里已有：完整 CSS（背景层、舞台、四角框、进度条、刻度条、卡片/表格/步骤/代码/分隔页/结尾的全部样式）、
翻页 JS、HUD，以及 4 个示例页（封面 / 分隔页 / 正文卡片阵 / 结尾）。

**只改 body 里的 `<section class="slide">`，不动 CSS 与 JS。**
需要微调就用行内 style，且只允许 `margin / max-width / padding / font-size`。

每页必须带：

```html
<section class="slide" data-sec="5.1.3" data-tier="a">
```

- `data-sec`：刻度条上显示的标签，写小节号
- `data-tier`：`""`(封面/章节页) / `a`(青) / `b`(紫) / `c`(橙，小结与结尾)。同小节内保持一致。

### 4. 内容怎么写

**先读 `references/content-playbook.md`**，核心四条：

- 标题写**结论**不写主题（能被反驳才算结论）
- 原文的清单 → 对照表；流程 → 步骤流/图；取舍 → **单独一页**
- 作者的"自我限定 / 反例"一个字都不能删，压成 `.note`
- 代码 8–12 行，左代码右意图

### 5. 排版选型

**读 `references/page-patterns.md`**，十种原型：
封面 / 章节地图 / 分隔页 / 卡片阵 / 对照表 / 步骤流 / 代码分栏 / 手写 SVG 架构图 / 阶段小结 / 结尾。

先选原型再填内容，反过来一定排崩。

### 6. 三遍验收（每批必做）

```bash
python {skill}/scripts/probe.py deck.html --quiet     # ① 自动扫越界，必须 0 页
bash   {skill}/scripts/shoot.sh deck.html ./shots     # ② 逐页截图
#                                                     ③ 逐张看：断行孤字、留白失衡、对齐
```

只截新增页：`bash shoot.sh deck.html ./shots 19-24`。
只做一个片段时（子 Agent），两个脚本都加 `--wrap`，会自动套骨架：

```bash
python {skill}/scripts/probe.py frag/10-5.1.3.html --wrap
bash   {skill}/scripts/shoot.sh frag/10-5.1.3.html ./shots --wrap
```

**只做①不做③会漏掉"排版正确但难看"的问题**（行末孤字、卡片行比标题短一截、水印压出版心）。
可疑页用 2 倍分辨率重截：

```bash
msedge --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
  --window-size=1280,720 --screenshot=./zoom.png "file:///abs/path/deck.html#10"
```

### 7. 交付

用 `present_files` 打开 HTML。回复里给：

- 页数 + 页面结构表（第几页讲什么）
- **你主动加的、原文没有的判断**（单独列出来，供用户删）
- 你自检时修掉的排版问题
- 下一步建议

## 继续做下一节（增量）

1. 直接在现有 deck 上追加，或另存工作副本
2. 新页一律插在 `data-sec="END"` 的结尾页**之前**（`merge.py` 会自动这么定位；手工插也照此），`data-sec` 接续，`data-tier` 按小节递增
3. 结尾页（`data-sec="END"`）永远保持在最后一页，更新它的"下一节"文案
4. 重跑 probe + 只截新增页：`bash shoot.sh deck.html ./shots 19-24`

页数、进度条、刻度条、`pager` 都由 JS 自动统计，**不用手改任何数字**。

## 并行多节（子 Agent）

见 `references/subagent-briefs.md`：每个子 Agent 只产出 `frag/*.html` 片段，
主 Agent 用 `scripts/merge.py` 按序合并，避免并发写同一文件。

派工单必须包含：原文行号区间、三份 references 路径、骨架路径、硬性约束、自检方式、返回格式。
**自检方式一定要写 `--wrap` 那两行命令**，子 Agent 能自查，才不会把排版 bug 留给合并阶段。

## 文件地图

```
skill/
├── SKILL.md
├── assets/deck-shell.html          可直接复制的骨架（CSS+JS+4 示例页）
├── references/
│   ├── design-system.md            色板、字号、版心、动效、固定装饰
│   ├── page-patterns.md            十种页面原型 + 最小 markup
│   ├── content-playbook.md         80% 掌握度的内容取舍标准
│   ├── qa-and-pitfalls.md          三遍验收 + 六个真实踩坑
│   └── subagent-briefs.md          派工单模板与合并流程
└── scripts/
    ├── probe.py                    逐页检测越界/压 HUD（退出码可用于循环；--wrap 测片段）
    ├── shoot.sh                    批量截图（Chrome/Edge，支持指定页；--wrap 截片段）
    └── merge.py                    片段幂等合并
```

## 绝对不能做的事

1. 不要在 `.slide` 的修饰类里写 `position`（会把整页顶出画布）
2. 不要批量替换引号而不隔离 `<style>` / `<script>`（会毁掉 CSS）
3. 不要让中文全角括号词组靠 `max-width` 自然换行（会产生孤字）
4. 不要在内容块上写 `max-width:1020` 这类数（右缘对不齐，肉眼可见）
5. 不要把装饰水印放出 78px 版心
6. 不要用肉眼估像素判断位置（headless 的 window-size ≠ CSS 像素，差 2–3%）
7. 不要引入任何外链资源
