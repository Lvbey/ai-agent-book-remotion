# Chapter 2《上下文工程》AI 配音与字幕同步：本地 Codex 实施交接

> 整理日期：2026-10-29。**这是实现交接与验收规范，不是已经完成 API 调用或合成音频的声明。**
>
> 本文供用户稍后在本地启动的 Codex 使用。届时用户会自行准备豆包语音 API Key。**绝不把 API Key、完整鉴权头、付费账号信息提交到 GitHub。**

## 0. 任务与已确认决策

项目：[Lvbey/ai-agent-book-remotion](https://github.com/Lvbey/ai-agent-book-remotion)，目录 `chapter2/`。

目标：把《AI Agents in Depth》第二章“上下文工程”制作成真正能帮助观众理解完整章节的中文教学动画；不满足于 13 张会动的 PPT。内容必须覆盖重要机制、例子、实验条件与工程取舍，旁白、字幕、概念动画要同步推进。

**用户明确选择的声音人设：**

- **知性青年女声**，普通话，25～30 岁左右的声音感觉。
- **B 站知识区 UP 主风格**：生动有趣、亲切、聪明，像与朋友解释技术问题；不能变成机械播报或刻意卖萌。
- 保持全系列声音身份稳定。提问时带好奇，讲解时清晰，举例时轻松，强调重点时自然加重；专业术语发音统一。
- 用户选择在本地 Codex 实现 API 调用，并自行配置 API Key；现在**只交接背景与实施要求**。

**首选模型与音色：**

| 配置 | 值 |
| --- | --- |
| 供应商 | 火山引擎 / 豆包语音 |
| 模型资源 | `seed-tts-2.0` |
| 音色显示名 | 知性女声 2.0 |
| `speaker` / 音色 ID | `zh_female_zhixingnv_uranus_bigtts` |
| API | `POST https://openspeech.bytedance.com/api/v3/tts/unidirectional` |
| API 形式 | HTTP Chunked，输入文本，返回音频块；可启用字级时间戳 |
| 建议采样 | 48 kHz PCM 中间音频，最终转换为 WAV；实际以接口返回格式为准 |
| 初始语速 | `speech_rate: 0`（豆包本接口默认速率，**不是静音**） |
| 时间戳 | `req_params.audio_params.enable_subtitle: true` |
| 风格指令 | `req_params.context_texts`，使用短而稳定的中文描述 |

官方参考：
- [2.0 音色列表](https://docs.volcengine.com/docs/DoubaoVoice/Tonelist-1?lang=zh)（确认“知性女声 2.0”及 ID）
- [2.0 单向流式 HTTP API](https://docs.volcengine.com/docs/doubao-voice/unidirectional-streaming-text-to-speech-http?lang=zh)（Header、`context_texts`、`enable_subtitle`、音频与时间戳结构）
- [计费说明](https://docs.volcengine.com/docs/doubao-voice/billing-instructions?lang=zh)（截至整理时后付费刊例约 3 元/万字符，实际以控制台为准）

**备选，只用于试听对比或主方案不满意时：**

1. MiniMax `speech-2.8-hd`，`Chinese (Mandarin)_Warm_Bestie`（温暖闺蜜），可用语速/情绪控制。
2. 阿里云 `cosyvoice-v3-plus`，`longanhuan`（龙安欢，支持“科普知识推广”风格及时间戳）。
3. 注意：`cosyvoice-v3.5-plus` **没有系统预置音色**，不能直接使用 `longanhuan`，需要单独设计/克隆音色。

不要把备选模型混入正式 13 段音轨。先统一试听，再锁定一个音色。

## 1. 当前仓库真实状态（本次已核对 main 分支）

- `chapter2/director-plan.md`：知识清单、教学内容映射。
- `chapter2/storyboard.md`：13 场景时间轴与旁白内容。**重要：这里的“完整旁白文案”目前按 01–02、03–05、06–08、09–10、11–13 五组写成段落，不是已经准备好的 13 个独立 TTS 请求文件。**必须先根据各场景教学目标拆稿并校对衔接。
- `chapter2/remotion/src/sceneTiming.ts`：13 个 `SCENE_TIMING`、`getStoryFrame()`、`useStoryFrame()` 与 `TOTAL_FRAMES`。
- `chapter2/remotion/src/MainVideo.tsx`：13 个 `Sequence` 的编排及 `scenes` 起点。
- `chapter2/remotion/README.md`：安装、预览、时间轴回归说明。
- `chapter2/remotion/scripts/check-scene-timing.mjs`：`npm run check:timing` 检查。
- `chapter2/remotion/package.json`：已有 `dev`、`typecheck`、`render`、`check:timing` 等脚本。

当前目标规格为 **1920×1080 / 30 fps / 11:20 / 20,400 帧**；这只是旧版固定时间轴。视频尚无正式旁白，也未经完整渲染与逐镜头验收。此前 00:50–01:14 附近曾有长时间静帧，已有线性分镜时钟的代码级修复，但缺少与实际音频绑定的语义触发点。

13 场景（旧时间，仅作为拆稿初始参考）：

| # | SceneKey | 原时间 | 主题 |
| --- | --- | --- | --- |
| 01 | Intro | 00:00–00:30 | 信息缺失导致失败 |
| 02 | ContextMap | 00:30–01:15 | 上下文构成与筛选 |
| 03 | ApiStructure | 01:15–02:15 | API 消息结构 |
| 04 | AgentLoop | 02:15–03:15 | Agent 工具循环 |
| 05 | ChatTemplate | 03:15–04:00 | Chat Template 与 Token |
| 06 | Cache | 04:00–05:00 | KV Cache / Prompt Cache、稳定前缀 |
| 07 | PromptEngineering | 05:00–06:00 | 提示工程与 Few-shot |
| 08 | PromptAndSafety | 06:00–07:00 | Skills、提示注入与安全 |
| 09 | StateBar | 07:00–07:50 | Agent 状态栏 |
| 10 | StateAndCompress | 07:50–08:50 | Context Rot 与压缩 |
| 11 | CompressionStrategies | 08:50–10:05 | 六种策略、生产分层和熔断 |
| 12 | SubAgentIsolation | 10:05–10:50 | 子 Agent 上下文隔离 |
| 13 | Conclusion | 10:50–11:20 | 总结 |

## 2. 先做试听，锁定声音

从 `storyboard.md` 选 30～45 秒、同时覆盖“疑问—解释—专业术语—轻松比喻”的文字。

基础风格指令建议：

> 请用知性、清晰、亲切而略带活泼的普通话女声讲解，像 B 站知识区 UP 主在和观众分享一个有趣的技术发现。提问带一点好奇，解释时自然从容，重点词略作强调。不要播音腔，不要刻意卖萌，不要夸张表演。

实际调用时可压缩此指令，保持片段间一致；`context_texts` 是接口支持的语音指令，具体效果应试听验证，不保证严格执行每个细节。

请优先听以下问题：
- “上下文工程”、Token、Prompt、Agent、RAG、Few-shot、Chat Template、KV Cache、Prompt Cache 的发音是否统一。
- 连续生成三段是否仍像同一位讲解员。
- 英中混读是否自然，停顿是否像真人。
- 是否过度兴奋、过度甜美或像新闻播报。

只有试听确认后才全量生成。正式使用一套冻结的 voice 配置，可版本化（如 `voice-v1`）。

## 3. 本地 Codex 的实施步骤

### 阶段 A：脚本与素材清单

1. 阅读 `director-plan.md`、`storyboard.md`、`sceneTiming.ts`、`MainVideo.tsx` 和现有 13 个场景组件。
2. 把原有五组旁白按教学内容**准确拆为 13 场景**，再将每场拆成约 3～7 个自然讲解单元（通常每单元 1～3 句，勿按单字切分）。
3. 保留章节中的机制、差异、实验条件、取舍、反例、安全边界。目标是让观众看完能够理解本章，而不是删减为概念宣传片。
4. 给每个单元稳定 ID，例如 `01-01`、`01-02`，以及 `sceneKey`、`text`、`delivery`（curious/explain/emphasis/light）、`visualCues`。
5. 先输出供人工审查的场景分稿清单；不要在脚本未审核、时长估算明显不符时直接一次性调用全部付费 API。

### 阶段 B：TTS API 客户端

建议 Python 3，用 `httpx` 或 `requests`、FFmpeg/ffprobe。接口应封装成可替换 Provider，但优先只实现豆包 2.0。

鉴权 Headers：
- `X-Api-Key`：运行时读取环境变量 `DOUBAO_TTS_API_KEY`；
- `X-Api-Resource-Id: seed-tts-2.0`；
- `X-Api-Request-Id`：每请求不同的 UUID；
- `Content-Type: application/json`。

请求体参考（不是完整可运行客户端；须按 HTTP Chunked 协议处理多次响应）：

```json
{
  "req_params": {
    "text": "为什么大模型有时会忘记刚刚说过的话？",
    "speaker": "zh_female_zhixingnv_uranus_bigtts",
    "audio_params": {
      "format": "pcm",
      "sample_rate": 48000,
      "speech_rate": 0,
      "enable_subtitle": true
    },
    "context_texts": [
      "请用知性、亲切、略带好奇的科技科普语气讲解，像在和观众聊天。"
    ]
  }
}
```

API 输出的音频块可能为 Base64，字幕包含 `sentence.words[]`、`word`、`startTime`、`endTime`、`confidence`；时间单位为**秒**。需要正确拼接音频块、保持有序，并记录每个片段的**实测音频长度**。把 PCM 按实际编码参数转换成 WAV；不要误把裸 PCM 当成自带 WAV 文件头的文件。

要求：
- 超时、限流与网络错误应有限次指数退避；失败时不能输出看似成功的空音频。
- 生成片段校验：非零文件大小、可解码、实际时长合理、字幕时间不越界。
- 按 `model + speaker + instruction + text + pronunciation + 参数` 的哈希做内容缓存；未变化的片段不得重复计费。
- 写入日志时不要输出 API Key 或完整 Authorization 信息。
- `pronunciation_dict` 以官方语法解决发音问题；文字转写与 SSML 的冲突需参考文档，避免盲目叠加。
- 若 `enable_subtitle` 缺失/失败，采用可控的强制对齐或 ASR 作为后备，并标记需要人工复查；不能凭字符数平均分配时间冒充精准字幕。

### 阶段 C：音频拼接与字幕时间

**兼容性要求：正式文件保持 13 段**：`public/audio/narration/01.wav` ～ `13.wav`。细分片段可以保留在工作缓存目录，以便局部重生成。

推荐目录（以现有 `chapter2/remotion/` 为工程根，不要在 `chapter2/` 根外重复生成第二套 Remotion 工程）：

```text
chapter2/
  voiceover-handoff.md              # 本文
  storyboard.md
  director-plan.md
  remotion/
    .env.example                    # 仅变量名示例，绝不含真实密钥
    scripts/
      generate-tts.py
      build-voice-timeline.py
      check-voice-sync.mjs
    narration/
      script.json
      voice-config.json
      pronunciation.json
      generated-manifest.json
      segments/                    # 中间片段及字级时间戳
    public/
      audio/narration/01.wav ... 13.wav
    src/
      sceneTiming.ts
      MainVideo.tsx
      ...
```

生成字幕时，先聚合原始字级时间戳，再按中文语义分成 1～2 行的字幕页，而不是每一个字单独闪烁。输出 Remotion `@remotion/captions` 兼容格式：

```json
[
  {
    "text": "上下文工程",
    "startMs": 0,
    "endMs": 930,
    "timestampMs": 465,
    "confidence": null
  }
]
```

上面的时间仅用于说明结构，**不能直接当实际时间戳**。必要时用 `pageBreakAfter` 标记分页。

单元的字幕原始起点 = 相对该单元音频；场景内时间 = 单元合成起点 + 字/词时间；全局时间 = 场景起点 + 场景内时间。

将片段拼接时添加的自然停顿真实计入每段时长；不可只把字幕数组相加却漏算静音。建议每场结束保留约 1～2 秒收束，细分片段之间按听感调整短停顿。音频响度最终统一，背景音乐始终低于人声并在重点讲解时避让。

### 阶段 D：Remotion 接入与自动时间轴

**现有代码接入点：**

- `src/MainVideo.tsx`：为每个 Scene 的 `Sequence` 添加该场景的 `@remotion/media` `<Audio>` 和同场景字幕组件。源地址使用 `staticFile()`。
- `src/sceneTiming.ts`：将固定 `duration` 改为由**实测音频时长**生成或导入的帧数，保留 `authoredEnd`、`hold` 的分镜语义，并更新 `TOTAL_FRAMES`。
- `src/Root.tsx`：确认 Composition 总帧数自动跟随新的 `TOTAL_FRAMES`。
- 13 个场景组件：不能只线性拉长现有 `interpolate`；需要根据 **visualCues 的关键字真实发音时刻**，安排概念进入、错误反馈、工具调用、缓存复用、压缩前后对比等画面变化。

帧计算：`frame = Math.round(startMs * fps / 1000)`，`fps=30`。**使用累计绝对起止时间计算场景边界**，不要对每个片段分别取整后直接相加，以避免积累偏差。

字幕与对应视频/音频应同置于 `Sequence` 或 `Series.Sequence` 中。若需要 Remotion Studio 对 Basic Captions 源码进行可视化写回，建议生成内联 `Caption[]` 数组的 TSX；若采用 JSON 动态读取，要接受不能直接由 Studio 自动写回源码的限制。

原片的 **11:20 是参考目标，不是优先于知识完整性和自然语速的硬约束**。若正确、自然的完整旁白超过 11:20，应更新场景时长、总帧数和说明，不能为了卡固定时长而过度加速或遗漏关键内容。

### 阶段 E：视听质量验收

至少满足：

1. 13 场景、整个章节知识清单无重要遗漏；不混淆 KV Cache 与 Prompt Cache，不夸大实验结果，不把摘要说成无损。
2. 所有段落声音身份一致，无明显换声、爆音、刺耳拼接或不自然大停顿。
3. 专业术语按词典读对；中英文混读自然。
4. 字幕跟随**实际音频时间戳**，无明显早晚、错字、空白过长、超出画面或越界。
5. 每隔约 3～6 秒有**与讲解语义相关**的视觉进展；不得出现十几秒同一静帧的情况。
6. 重点复查此前的问题区间（旧时间轴 **00:50、01:00、01:10、01:14**；若音频驱动后移动，需要映射到对应语义片段），以及每场开头、中间、结尾。
7. `npm run typecheck`、`npm run check:timing` 通过；额外校验音频总时长与视频总帧数、每条字幕不越界、13 段都存在。
8. `npm run dev` 的 Studio 能预览并听到声音；先做短片段烟雾测试，用户确认后再完整渲染。
9. 最终人声与 BGM 混音统一响度；不得因为背景音乐遮盖对知识的解释。
10. 实施后更新 README：准确写明真实已完成的测试与尚未验收内容，不把“源码已上传”写成“成片已验证”。

## 4. 密钥与 Git 纪律

用户稍后在本地配置 `DOUBAO_TTS_API_KEY`。建议读取本地 `.env` 或操作系统环境变量；`.env.example` 只列键名。

```dotenv
DOUBAO_TTS_API_KEY=
```

`.env`、日志中的敏感鉴权信息、未授权的声音样本不得提交。建议在 `chapter2/remotion/.gitignore` 增加 `.env`、`.env.*`（保留 `!.env.example`），以及大量可再生成的中间缓存。正式 13 段 WAV 是否提交 Git，由用户在试听和文件大小确认后决定；大型文件优先评估 Git LFS 或外部存储。

不要删除、覆盖本地已有修改；先检查工作树和最新分支状态。

## 5. 请本地 Codex 优先完成的顺序

**第一阶段（先做，暂不全量付费调用）：**
1. 审核项目现有状态，拆分并输出 13 场景的逐句旁白 JSON，与原 `storyboard.md`、`director-plan.md` 对照。
2. 新增密钥配置模板、忽略规则、豆包 API 适配器、30～45 秒试听脚本。
3. 用试听文字合成一小段音频与字级字幕，验证音色、格式、API 与时间戳。
4. 给用户试听确认；不要跳过确认直接合成整章。

**第二阶段（试听确认后）：**
5. 批量生成所有细分片段，合成 `01.wav`～`13.wav`，保存原始时间戳与字幕 JSON。
6. 用真实时长构建单一时间轴数据，更新 `sceneTiming.ts`、`MainVideo.tsx`、字幕组件和动画触发点。
7. 完成类型/时间校验、Studio 预览、关键时刻的视觉抽查与最终完整渲染验收。

## 6. 可直接粘贴给本地 Codex 的任务提示

> 请阅读本仓库 `chapter2/voiceover-handoff.md`，并结合 `chapter2/director-plan.md`、`chapter2/storyboard.md`、`chapter2/remotion/README.md` 以及现有 Remotion 源码，按文档的“第一阶段”落地实施。
>
> 我已在本地准备豆包语音 API Key（从环境变量 `DOUBAO_TTS_API_KEY` 读取），模型为 `seed-tts-2.0`，指定音色 `zh_female_zhixingnv_uranus_bigtts`，知性青年女声、B 站知识区 UP 主风格。
>
> 先完成 13 场景准确拆稿、音色配置、API 客户端与 30～45 秒试听，并生成对应字级时间戳。试听效果确认前，不要全量调用付费 API，也不要大幅重构视频场景。
>
> 后续再制作 13 段正式 WAV、字幕 JSON，以真实音频时长驱动 Remotion 分镜，检查长时间静帧和全章知识覆盖。不得泄露 API Key，保留用户现有改动。先报告实施与试听结果。

---

### 状态记录

- [x] 用户已确定声音人设、主模型与主音色
- [x] 已检查 GitHub 当前源文件和 13 场景时间轴结构
- [x] 已定义 TTS/字幕/Remotion 接入与验收方案
- [ ] 用户在本地配置豆包 API Key
- [ ] 本地 Codex 拆分 13 场景逐句稿并实现试听客户端
- [ ] 用户试听确认音色
- [ ] 正式配音、字幕生成与 Remotion 接入
- [ ] 完整渲染和视觉/音频验收
