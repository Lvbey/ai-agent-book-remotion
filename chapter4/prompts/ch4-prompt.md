# 第 4 章「工具」— 幻灯片制作提示词

> 用法：在任意机器上 `git clone` / `git pull` 后，把会话工作目录设成仓库的 `chapter4/`，
> 新开一个会话，把 `---` 之间的内容**整段**粘贴。文中所有路径都相对 `chapter4/`，不含绝对路径。

---

## 0. 先定位，别跳过

下面所有路径都相对 `chapter4/`。先确认三样东西都在：

```bash
ls -d .workbuddy/skills/ebook-deck-builder  refs/ch4.txt  ch5-coding-agent-slides.html
```

三条都列出来就对了。如果当前目录不是 `chapter4/`，先 `cd` 进去。
**全程只用相对路径**，这个仓库要在不同机器之间搬。

## 1. 任务

用 `ebook-deck-builder` 技能，把《AI Agents in Depth》第 4 章「工具」做成 16:9 翻页 HTML 幻灯片，
**单独一个文件**：`ch4-tools-slides.html`。

| 输入 | 位置 |
|---|---|
| 技能 | `.workbuddy/skills/ebook-deck-builder/`（WorkBuddy 会自动识别为项目技能；**如果没被触发，就直接读里面的 `SKILL.md`，照它写的流程做**） |
| 原文 | `refs/ch4.txt`（517 行，已转纯文本，直接读，不用再解压 epub） |
| 骨架 | `.workbuddy/skills/ebook-deck-builder/assets/deck-shell.html` |
| **风格参照** | `ch5-coding-agent-slides.html`（第 5 章成品，79 页，同一套骨架） |
| 工作目录 | `work/ch4/` |

`ch5-coding-agent-slides.html` **只读，绝对不要修改**。讲解密度、标题写法、卡片排版、chip 措辞
都照它来，保证两章并排看是一套东西。它是这套视觉的"标准答案"。

## 2. 分工

**你自己做**：封面、章节地图、4.8 本章小结（479–494）、4.9 思考题（495–517）、结尾页。约 7 页。

**并发 3 个子 Agent**，各自只产出 `work/ch4/frag/NN-小节号.html`（纯 `<section class="slide">` 块，
不含 `<html>` / CSS / JS）：

| 子 | 负责 | 读原文行 | 目标页数 | data-sec |
|---|---|---|---|---|
| A | 4.1 工具的分类 | 9–50 | 4 | `4.1` |
| A | 4.2 工具设计的通用原则 | 51–120 | 6 | `4.2` |
| A | 4.3 工具生态：MCP 与 Skill Hub | 121–152 | 3 | `4.3` |
| B | 4.4 工具太多怎么办：层次化组织与主动发现 | 153–236 | 8 | `4.4` |
| B | 4.5 感知工具 | 237–292 | 5 | `4.5` |
| C | 4.6 执行工具 | 293–430 | 12 | `4.6` |
| C | 4.7 协作工具 | 431–478 | 4 | `4.7` |

合计约 42 页，加上你自己做的 7 页，成品约 49 页。

**`data-tier` 规则**：小节号**奇数用 `a`，偶数用 `b`**；小结 / 思考题 / 结尾页用 `c`；封面、章节页留空。
A 一个人跨 4.1 / 4.2 / 4.3 三个小节，**每页按所在小节单独标，不要整块统一**。

## 3. 这一章的讲解重点（拍板，别自行发挥）

1. **本章的核心论点是"工具是需要设计的界面，不是随手包的 API"。** 每一节都要能回到这句话。
2. **4.6 执行工具是全书最容易被做成代码墙的一节**（138 行）。要求：只讲设计约束和失败模式，
   代码最多 8–12 行且必须带"为什么这样设计"的右侧说明。宁可不贴代码。
3. **4.4 层次化组织与主动工具发现是本章迁移价值最高的一节**，工具超过 30 个的真实系统都会撞上。
   不要压成两页，给足篇幅，最好有一张"工具太多时会发生什么"的失败链路图。
4. **给传统开发人员的翻译**：4.1 的分类（感知 / 执行 / 协作）要明确说清和第 5 章"七工具"的对应
   关系，因为读过第 5 章的人会觉得两章在讲重复的东西。有一页把两组分类摆在一起对照就够。
5. **4.3 讲 MCP / Skill Hub 时不要写成产品介绍**，讲"为什么需要协议层"。

## 4. 硬性约束（第 5 章验证过，别改）

- **只用骨架已有的 CSS 类，不改 CSS / JS。** 需要微调就用行内 `style`，只允许
  `margin` / `padding` / `max-width` / `font-size`。
- 一页一个结论，标题写成一句**能被反驳的话**，不写"工具的分类"这种目录式标题。
- 卡片正文 ≤3 行，导语 ≤2 行，一页 ≤1 个 `.note`。
- 中文全角括号词组不许跨行断开（整组包 `<span class="nw">` 或手写 `<br>`）。
- 内容块 `max-width` 要么不写（吃满 1124 版心），要么显式对齐，**不许写 1020 这类数**。
- 作者写"这个判断有边界 / 这里不适用"的段落一个都不能删，压成 `.note`。
- 零外链：不引 CDN、不引 webfont、不引图片。架构图一律手写 SVG。
- 中文引号用「」，但**不要写脚本批量替换**（会把 CSS 和 JS 一起改坏，见
  `references/qa-and-pitfalls.md` 坑 2）。

## 5. 子 Agent 自检（不跑不算交活）

```bash
python .workbuddy/skills/ebook-deck-builder/scripts/probe.py work/ch4/frag/NN.html --wrap
```

必须报「共 N 页，0 页有越界」才准提交。再截图 2–3 张自己看一眼：

```bash
bash .workbuddy/skills/ebook-deck-builder/scripts/shoot.sh work/ch4/frag/NN.html ./work/ch4/shots --wrap
```

代码块、表格、长段落各看一张。`--wrap` 会把片段自动套进骨架，缺了它截出来是一堆没样式的裸文字。

## 6. 执行节奏

**先只派子 C（4.6 执行工具）出去。** 它是本章最难排的块（138 行 + 代码密集），拿它当样板：
能把它排得既不挤又不像代码墙，剩下两块基本不会翻车。

**我审完 C 的样式和密度，再放 A 和 B。**

审 C 时我会重点看：代码块有没有把整页撑满、右侧"为什么"是在解释决策还是解释语法、
4.7 那 4 页有没有被顺手塞满。

## 7. 收口

```bash
cd chapter4   # 如果还不在这个目录
python .workbuddy/skills/ebook-deck-builder/scripts/merge.py ch4-tools-slides.html work/ch4/frag/
python .workbuddy/skills/ebook-deck-builder/scripts/probe.py ch4-tools-slides.html --quiet
bash   .workbuddy/skills/ebook-deck-builder/scripts/shoot.sh ch4-tools-slides.html ./work/ch4/shots/final
```

逐张看完，重点确认：4.1 的分类页和第 5 章说法一致、4.4 的失败链路图讲得通、
4.6 没有一页是纯代码、刻度条 tier 在 4.1–4.7 之间没有断档。

---

**开工前先回我一句**：你打算怎么拆 A 的 4.1 / 4.2 / 4.3（13 页怎么分配），以及 4.6 的 12 页
准备用哪几个页面原型。我确认了你再并行派单。
