# 验收流程与踩过的坑

## 一、三遍循环（每批页面必须走完）

```
① 自动扫描   python scripts/probe.py deck.html --quiet
                 ↓  有越界就改，直到 0 页
② 逐页截图   bash scripts/shoot.sh deck.html ./shots
                 ↓
③ 视觉复核   逐张看：文字有没有被裁、有没有压到 HUD、留白是否失衡、
             有没有中文断行孤字。这一步机器替代不了。
```

**只做①不做③会漏掉"排版正确但难看"的问题**，例如：行末只剩一个"）」"、卡片行比特标题短一截、水印压出版心。这三类 probe 都测不出来。

可疑页用 2 倍分辨率重截再看：

```bash
msedge --headless=new --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=2 --window-size=1280,720 \
  --screenshot=./zoom.png "file:///绝对路径/deck.html#10"
```

### 片段（子 Agent）怎么验

片段文件里没有 `#stage` 和 `<style>`，直接截图/探测全是误报。两个脚本都支持 `--wrap`：
把片段临时插进 `assets/deck-shell.html` 再跑，坐标与真实合并后一致。

```bash
python scripts/probe.py frag/10-5.1.3.html --wrap     # 报「共 N 页，0 页有越界」才算过
bash   scripts/shoot.sh frag/10-5.1.3.html ./shots --wrap
```

不带 `--wrap` 时，脚本发现文件里没有 `#stage` 也会自动启用，但最好显式写上。
片段模式下一律按正文页判定（不放宽下边界），因为片段里不会出现封面/结尾页。

## 二、六个真实踩过的坑

### 坑 1：`.part{position:relative}` 把整页顶出画布

`.slide` 是 `position:absolute; inset:0`。给分隔页加了 `.part` 类并写了 `position:relative`，会覆盖掉 absolute，页面掉回文档流，被前面的页顶到画布外——**表现为这两页全黑，且底部刻度条数量对不上**。

> 规则：加在 `.slide` 上的修饰类，**永远不要重写 `position`**。要定位内部元素，就把 `position:relative` 加在 `.slide-inner` 上。

### 坑 2：批处理中文引号污染了 CSS

把正文里的直引号批量换成「」时，用 `>([^<>]*)<` 的正则连带改到了 `<style>` 里的 `content:"本次"` 和 `font-family:"SF Mono"`，整页字体和标签全废。

> 规则：批量替换必须先 `<style>…</style>` 和 `<script>…</script>` 切出去，只处理 HTML 文本节点。改完立刻 `grep -c "「"` 对比数量。

### 坑 3：中文括号词组被拦腰截断

副标题靠 `max-width:660px` 自然换行，在「电脑**操**／**控**）」之间断开，末行只剩「控）、」两个字符。

> 规则：中文里带全角括号的词组是**不可分单元**。二选一：
> - 给每组加 `<span class="nw">…</span>` + `white-space:nowrap`；
> - 或者放弃自动换行，在语义边界手写 `<br>`（更可控，推荐）。
>
> 手写 `<br>` 时注意：`<br>` 后的换行空白会变成空格，和 `、` 撞在一起显得很空，把标签写在同一行更干净。

### 坑 4：`max-width` 让卡片行比标题短一截

`.cards` 上留了 `max-width:1020px`，而内容列是 1124px。卡片右缘比标题右缘短 104px，整页看起来"左重右轻"，但每一行都没有越界，probe 照样报 0。

> 规则：内容块的 `max-width` 只有两个合法值——不写（吃满 1124），或者和上面某个块**显式对齐**。随手写 1020/980 这种数，就是给自己埋视觉 bug。

### 坑 5：装饰水印压出版心

`.ghost` 用 `right:28px` + `172px` 字号，「5.1」看着没事，「5.1.2」五个字符右缘只剩 29px，怼到画框边上。

> 规则：装饰元素也要守 78px 版心。字串变长就降字号：3 字符 172px / 5 字符 150px。

### 坑 6：headless 的 `--window-size` ≠ CSS 像素

Windows 上 `window-size=1280,720` 拿到的 `innerWidth` 可能是 1254（滚动条/DPI），于是截图里的坐标和 `getBoundingClientRect()` 差 2–3%。用肉眼估像素会得出错误结论。

> 规则：判断位置一律用**注入脚本量 `getBoundingClientRect()`**，再按 `1280 / stage.getBoundingClientRect().width` 换算回设计坐标。`scripts/probe.py` 已经这么做了，不要另写一套。

## 三、probe 的判定口径

| 现象 | 判定 | 严重度 |
|---|---|---|
| 文字越过 0/1280 或 0/720 | 会被裁掉 | 必须改 |
| 文字右缘 > 1202 | 破坏 78px 版心 | 必须改 |
| 正文页文字下缘 > 614 | 压到底部 HUD | 必须改 |
| 首页/末页下缘 > 700 | 页脚贴底 | 必须改 |
| probe 报 0 但看着别扭 | 视觉问题（留白、断行、对齐） | 看第③步 |

## 四、性能与小技巧

- 18 页的 deck 全量截图约 40 秒（每页 2.5s 预算）。只截改动页，用 `shoot.sh deck.html ./shots 7,10-12`。
- `--virtual-time-budget=2500` 是让 `settle()` 和入场动画跑完的下限；改成 1000 会截到半透明的 `.reveal`。
- URL 加 `#N` 可直达第 N 页，`history.replaceState` 会同步地址栏，方便反复对照。
- 全部资源内联：不引 CDN、不引字体、不引图片。最终交付是**一个可直接双击打开的单文件**。
