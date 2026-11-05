p = "ch5-coding-agent-slides.html"
s = open(p, encoding="utf-8").read()

i = s.index('<svg viewBox="0 0 1124 168" style="width:100%;height:auto;overflow:visible">\n          <defs>\n            <pattern id="p16c-hatch"')
j = s.index('</svg>', i) + 6

new = '''<svg viewBox="0 0 1124 216" style="width:100%;height:auto;overflow:visible">
          <defs>
            <pattern id="p16c-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="7" stroke="rgba(255,180,107,.30)" stroke-width="1.2"/>
            </pattern>
          </defs>

          <!-- 写法 A：追加 -->
          <text x="0" y="54" class="node-label" fill="#4fe3ff">追加式</text>
          <rect x="118" y="24" width="580" height="52" rx="5" fill="rgba(79,227,255,.09)" stroke="rgba(79,227,255,.34)"/>
          <text x="408" y="55" class="node-sub" font-size="11.5" fill="#9fd8ea" text-anchor="middle">系统提示词 + 工具定义 + 历史消息 · 约 100k，命中缓存</text>
          <rect x="698" y="24" width="46" height="52" rx="5" fill="rgba(79,227,255,.30)" stroke="rgba(79,227,255,.6)"/>
          <text x="754" y="55" class="node-sub" font-size="11.5" fill="#4fe3ff">只算新增的几千 token</text>

          <!-- 写法 B：改写前缀 -->
          <text x="0" y="150" class="node-label" fill="#ffb46b">硬编码</text>
          <rect x="118" y="120" width="626" height="52" rx="5" fill="rgba(255,180,107,.10)" stroke="rgba(255,180,107,.42)"/>
          <rect x="118" y="120" width="626" height="52" rx="5" fill="url(#p16c-hatch)"/>
          <text x="431" y="151" class="node-sub" font-size="11.5" fill="#ffb46b" text-anchor="middle">前缀被改写 → 这 100k 全部重算</text>
          <text x="754" y="151" class="node-sub" font-size="11.5" fill="#ffb46b">每轮都要重付这一遍</text>

          <text x="0" y="204" class="node-sub" font-size="11.5" fill="#6a7a9a">同样的信息量，只因为位置不同，逐轮的算力账单差一个数量级。</text>
        </svg>'''

s = s[:i] + new + s[j:]
s = s.replace('style="--d:.2s;margin-top:10px"', 'style="--d:.2s;margin-top:18px"')
open(p, "w", encoding="utf-8").write(s)
print("ok")
