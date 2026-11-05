#!/usr/bin/env bash
# shoot.sh — 批量把 deck 的每一页截成 PNG，供视觉复核。
#
# 用法:
#   ./shoot.sh deck.html                      # 全部页面 -> ./shots/
#   ./shoot.sh deck.html ./shots 1,3,7-12     # 只截指定页
#   ./shoot.sh frag/10-5.1.3.html ./shots --wrap   # 片段：自动套骨架再截
#
# --wrap 可放在任意位置。文件里没有 #stage 时会自动启用（片段直接截图是没有样式的）。
# 依赖: 本机 Chrome 或 Edge。可用 DECK_BROWSER 指定可执行文件路径。
set -uo pipefail

ARGS=()
WRAP=0
for a in "$@"; do
  if [ "$a" = "--wrap" ]; then WRAP=1; else ARGS+=("$a"); fi
done
DECK="${ARGS[0]:-}"
[ -n "$DECK" ] || { echo "用法: shoot.sh deck.html [outdir] [1,3,7-12] [--wrap]"; exit 1; }
OUTDIR="${ARGS[1]:-./shots}"
PAGES="${ARGS[2]:-}"

abs() { python -c "import os,sys;print(os.path.abspath(sys.argv[1]).replace(chr(92),'/'))" "$1"; }

DECK_ABS="$(abs "$DECK")"
[ -f "$DECK_ABS" ] || { echo "找不到 deck: $DECK_ABS"; exit 1; }
mkdir -p "$OUTDIR"
OUT_ABS="$(abs "$OUTDIR")"

# 片段 -> 套骨架，落到临时文件
TMPDIR_WRAP=""
if [ "$WRAP" = "1" ] || ! grep -q 'id="stage"' "$DECK_ABS"; then
  if grep -q 'class="slide' "$DECK_ABS"; then
    TMPDIR_WRAP="$(mktemp -d)"
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    NEW="$(python - "$SCRIPT_DIR" "$DECK_ABS" "$TMPDIR_WRAP" <<'PY'
import os, sys
script_dir, deck, outdir = sys.argv[1], sys.argv[2], sys.argv[3]
sys.path.insert(0, script_dir)
from probe import wrap_fragment
src = open(deck, encoding="utf-8").read()
wrapped, _ = wrap_fragment(src)
p = os.path.join(outdir, "wrapped.html")
open(p, "w", encoding="utf-8").write(wrapped)
print(p.replace("\\", "/"))
PY
)" || { echo "片段包装失败"; exit 1; }
    echo "片段模式: 已套骨架 -> $NEW"
    DECK_ABS="$NEW"
  fi
fi

cleanup() { [ -n "$TMPDIR_WRAP" ] && rm -rf "$TMPDIR_WRAP"; }
trap cleanup EXIT

find_browser() {
  if [ -n "${DECK_BROWSER:-}" ] && [ -x "$DECK_BROWSER" ]; then echo "$DECK_BROWSER"; return; fi
  local list=(
    "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
    "/c/Program Files/Microsoft/Edge/Application/msedge.exe"
    "/c/Program Files/Google/Chrome/Application/chrome.exe"
    "/c/Program Files (x86)/Google/Chrome/Application/chrome.exe"
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
    "/usr/bin/google-chrome"
    "/usr/bin/chromium"
  )
  local p
  for p in "${list[@]}"; do [ -x "$p" ] && { echo "$p"; return; }; done
  command -v msedge || command -v chrome || command -v chromium || true
}

BROWSER="$(find_browser)"
[ -n "$BROWSER" ] || { echo "找不到 Chrome/Edge，请设置 DECK_BROWSER"; exit 1; }

TOTAL=$(grep -cE '^[[:space:]]*<section class="slide' "$DECK_ABS" || true)

if [ -z "$PAGES" ]; then
  PAGES="$(seq 1 "$TOTAL" | paste -sd, -)"
fi

# 展开 3,7-12 这种写法
PAGE_LIST=""
IFS=',' read -ra CHUNKS <<< "$PAGES"
for c in "${CHUNKS[@]}"; do
  c="${c// /}"
  if [[ "$c" == *-* ]]; then
    a="${c%-*}"; b="${c#*-}"
    for n in $(seq "$a" "$b"); do PAGE_LIST="$PAGE_LIST $n"; done
  else
    PAGE_LIST="$PAGE_LIST $c"
  fi
done

echo "deck: $DECK_ABS  ($TOTAL 页)  输出: $OUT_ABS"
for n in $PAGE_LIST; do
  printf "  #%-3s " "$n"
  "$BROWSER" --headless=new --disable-gpu --hide-scrollbars \
    --force-device-scale-factor=1 --window-size=1280,720 \
    --virtual-time-budget=2500 \
    --screenshot="${OUT_ABS}/p$(printf '%02d' "$n").png" \
    "file:///${DECK_ABS}#${n}" >/dev/null 2>&1
  [ -f "${OUT_ABS}/p$(printf '%02d' "$n").png" ] && echo "ok" || echo "FAILED"
done
echo "完成。逐张看，或对可疑页用 --force-device-scale-factor=2 重截。"
