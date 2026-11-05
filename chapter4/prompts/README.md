# 分章制作提示词（第 4 / 7 / 8 / 9 / 10 章）

一个文件一章，互相独立。**新开一个会话，粘贴一个文件**，就能并发做出一章的 deck。

| 文件 | 章节 | 原文 | 预估页数 | 子 Agent |
|---|---|---|---|---|
| `ch4-prompt.md` | 4 工具 | `refs/ch4.txt`（517 行） | ~49 | 3 |
| `ch7-prompt.md` | 7 Agent 的评估 | `refs/ch7.txt`（1030 行） | ~89 | 6 |
| `ch8-prompt.md` | 8 模型后训练 | `refs/ch8.txt`（1074 行） | ~75 | 6 |
| `ch9-prompt.md` | 9 Agent 的持续进化 | `refs/ch9.txt`（506 行） | ~43 | 4 |
| `ch10-prompt.md` | 10 多 Agent 协作 | `refs/ch10.txt`（862 行） | ~65 | 6 |

完成情况：第 5 章 `ch5-coding-agent-slides.html`（79 页）已完工，是全套的**风格基准**；
第 6 章 `ch6-interaction-slides.html` 在做。

## 换一台机器怎么用

```bash
git clone <repo>            # 或者已有的仓库 git pull
cd <repo>/chapter4
```

然后在 WorkBuddy 里**把工作目录设成 `chapter4/`**，开新会话，把 `prompts/chX-prompt.md`
中 `---` 之间的内容整段粘进去。

三件事已经替你准备好了，新机器上不需要额外操作：

1. **技能在仓库里**：`.workbuddy/skills/ebook-deck-builder/`。WorkBuddy 会把它识别为
   *项目级技能*（前提是工作目录是 `chapter4/`）。万一没被自动加载，提示词里已经写明了
   "直接读 `SKILL.md` 照流程做"，不依赖技能注册。
2. **原文已转成纯文本**：`refs/chX.txt`。**新机器不需要 epub**，也不用手动解压。
   如果哪天要重新生成，需要 epub 和 `chapter4/refs/_index.json` 里记录的章节映射。
3. **风格基准在仓库里**：`ch5-coding-agent-slides.html`。提示词里把它指定为只读参照，
   保证后做的章节和前 79 页是同一套视觉。

## 路径约定（重要）

所有提示词**只用相对 `chapter4/` 的相对路径**，没有写死任何人的家目录：

```
.workbuddy/skills/ebook-deck-builder/    技能 + 骨架 + 三个脚本
refs/chX.txt                             原文纯文本
ch5-coding-agent-slides.html             风格基准（只读）
work/chX/                                本章工作目录（片段、截图）
chX-xxx-slides.html                      本章成品
```

换机器、换用户名、换 Windows/macOS 都不受影响。截图脚本会自动找本机的
Chrome / Edge（Windows / macOS / Linux 都在候选列表里），找不到时用
`DECK_BROWSER=/path/to/chrome` 指定。

## 每个提示词都包含的七段

1. **先定位**——三条 `ls` 命令，确认目录和输入都在。
2. **任务**——输出文件名、技能/原文/骨架/参照的路径。
3. **分工**——主 Agent 自己做哪几页，几个子 Agent 各读哪几行、出几页、`data-sec` 是什么。
4. **讲解重点**——**这一章要拍板的内容判断**，不是排版规则。这一段是我读过原文之后定的
   取舍（哪些不能删、哪些不能做成卡片墙、哪个数字必须留），是提示词里最值钱的部分。
5. **硬性约束**——骨架复用、一页一结论、全角括号不断行、零外链等。
6. **子 Agent 自检**——`probe.py --wrap` 必须报 0 页越界才算交活，附截图命令。
7. **执行节奏 + 收口**——先派哪一块当样板，审完再放其余；合并、终检、批量截图三条命令。

## 通用约定

- **不要改 `ch5-coding-agent-slides.html`**，它是视觉基准。
- **不要改骨架的 CSS / JS**，只改 `<section>`。要微调就用行内 `style`，且只允许
  `margin` / `padding` / `max-width` / `font-size`。
- **`data-tier`**：小节号奇数 `a`、偶数 `b`；小结/思考题/结尾 `c`；封面/章节页留空。
  刻度条靠它分色。
- **原文里的 `kk` / `nn` / `pp`** 是公式 epub 转纯文本时的渲染残留，要还原成单字母。
- **中文引号不要用脚本批量替换**——会把 CSS 和 JS 里的引号一起改坏（踩过一次，
  见 `.workbuddy/skills/ebook-deck-builder/references/qa-and-pitfalls.md` 坑 2）。
- **命令里的 `python` 在 macOS / 部分 Linux 上叫 `python3`**，报"找不到命令"就换一下；
  `bash shoot.sh ...` 在两个平台都能跑（`.gitattributes` 已强制 `.sh` 用 LF 换行，
  避免 Windows 上 clone 出来带 CRLF 打不开）。
- 截图脚本会自动找 Chrome / Edge；找不到时报错信息里会提示，用
  `DECK_BROWSER=/path/to/chrome` 指定即可。

## 如果你想调整

| 想改什么 | 改哪里 |
|---|---|
| 某一章的内容取舍 | 该章 `chX-prompt.md` 的第 4 段 |
| 视觉风格（配色、字号、版心） | `.workbuddy/skills/ebook-deck-builder/references/design-system.md` |
| 页面原型（十种） | `.../references/page-patterns.md` |
| 讲解密度标准 | `.../references/content-playbook.md` |
| 子 Agent 派工单模板 | `.../references/subagent-briefs.md` |
| 验收与踩坑清单 | `.../references/qa-and-pitfalls.md` |

改完提示词直接 commit，另一台机器 `git pull` 就同步了。
