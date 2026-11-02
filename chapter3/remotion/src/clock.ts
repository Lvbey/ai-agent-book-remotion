import {useCurrentFrame} from 'remotion';
import {Unit, Step, SCENE_GROUPS} from './data';

export type SceneStep = {step: Step; r: number; unitId: string; isCurrent: boolean};

/**
 * 取当前场景已累积的全部视觉事件：
 * 之前单元的事件以 r=1 固化，当前单元的事件按重叠窗口逐个揭示。
 * 这样场景能在整个场景持续期内保持连续推进，而不是每个单元清零重画。
 */
export const useSceneSteps = (unit: Unit) => {
  const {frame, p, n} = useUnitClock(unit);
  const group = SCENE_GROUPS[unit.scene] ?? [unit];
  const idx = Math.max(0, group.findIndex((u) => u.id === unit.id));
  const steps: SceneStep[] = [];
  for (let j = 0; j <= idx; j++) {
    const u = group[j];
    const isCurrent = j === idx;
    u.steps.forEach((s, i) => {
      steps.push({step: s, r: isCurrent ? reveal(p, i, n) : 1, unitId: u.id, isCurrent});
    });
  }
  return {steps, p, n, frame, idx, group};
};

/** 从累积事件中按 kind 取桶（只取最近 limit 条，越界自动淘汰最旧的）。 */
export const bucket = (steps: SceneStep[], kind: string, limit = 8): SceneStep[] => {
  const matched = steps.filter((s) => s.step.kind === kind);
  return limit > 0 ? matched.slice(Math.max(0, matched.length - limit)) : matched;
};


export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export const useUnitClock = (unit: Unit) => {
  const frame = useCurrentFrame();
  const local = frame - unit.start;
  const p = clamp01(local / Math.max(1, unit.duration));
  return {frame, local, p, n: Math.max(1, unit.steps.length)};
};

/**
 * 第 i 个视觉事件的揭示进度。
 * 关键设计：相邻事件的揭示窗口相互重叠（overlap > 1），
 * 因此任意时刻至少有一个元素正在发生状态变化，避免出现「静帧窗口」。
 */
export const reveal = (p: number, i: number, n: number, overlap = 1.55): number => {
  const spacing = 1 / Math.max(1, n);
  const win = spacing * overlap;
  return clamp01((p - i * spacing) / win);
};

/** 平滑的注意力位置（用于在已揭示元素之间连续移动的高亮指针）。 */
export const focusPos = (p: number, n: number): number => clamp01(p) * Math.max(0, n - 1);

/** 连续流动相位：0→1 循环，用于管道/连接线上的数据包。 */
export const flowPhase = (frame: number, periodFrames = 90): number =>
  ((frame % periodFrames) + periodFrames) % periodFrames / periodFrames;

/** 线性映射到区间，带 clamp。 */
export const mapClamp = (v: number, a: number, b: number): number => clamp01((v - a) / Math.max(1e-6, b - a));
