#!/usr/bin/env python3
"""把 base.html + frag/*.html（按文件名排序）+ tail.html 装进 shell.html，
输出 chapter4/ch6-interaction-slides.html。

幂等：每次全量重建，顺序永远 = base → frag 文件名序 → tail(6.6/6.7/END)。
"""
import glob
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
SHELL = os.path.join(HERE, "shell.html")
OUT = os.path.join(ROOT, "ch6-interaction-slides.html")


def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read().strip()


def main():
    shell = open(SHELL, encoding="utf-8").read()
    parts = [read(os.path.join(HERE, "base.html"))]
    frags = sorted(glob.glob(os.path.join(HERE, "frag", "*.html")))
    for f in frags:
        body = read(f)
        if "<section" in body:
            parts.append("  <!-- frag:%s -->\n%s" % (os.path.basename(f), body))
    parts.append(read(os.path.join(HERE, "tail.html")))
    body = "\n\n".join(parts)

    m = re.search(r'(<div id="slides">)(.*?)(</div><!--\s*/slides\s*-->)', shell, re.S)
    if not m:
        raise SystemExit("shell 里找不到 <div id=\"slides\"> … </div><!-- /slides -->")
    out = shell[:m.start(2)] + "\n" + body + "\n  " + shell[m.end(2):]

    pages = len(re.findall(r'^[ \t]*<section class="slide', out, re.M))
    out = re.sub(r'<span>\d+ SLIDES</span>', '<span>%d SLIDES</span>' % pages, out, count=1)

    with open(OUT, "w", encoding="utf-8") as f:
        f.write(out)
    print("基础页 7 + 片段 %d 个 + 尾部 6 页 → %s" % (len(frags), OUT))
    print("共 %d 页" % pages)


if __name__ == "__main__":
    main()
