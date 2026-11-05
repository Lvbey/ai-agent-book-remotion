# 子 Agent 派工模板

并行做多节内容时，**不要多个子 Agent 同时改同一个 HTML**——后写的会覆盖先写的。
正确姿势：每个子 Agent 只产出一个**片段文件**（纯 `<section>` 块），由主 Agent 按顺序合并。

```
work/
├── deck.html            ← 主 Agent 独占，负责合并与终检
├── frag/
│   ├── 10-5.1.3.html    ← 子 A 产出
│   ├── 11-5.1.4.html    ← 子 B 产出
│   └── 12-5.1.5.html    ← 子 C 产出
└── refs/ch5.txt         ← 原文纯文本，所有子 Agent 共用只读
```

---

## 派工单（复制后替换 `{{}}`）

```markdown
你是这套 HTML 幻灯片的排版执行者。只写片段，不要碰主文件。

## 任务
为「第 {{章}} 章 {{小节号}} {{小节标题}}」制作 {{N}} 页幻灯片。
原文范围：{{refs/ch5.txt}} 的第 {{起}}–{{止}} 行（只读这个区间）。

## 必须先读
1. {{skill}}/references/design-system.md      视觉系统与版心
2. {{skill}}/references/page-patterns.md      十种页面原型
3. {{skill}}/references/content-playbook.md   内容取舍标准
4. {{skill}}/assets/deck-shell.html           骨架（只抄结构，不改样式）

## 输出
- 文件：`{{work}}/frag/{{序号}}-{{小节号}}.html`
- 内容：**只有** `<section class="slide">…</section>` 块，不要 `<html>/<head>/<style>/<script>`
- 每页带 `data-sec="{{小节号}}" data-tier="{{a|b|c}}"`
- 禁止新增 CSS 类；需要微调就用行内 `style`，且只能改 margin / max-width / padding
- 禁止引入任何外链、图片、webfont

## 硬性约束
- 一页一个结论，标题写结论不写主题
- 卡片正文 ≤3 行；导语 ≤2 行；一页 ≤1 个 `.note`
- 中文括号词组不得跨行断开：整组 `<span class="nw">` 或手写 `<br>`
- 内容块 `max-width` 要么不写（吃满 1124），要么显式对齐，不许写 1020 这类数
- 原文里作者"自我限定/反例"的段落必须保留，压成 `.note`

## 自检（提交前必须跑，报 0 页才算完成）
```bash
python {{skill}}/scripts/probe.py {{work}}/frag/{{序号}}-{{小节号}}.html --wrap
```
`--wrap` 会把片段自动套进 `assets/deck-shell.html` 再测，坐标与真实合并后一致。
**不跑这一步就提交，等于把排版 bug 丢给主 Agent 返工。**

再跑一遍截图，亲眼看过三张以上（尤其代码块、表格、长中文段落）：
```bash
bash {{skill}}/scripts/shoot.sh {{work}}/frag/{{序号}}-{{小节号}}.html ./shots --wrap
```

片段阶段还要人工核对四条：
- 只用了骨架里出现过的 class（`probe` 抓不到"样式不存在"这种问题）
- 内容块没有写死 `max-width:1020` 这类数（要写就写 1124 对齐版心）
- 中文括号词组没有可能被断开的裸文本（整组包 `<span class="nw">` 或手写 `<br>`）
- 每页只有一个 `.note`，且它在页面最下方

## 返回
1. 片段路径 + 页数
2. 每页一句话说明（第几页讲什么结论）
3. 你主动加的和原文没有的东西（例如补的取舍页、类比），单独列出来供主 Agent 审
4. 你自己没把握的地方
```

---

## 主 Agent 的合并与终检

```bash
# 1. 按文件名顺序拼装（幂等，重复执行不会重复插入）
python {{skill}}/scripts/merge.py deck.html frag/

# 2. 终检
python {{skill}}/scripts/probe.py deck.html --quiet
bash  {{skill}}/scripts/shoot.sh deck.html ./shots
```

合并后逐项确认：

- [ ] 页数对得上（`pager` 会自动统计，翻到最后一页看总数）
- [ ] 每页 `data-sec` 连续，刻度条没有断档
- [ ] 相邻两页 tier 一致的属于同一小节，切小节处 tier 变化
- [ ] 没有两页标题读起来重复
- [ ] 三个子 Agent 的页面密度一致（卡片行数、导语长度接近），不出现"一页挤三页空"
- [ ] 结尾页的 takeaway 能覆盖前面所有小节

## 什么时候不该并行

- 段落之间有强依赖（后一节大量引用前一节的定义）→ 串行，或让第二个 Agent 先读第一个的产出
- 页数少于 8 页 → 自己写更快，派工单的开销大于收益
- 需要统一叙事线的章节（如整章小结）→ 必须主 Agent 亲自写
