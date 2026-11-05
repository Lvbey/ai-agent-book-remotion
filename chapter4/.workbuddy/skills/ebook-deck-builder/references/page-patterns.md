# 页面原型库

十种页面类型，覆盖一本技术书章节 95% 的表达需求。
**先选原型，再填内容** —— 反过来一定排崩。

选型口诀：

```
要下判断      → 卡片阵（c2/c3）
要比两件事    → 表格 .tbl
要讲流程      → 步骤流 .steps 或 SVG 架构图
要贴代码      → 左右分栏 .split（左代码 右意图）
要收束一节    → 阶段小结（三张 to 卡）
要开一节      → 分隔页 .part（九宫格导轨）
```

---

## 1. 封面 `s-cover`

```html
<section class="slide s-cover active" data-sec="COVER" data-tier="">
  <svg class="cover-orbit" viewBox="0 0 760 760">…雷达轨道，直接抄 deck-shell…</svg>
  <div class="cover-glow"></div>
  <div class="cover-wrap">
    <div class="kicker reveal" style="--d:.05s">书名 · Chapter 05 · Part 1</div>
    <div class="cover-en reveal" style="--d:.12s">CODING<br>AGENT</div>
    <div class="cover-rule reveal" style="--d:.2s">
      <span class="ln"></span><span class="tx">5.1.1 — 5.1.2</span>
    </div>
    <div class="cover-cn reveal" style="--d:.26s">Coding Agent 与通用 Agent</div>
    <p class="cover-sub reveal" style="--d:.34s">
      一个能处理任意任务的通用 Agent，它的架构长什么样？<br>
      <span class="hl-k">答案是：一个 Coding Agent，加上一个文件系统。</span>
    </p>
  </div>
  <div class="cover-foot">…</div>
</section>
```

要点：副标题**必须是"一个问题 + 一句断言"**。断言要能在结尾页被回收，形成闭环。

## 2. 章节地图（可选，一册只放一张）

`.map > .era × 4`，横向四格，标出本次范围与全局位置。适合篇幅超过 20 页的 deck，让读者知道自己在哪。

## 3. 分隔页 `part`

```html
<section class="slide part" data-sec="5.1" data-tier="a">
  <div class="ghost">5.1</div>
  <div class="slide-inner">
    <div class="part-num reveal">SECTION 05.1</div>
    <h2 class="reveal">Coding Agent<br><em>能改代码的智能体</em></h2>
    <p class="sub reveal">两句话交代这一节解决什么问题。</p>
    <div class="subgrid">  <!-- 九格最稳，六格会留大白 --> </div>
  </div>
</section>
```

- `.ghost` 是描边水印，`right:78px; top:5%; font-size:150px`。**字串越长越要缩字号**：`5.1` 用 172px 没问题，`5.1.2` 必须降到 150px，否则右缘只剩 29px，版心断裂。
- `.subgrid div.on` 表示"本次要讲"，会自带一个「本次」小标签。一场只标 1–2 格。
- 六格（2 行）会让底部空 100px；九格（3 行）排满后底部仍留约 150px。**这段留白是有意的呼吸区**，不要用 padding 把它撑满。`.subgrid` 默认吃满 1124 版心，不要给它加 `max-width`。
- 格数只有 3–4 个时（例如这一节就三个子节），把 `.track` 用上，并把 `margin-top` 提到 46–60px，让内容在竖直方向摊开：

```html
<div class="track reveal" style="--d:.5s">
  <span class="on">5.1.1 工具面</span><span>·</span><span>5.1.2 元能力</span><span>·</span><span>5.1.3 整体流程</span>
</div>
```

  `.track` 自带左侧渐隐引导线；`.on` 标当前小节。也可以放在正文页 `.note` 上方做"本节剩余内容"提示。

## 4. 卡片阵（最常用）

```html
<div class="cards c3">
  <div class="card reveal" style="--d:.22s">
    <div class="k"><span>CAP 01</span><b>输入</b></div>
    <h3>Deep Research</h3>
    <p>搜、读、核对、综合成结论。</p>
  </div>
  <div class="card sum reveal" style="--d:.34s">…</div>   <!-- sum = 高亮那张 -->
</div>
```

- `c2` 对照 / `c3` 并列 / `c4` 分类清单（四张以内）。
- `.k` 左边是编号，右边是**这格在系统里的角色**（输入 / 手脚 / 内核）。这一行比标题更有信息量，不要省。
- 只有一个结论要记时，用 `.sum` 标出来，否则读者四张卡一视同仁。
- 卡片正文超过三行就说明该拆页了。

## 5. 对照表

```html
<table class="tbl">
  <tr><th>维度</th><th>方案 A</th><th>方案 B</th></tr>
  <tr><td>成本</td><td class="cy">低</td><td class="vi">高</td></tr>
</table>
```

- 列数 ≤4，行数 ≤6。超过就拆。
- `<td>` 里放短句，不要放段落。
- 颜色类：`cy` 青 / `vi` 紫 / `am` 橙 / `mu` 灰。**同一列同色**，不要做成彩虹。

## 6. 步骤流 / 时间线

```html
<div class="steps">
  <div class="step"><div class="no">01</div><div><h4>标题</h4><p>一句话</p></div></div>
</div>
```

五步以内。超过五步改用 SVG 流程图。

## 7. 代码分栏 `.split`

```html
<div class="split">
  <div class="spec">
    <div class="spec-head">…</div>
    <div class="spec-body"><div class="spec-code">…</div></div>
  </div>
  <div>右侧放三条"这段代码为什么这样写"</div>
</div>
```

- 代码 **8–12 行**，多的用 `…` 省略，并在右侧点明省略了什么。
- 左边永远是"事实"（代码/配置/文件树），右边永远是"判断"。
- 等宽字体已内置，不要再套 `<pre><code>` 的默认样式。

## 8. 手写 SVG 架构图

用 `.split` 不行时，直接 `<svg viewBox>` 画：

- 分层用 `rect` + `rx="10"`，描边 `rgba(140,170,220,.18)`，填充 `rgba(255,255,255,.02)`。
- 连线用 `path` + `marker-end` 箭头，箭头定义一次即可。
- 文字用 `<text font-size="12" fill="#a9b8d6">`。**字号最小 11**，再小截图就糊。
- 中文字宽 ≈ 字号 × 1.0，英文 ≈ ×0.55。排文字前先按这个估宽，超宽就缩短文案而不是缩字号。
- 不要用 `<foreignObject>`（导出/截图兼容性差）。

## 9. 阶段小结

三张卡 + 一句过渡：`anchor`（这件事的本质）/ `transfer`（怎么迁移到你的系统）/ `next`（下一节要拆什么）。
小结页同时把刻度条 tier 切到 `c`，视觉上告诉读者"这一段结束了"。

## 10. 结尾 `s-end`

```html
<section class="slide s-end" data-sec="END" data-tier="c">
  <div class="horizon"></div>
  <div class="end-floor"><i></i></div>
  <div class="end-wrap">
    <h2 class="end-h">一句能独立成立的话，<br><em>而不是「谢谢观看」。</em></h2>
    <div class="take"> 三张 takeaway </div>
    <div class="end-sign">下一节 · 5.1.3 →</div>
  </div>
</section>
```

取景：地平线固定在 `top:72%`，透视网格地面压在它下面。文字在 40%–60% 之间，别掉到地平线以下。
