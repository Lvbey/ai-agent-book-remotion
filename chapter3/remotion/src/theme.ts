// 第三章视觉主题：沿用第二章《上下文工程》的视觉基因（纸感底色 + 墨绿/珊瑚/金/蓝），
// 仅做必要扩展，保证系列一致性。
export const VIDEO = {
  width: 1920,
  height: 1080,
  fps: 30,
} as const;

export const COLORS = {
  ink: '#18302D',
  inkSoft: '#49615A',
  paper: '#F6F3EA',
  paperDeep: '#EAE5D9',
  green: '#276A57',
  greenBright: '#5AA88B',
  coral: '#D9674E',
  gold: '#E7B44E',
  blue: '#5A7CA8',
  white: '#FFFEF9',
  muted: '#9CA9A0',
  danger: '#B74F42',
} as const;

export const TYPE = {
  display: 88,
  h1: 62,
  h2: 44,
  h3: 34,
  body: 30,
  small: 24,
  tiny: 18,
} as const;

// 各语义分区的强调色，用于场景内的语义一致性（同一概念全片同色）
export const SEM = {
  trajectory: COLORS.blue, // 轨迹 / 运行时上下文
  longTerm: COLORS.green, // 用户长期记忆
  business: COLORS.gold, // 业务状态
  episodic: COLORS.coral, // 情景记忆
  semantic: COLORS.green, // 语义记忆
  procedural: COLORS.gold, // 程序记忆
  working: COLORS.blue, // 工作记忆
  pii: COLORS.danger, // 敏感信息
} as const;
