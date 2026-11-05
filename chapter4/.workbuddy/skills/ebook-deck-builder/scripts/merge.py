#!/usr/bin/env python3
"""
merge.py — 把 frag/*.html 片段按文件名顺序插进 deck.html。

插入位置：自动找 data-sec="END" 的结尾页，插在它**前面**（结尾页永远最后）。
找不到结尾页时，退化为插在 </div><!-- /slides --> 之前。

用法:
    python merge.py deck.html frag/
    python merge.py deck.html frag/ --dry-run

片段文件里应只有 <section class="slide">…</section>，可有可无外层注释。
重复执行不会重复插入：每个片段插入时带 <!-- frag:文件名 --> 标记，已存在则跳过。
"""

import argparse
import glob
import os
import re
import sys

MARK = '</div><!-- /slides -->'
END_TAG = re.compile(r'[ \t]*<section\b[^>]*\bdata-sec="END"[^>]*>', re.M)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("deck")
    ap.add_argument("fragdir")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    deck_path = os.path.abspath(args.deck)
    if not os.path.exists(deck_path):
        sys.exit("找不到 deck: " + deck_path)
    files = sorted(glob.glob(os.path.join(args.fragdir, "*.html")))
    if not files:
        sys.exit("片段目录里没有 .html: " + args.fragdir)

    deck = open(deck_path, encoding="utf-8").read()
    if MARK not in deck and not END_TAG.search(deck):
        sys.exit("deck 里既没有结尾页也没有 %s 标记，请先用 deck-shell.html 的骨架" % MARK)

    blocks = []
    for f in files:
        name = os.path.basename(f)
        if ("<!-- frag:%s -->" % name) in deck:
            print("跳过（已合并）: " + name)
            continue
        body = open(f, encoding="utf-8").read().strip()
        if "<section" not in body:
            print("跳过（无 section）: " + name)
            continue
        n = len(re.findall(r'<section class="slide', body))
        blocks.append("  <!-- frag:%s -->\n%s\n" % (name, body))
        print("合并 %-28s %d 页" % (name, n))

    if not blocks:
        print("没有新片段需要合并。")
        return

    # 找插入点：结尾页之前优先
    m = END_TAG.search(deck)
    if m:
        pos, where = m.start(), "结尾页之前"
    else:
        pos, where = deck.index(MARK), "slides 容器末尾（未找到结尾页）"

    if args.dry_run:
        print("\n[dry-run] 将插入 %d 个片段到 %s，未写盘。" % (len(blocks), where))
        return

    deck = deck[:pos] + "\n".join(blocks) + "\n  " + deck[pos:]
    open(deck_path, "w", encoding="utf-8").write(deck)
    total = len(re.findall(r'^[ \t]*<section class="slide', deck, re.M))
    print("\n插入位置: %s" % where)
    print("写盘完成，deck 现在共 %d 页。" % total)


if __name__ == "__main__":
    main()
