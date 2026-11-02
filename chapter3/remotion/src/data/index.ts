// 注意：时间轴与字幕由 scripts/build-subtitles.mjs 统一生成，
// 本模块只做类型化读取，避免在 TS 与脚本中重复实现同一套时长推导逻辑。
import unitsGenerated from './ep01-units.generated.json';
import captionsGenerated from './ep01-captions.generated.json';
import metaGenerated from './ep01-meta.generated.json';
import narrationGenerated from './ep01-narration.generated.json';
import coverageRaw from './ep01-coverage.json';

export type Step = {kind: string; label: string; v?: string; who?: string};

/** 旁白音轨描述：由 scripts/build-subtitles.mjs 依据音频索引写出。 */
export type NarrationUnit = {
  id: string;
  startFrame: number;
  durationInFrames: number;
  speechSeconds: number;
};

export type Narration = {
  available: boolean;
  masterAudio: string | null;
  durationSeconds: number;
  sampleRate: number | null;
  provider: string | null;
  speaker: string | null;
  speechRate: number | null;
  unitCount: number;
  totalSpeechSeconds: number;
  wordLevelCaptions: boolean;
  units: NarrationUnit[];
};

export type Caption = {
  id: string;
  unitId: string;
  text: string;
  startMs: number;
  endMs: number;
  timestampMs: number | null;
  confidence: number | null;
};

export type Unit = {
  id: string;
  scene: string;
  title: string;
  kp: string[];
  text: string;
  steps: Step[];
  section: string;
  index: number;
  start: number;
  duration: number;
  end: number;
  seconds: number;
  speechSeconds: number;
  audioSeconds?: number;
  timestampSource?: string;
};

export type KnowledgePoint = {
  id: string;
  sourceHeading: string;
  sourceAnchor: string;
  importance: 'P0' | 'P1' | 'P2';
  learningOutcome: string;
};

export const FPS = metaGenerated.fps;
export const WIDTH = metaGenerated.width;
export const HEIGHT = metaGenerated.height;
export const TOTAL_FRAMES = metaGenerated.totalFrames;
export const TOTAL_SECONDS = metaGenerated.totalSeconds;

export const UNITS = unitsGenerated as unknown as Unit[];
export const CAPTIONS = captionsGenerated as unknown as (Caption & {startFrame: number; endFrame: number})[];
export const META = metaGenerated;
export const NARRATION = narrationGenerated as unknown as Narration;
export const KNOWLEDGE_POINTS = coverageRaw as unknown as KnowledgePoint[];

export const SECTION_TITLES: Record<string, string> = {
  S0: '开场 · 本章定位',
  S1: '跨会话记忆是怎么来的',
  S2: '评估：八项能力与三层次框架',
  S3: '记忆的层次结构',
  S4: '四种存储格式',
  S5: '进阶表示：User as Code',
  S6: '认知科学基础',
  S7: '记忆框架案例',
  S8: '压缩与整理',
  S9: '隐私保护：日志脱敏',
};

export const SCENE_TITLES: Record<string, string> = {
  IntroMap: '章节知识脉络',
  ExtractDemo: '记忆提取流水线',
  EvalFrame: '三层次评估框架',
  Layers: '记忆的层次结构',
  Formats: '四种存储格式',
  CodeState: '可执行用户状态',
  Cognition: '认知科学分类',
  Frameworks: 'Mem0 与 Memobase',
  Compress: '三层压缩策略',
  Privacy: '日志脱敏流水线',
};

/** 同一场景内的语义单元分组，供场景累积状态使用。 */
export const SCENE_GROUPS: Record<string, Unit[]> = UNITS.reduce((acc: Record<string, Unit[]>, u) => {
  if (!acc[u.scene]) acc[u.scene] = [];
  acc[u.scene].push(u);
  return acc;
}, {});

/** 按帧号定位所属语义单元（二分查找）。 */
export const unitAtFrame = (frame: number): Unit => {
  let lo = 0;
  let hi = UNITS.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (UNITS[mid].start <= frame) lo = mid;
    else hi = mid - 1;
  }
  return UNITS[lo];
};

/** 取某帧正在显示的字幕条目。 */
export const captionAtFrame = (frame: number) => {
  let lo = 0;
  let hi = CAPTIONS.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (CAPTIONS[mid].startFrame <= frame) lo = mid;
    else hi = mid - 1;
  }
  return CAPTIONS[lo];
};

/** 知识点 → 覆盖它的语义单元 ID 列表。 */
export const coverageIndex = (): Record<string, string[]> => {
  const map: Record<string, string[]> = {};
  for (const kp of KNOWLEDGE_POINTS) map[kp.id] = [];
  for (const u of UNITS) {
    for (const id of u.kp) {
      if (!map[id]) map[id] = [];
      map[id].push(u.id);
    }
  }
  return map;
};
