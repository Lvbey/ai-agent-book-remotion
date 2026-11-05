import re, io, sys

p = "ch5-coding-agent-slides.html"
s = open(p, encoding="utf-8").read()
parts = re.split(r'(?=<section class="slide)', s)

CY, CS, CT = 'rgba(79,227,255,.09)', 'rgba(79,227,255,.38)', '#4fe3ff'
EY, ES, ET = 'rgba(255,180,107,.10)', 'rgba(255,180,107,.42)', '#ffb46b'

def bar(x, w, label, fill, stroke, textfill, ytop=34, h=74):
    cy = ytop + h // 2 + 5
    return ('          <rect x="%d" y="%d" width="%d" height="%d" rx="6" fill="%s" stroke="%s"/>\n'
            '          <text x="%d" y="%d" class="node-sub" font-size="12" fill="%s" text-anchor="middle">%s</text>\n'
            % (x, ytop, w, h, fill, stroke, x + w // 2, cy, textfill, label))

# ---------------- page 67 ----------------
seg = parts[67]
start = seg.index('        <svg viewBox="0 0 1124 168"')
end = seg.index('        </svg>', start) + len('        </svg>')

new67 = '\n'.join([
'        <svg viewBox="0 0 1124 246" style="width:100%;height:auto;overflow:visible">',
'          <defs>',
'            <pattern id="p16a-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">',
'              <line x1="0" y1="0" x2="0" y2="7" stroke="rgba(255,180,107,.30)" stroke-width="1.2"/>',
'            </pattern>',
'            <marker id="p16c-ar" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">',
'              <path d="M0 1.2L8 4.5L0 7.8z" fill="#5b6b88"/></marker>',
'            <marker id="p16c-al" markerWidth="9" markerHeight="9" refX="1" refY="4.5" orient="auto-start-reverse">',
'              <path d="M8 1.2L0 4.5L8 7.8z" fill="#5b6b88"/></marker>',
'          </defs>',
'',
'          <text x="12" y="20" class="node-label" font-size="11.5" fill="#6a7a9a">一次推理里的三个工具调用 · 严格串行</text>',
'',
]) + ''.join([
    bar(12, 176, '① 生成 · 模型在跑', CY, CS, CT),
    bar(188, 196, '① 执行 · 模型空转', EY, ES, ET),
    '          <rect x="188" y="34" width="196" height="74" rx="6" fill="url(#p16a-hatch)"/>\n',
    bar(384, 186, '② 生成 · 模型在跑', CY, CS, CT),
    bar(570, 206, '② 执行 · 模型空转', EY, ES, ET),
    '          <rect x="570" y="34" width="206" height="74" rx="6" fill="url(#p16a-hatch)"/>\n',
    bar(776, 166, '③ 生成 · 模型在跑', CY, CS, CT),
    bar(942, 170, '③ 执行 · 模型空转', EY, ES, ET),
    '          <rect x="942" y="34" width="170" height="74" rx="6" fill="url(#p16a-hatch)"/>\n',
]) + '\n'.join([
'',
'          <text x="12" y="142" class="node-sub" font-size="11.5" fill="#7d8fae">墙钟总长：三段生成 + 三段执行，首尾相接，中间没有一处重叠</text>',
'          <path d="M12 154 H1112" stroke="#5b6b88" stroke-width="1" fill="none" marker-start="url(#p16c-al)" marker-end="url(#p16c-ar)"/>',
'',
'          <text x="12" y="196" class="node-sub" font-size="12" fill="#8fa2c4">三段执行全排在链路上：这段时间模型一个字都不生成，只是在等一个早就该跑起来的调用。</text>',
'          <text x="12" y="224" class="node-sub" font-size="12" fill="#6a7a9a">如果下一个调用的参数依赖这个结果，它连参数都还写不出来——只能干等。</text>',
'        </svg>'])

seg = seg[:start] + new67 + seg[end:]
seg = seg.replace('style="--d:.22s;margin-top:12px"', 'style="--d:.22s;margin-top:26px"')
parts[67] = seg

# ---------------- page 68 ----------------
seg = parts[68]
start = seg.index('        <svg viewBox="0 0 1124 288"')
end = seg.index('        </svg>', start) + len('        </svg>')

def seg3(x, w, label, y=260):
    return ('          <rect x="%d" y="%d" width="%d" height="32" rx="4" fill="rgba(140,170,220,.05)" stroke="rgba(140,170,220,.20)"/>\n'
            '          <text x="%d" y="%d" class="node-sub" font-size="11" fill="#7d8fae" text-anchor="middle">%s</text>\n'
            % (x, y, w, x + w // 2, y + 20, label))

new68 = '\n'.join([
'        <svg viewBox="0 0 1124 378" style="width:100%;height:auto;overflow:visible">',
'          <defs>',
'            <marker id="f16b-ar" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">',
'              <path d="M0 0L8 4L0 8z" fill="#4fe3ff"/></marker>',
'          </defs>',
'',
'          <rect x="104" y="12" width="1016" height="60" rx="8" fill="rgba(255,255,255,.02)" stroke="rgba(140,170,220,.12)"/>',
'          <text x="0" y="46" class="node-label" fill="#a9b8d6">模型 · 生成</text>',
'          <rect x="112" y="24" width="228" height="32" rx="5" fill="rgba(79,227,255,.11)" stroke="rgba(79,227,255,.42)"/>',
'          <text x="226" y="44" class="node-sub" font-size="12" fill="#4fe3ff" text-anchor="middle">① 搜代码</text>',
'          <rect x="340" y="24" width="260" height="32" rx="5" fill="rgba(79,227,255,.11)" stroke="rgba(79,227,255,.42)"/>',
'          <text x="470" y="44" class="node-sub" font-size="12" fill="#4fe3ff" text-anchor="middle">② 查配置文件</text>',
'          <rect x="600" y="24" width="180" height="32" rx="5" fill="rgba(79,227,255,.11)" stroke="rgba(79,227,255,.42)"/>',
'          <text x="690" y="44" class="node-sub" font-size="12" fill="#4fe3ff" text-anchor="middle">③ 读日志</text>',
'',
'          <path d="M340 72 L340 90" stroke="#4fe3ff" stroke-width="1.3" fill="none" marker-end="url(#f16b-ar)"/>',
'          <text x="330" y="86" class="node-sub" font-size="11" fill="#4fe3ff" text-anchor="end">参数完整</text>',
'',
'          <rect x="104" y="96" width="1016" height="98" rx="8" fill="rgba(255,255,255,.02)" stroke="rgba(140,170,220,.12)"/>',
'          <text x="0" y="149" class="node-label" fill="#a9b8d6">工具 · 执行</text>',
'          <rect x="340" y="104" width="260" height="32" rx="5" fill="rgba(139,123,255,.16)" stroke="rgba(139,123,255,.55)"/>',
'          <text x="470" y="124" class="node-sub" font-size="12" fill="#a89bff" text-anchor="middle">跑 ①</text>',
'          <rect x="600" y="104" width="260" height="32" rx="5" fill="rgba(139,123,255,.16)" stroke="rgba(139,123,255,.55)"/>',
'          <text x="730" y="124" class="node-sub" font-size="12" fill="#a89bff" text-anchor="middle">跑 ②</text>',
'          <rect x="780" y="150" width="180" height="32" rx="5" fill="rgba(139,123,255,.16)" stroke="rgba(139,123,255,.55)"/>',
'          <text x="870" y="170" class="node-sub" font-size="12" fill="#a89bff" text-anchor="middle">跑 ③</text>',
'',
'          <rect x="780" y="104" width="80" height="78" fill="rgba(139,123,255,.10)"/>',
'          <text x="972" y="124" class="node-sub" font-size="11.5" fill="#9b8fff">① 还没跑完，② ③ 已经起来</text>',
'          <text x="972" y="146" class="node-sub" font-size="11" fill="#6a7a9a">同一时刻有三条执行在跑</text>',
'',
'          <path d="M340 214 V232 H780 V214" stroke="#8b7bff" stroke-width="1.2" fill="none"/>',
'          <text x="792" y="228" class="node-sub" font-size="11.5" fill="#9b8fff">生成 ② ③ 的同时，执行 ① 已经在跑</text>',
'',
'          <rect x="104" y="248" width="1016" height="54" rx="8" fill="rgba(255,255,255,.012)" stroke="rgba(140,170,220,.18)" stroke-dasharray="5 5"/>',
'          <text x="0" y="279" class="node-label" fill="#6a7a9a">串行 · 对照</text>',
]) + ''.join([
    seg3(112, 155, '① 生成'),
    seg3(267, 177, '① 执行'),
    seg3(444, 177, '② 生成'),
    seg3(621, 177, '② 执行'),
    seg3(798, 122, '③ 生成'),
    seg3(920, 150, '③ 执行'),
]) + '\n'.join([
'',
'          <text x="0" y="338" class="node-sub" font-size="12" fill="#8fa2c4">串行是六段首尾相接；流式把「等结果」这段时间填进了生成里，总长只由最长的那条链决定。</text>',
'          <text x="0" y="366" class="node-sub" font-size="11.5" fill="#6a7a9a">所以优化的方向不是「让模型更快」，而是「让等待有地方去」。</text>',
'        </svg>'])

seg = seg[:start] + new68 + seg[end:]
seg = seg.replace('style="--d:.22s;margin-top:10px"', 'style="--d:.22s;margin-top:18px"')
parts[68] = seg

open(p, "w", encoding="utf-8").write("".join(parts))
print("ok")
