#!/usr/bin/env python3
"""
probe.py — 逐页检测 deck 里越界 / 压到 HUD / 超出画框的文字元素。

用法:
    python probe.py deck.html
    python probe.py deck.html --quiet        # 只列有问题的页
    python probe.py frag/10-5.1.3.html --wrap   # 片段文件：自动套骨架再检测
    DECK_BROWSER=/path/to/chrome python probe.py deck.html

--wrap 说明:
    片段里没有 #stage 与 CSS，直接打开是一堆无样式的 section，测出来全是误报。
    加 --wrap 会把片段插进 assets/deck-shell.html 再测，坐标与真实合并后完全一致。
    片段模式下「首页/末页放宽下边界」不适用（片段页都是正文页）。

原理: 复制一份 html，注入测量脚本，用 headless 浏览器 dump-dom 回收 JSON。
坐标统一换算回 1280x720 设计坐标系，与截图分辨率无关。

判定标准:
    超出画框(0..1280 / 0..720)  -> 真 bug，会被裁掉
    文字右边界 > 1202           -> 破坏 78px 版心
    文字下边界 > 614 (正文页)    -> 压到底部 HUD
    首页/末页下边界放宽到 700（页脚本来就贴底）

退出码: 0 = 干净；1 = 有越界。
"""

import argparse
import html as htmllib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

CANDIDATES = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
]

INJECT = r"""
<script>
(function(){
  function run(){
    var FRAG_MODE = __FRAG__;
    var stage  = document.getElementById('stage');
    var slides = [].slice.call(document.querySelectorAll('.slide'));
    if(!stage || !slides.length){
      var e0 = document.createElement('pre');
      e0.id = '__probe';
      e0.textContent = JSON.stringify({ error: 'no #stage or .slide found' });
      document.body.appendChild(e0);
      return;
    }
    var sr = stage.getBoundingClientRect();
    var k  = 1280 / sr.width;
    var FRAME_R = 1280, FRAME_B = 720;
    var MARGIN_R = 1202;
    var SKIP = '.ghost,.cover-orbit,.cover-glow,.horizon,.end-floor,.frame,.progress,.hud,#bg,#grid,#vign';

    function ownText(el){
      for(var n = el.firstChild; n; n = n.nextSibling){
        if(n.nodeType === 3 && n.textContent.replace(/\s+/g,'')) return true;
      }
      return false;
    }
    function label(el){
      var out = [], cur = el, guard = 0;
      while(cur && cur.nodeType === 1 && guard++ < 3){
        var s = cur.tagName.toLowerCase();
        if(typeof cur.className === 'string' && cur.className.trim()){
          s += '.' + cur.className.trim().split(/\s+/).slice(0,2).join('.');
        }
        out.unshift(s);
        cur = cur.parentElement;
      }
      var t = (el.textContent || '').replace(/\s+/g,' ').trim().slice(0, 18);
      return out.join('>') + (t ? '  「' + t + '」' : '');
    }

    var res = [];
    slides.forEach(function(sl, i){
      var isEdge = !FRAG_MODE && (i === 0 || i === slides.length - 1);
      var bottomLimit = isEdge ? 700 : 614;

      slides.forEach(function(o){ o.style.display = (o === sl) ? 'flex' : 'none'; });
      sl.style.transition = 'none';
      sl.style.transform  = 'none';
      sl.style.opacity    = '1';
      [].forEach.call(sl.querySelectorAll('.reveal'), function(r){
        r.style.opacity = '1'; r.style.transform = 'none'; r.style.animation = 'none';
      });

      var issues = [];
      [].slice.call(sl.querySelectorAll('*')).forEach(function(el){
        if(el.closest(SKIP)) return;
        if(el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'BR') return;
        if(!ownText(el)) return;
        var b = el.getBoundingClientRect();
        if(!b.width || !b.height) return;
        var x1 = (b.left - sr.left) * k, y1 = (b.top - sr.top) * k;
        var x2 = x1 + b.width * k,      y2 = y1 + b.height * k;
        var why = [];
        if(x2 > FRAME_R + 1 && x1 < FRAME_R) why.push('越过画框右缘 +' + Math.round(x2 - FRAME_R));
        if(x1 < -1)                          why.push('越过画框左缘 ' + Math.round(x1));
        if(y2 > FRAME_B + 1 && y1 < FRAME_B) why.push('越过画框下缘 +' + Math.round(y2 - FRAME_B));
        if(y1 < -1)                          why.push('越过画框上缘 ' + Math.round(y1));
        if(x2 > MARGIN_R + 1)                why.push('压右边距 +' + Math.round(x2 - MARGIN_R));
        if(y2 > bottomLimit + 1)             why.push('压 HUD/页脚 +' + Math.round(y2 - bottomLimit));
        if(!why.length) return;
        issues.push({
          sel: label(el),
          box: [Math.round(x1), Math.round(y1), Math.round(b.width * k), Math.round(b.height * k)],
          why: why
        });
      });
      res.push({ i: i + 1, sec: sl.dataset.sec || '', issues: issues });
    });

    var pre = document.createElement('pre');
    pre.id = '__probe';
    pre.textContent = JSON.stringify({ slides: res });
    document.body.appendChild(pre);
  }
  if(document.readyState === 'complete') setTimeout(run, 80);
  else window.addEventListener('load', function(){ setTimeout(run, 80); });
})();
</script>
"""


SHELL_REL = os.path.join("assets", "deck-shell.html")


def shell_path():
    here = os.path.dirname(os.path.abspath(__file__))
    p = os.path.join(os.path.dirname(here), SHELL_REL)
    return p if os.path.exists(p) else None


def wrap_fragment(frag_src):
    """把片段套进骨架：清空骨架自带的示例页，只留片段本身。
    这样测出的坐标与真实合并后一致，且不会把示例页的封面/结尾当成首页末页放宽。"""
    sp = shell_path()
    if not sp:
        sys.exit("--wrap 需要 assets/deck-shell.html，但在技能目录里没找到。")
    shell = open(sp, encoding="utf-8").read()

    m = re.search(r'(<div id="slides">)(.*?)(</div><!--\s*/slides\s*-->)', shell, re.S)
    if not m:
        sys.exit("骨架里找不到 <div id=\"slides\"> … </div><!-- /slides --> 标记。")
    shell = shell[:m.start(2)] + "\n" + frag_src.strip() + "\n  " + shell[m.end(2):]

    if 'class="slide' not in shell:
        sys.exit("片段里没有任何 <section class=\"slide\">，检查文件内容。")

    # 片段的第一页默认没有 active（真实合并时它前面还有封面），
    # 包装后它成了首页，不加就会截图全黑。
    m1 = re.search(r'<section class="([^"]*\bslide\b[^"]*)"', shell)
    if m1 and 'active' not in m1.group(1).split():
        shell = shell[:m1.start(1)] + m1.group(1) + ' active' + shell[m1.end(1):]

    # 片段页一律按正文页判定（不放宽下边界）
    return shell, True


def find_browser():
    env = os.environ.get("DECK_BROWSER")
    if env and os.path.exists(env):
        return env
    for p in CANDIDATES:
        if os.path.exists(p):
            return p
    for name in ("msedge", "chrome", "chromium", "google-chrome"):
        p = shutil.which(name)
        if p:
            return p
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("deck")
    ap.add_argument("--quiet", action="store_true", help="只列有问题的页")
    ap.add_argument("--wrap", action="store_true",
                    help="输入是片段文件：自动套 assets/deck-shell.html 后检测")
    args = ap.parse_args()

    deck = os.path.abspath(args.deck)
    if not os.path.exists(deck):
        sys.exit("找不到文件: " + deck)

    browser = find_browser()
    if not browser:
        sys.exit("找不到 Chrome/Edge；可用环境变量 DECK_BROWSER 指定可执行文件路径")

    src = open(deck, encoding="utf-8").read()

    frag_mode = args.wrap
    if not frag_mode and 'id="stage"' not in src:
        # 没加 --wrap 但明显是片段：给出提示，避免测出一堆假阳性
        if 'class="slide' in src:
            print("[提示] 这个文件没有 #stage，看起来是片段，自动按 --wrap 处理。\n")
            frag_mode = True
    if frag_mode:
        src, _ = wrap_fragment(src)

    inject = INJECT.replace("__FRAG__", "true" if frag_mode else "false")
    probe_src = src.replace("</body>", inject + "</body>") if "</body>" in src else src + inject

    tmpdir = tempfile.mkdtemp(prefix="deckprobe_")
    tmp = os.path.join(tmpdir, "probe.html")
    open(tmp, "w", encoding="utf-8").write(probe_src)

    cmd = [
        browser, "--headless=new", "--disable-gpu", "--no-sandbox",
        "--hide-scrollbars", "--window-size=1280,720",
        "--virtual-time-budget=6000", "--dump-dom",
        "file:///" + tmp.replace("\\", "/"),
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")

    m = re.search(r'<pre id="__probe">(.*?)</pre>', proc.stdout, re.S)
    if not m:
        shutil.rmtree(tmpdir, ignore_errors=True)
        sys.exit("注入脚本没有回传结果 —— 用浏览器打开 deck 看是否有 JS 报错。")
    data = json.loads(htmllib.unescape(m.group(1)))
    if "error" in data:
        shutil.rmtree(tmpdir, ignore_errors=True)
        sys.exit("探测失败: " + data["error"])

    bad = 0
    for s in data["slides"]:
        if s["issues"]:
            bad += 1
            print("\n第 %d 页  [%s]" % (s["i"], s["sec"]))
            for it in s["issues"]:
                print("  - %s\n      %s   box=%s" % (it["sel"], " / ".join(it["why"]), it["box"]))
        elif not args.quiet:
            print("第 %d 页  [%s]  ok" % (s["i"], s["sec"]))

    print("\n共 %d 页，%d 页有越界。" % (len(data["slides"]), bad))
    shutil.rmtree(tmpdir, ignore_errors=True)
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
