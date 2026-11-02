import {useCurrentFrame} from 'remotion';
import voiceTimeline from './voice-timeline.json';

/**
 * 每个场景的时间轴只有一份配置。
 *
 * authoredEnd: 画面中各个 interpolate/appear 使用的「分镜逻辑帧」终点，
 * duration: 在合成视频中真正分配的帧数。
 *
 * 以前直接用 useCurrentFrame() * 1.5 / 7.05 等放大帧数，导致动画
 * 在前几秒就到达 clamp 终点，后面几十秒完全静止。
 * 现在把整个分镜逻辑时间轴线性铺满实际场景，只留末尾 1.5-2 秒供阅读。
 */
const AUTHORED_TIMING = {
  Intro:                {duration: 900,  authoredEnd: 715, hold: 45},
  ContextMap:           {duration: 1350, authoredEnd: 700, hold: 45},
  ApiStructure:         {duration: 1800, authoredEnd: 270, hold: 60},
  AgentLoop:            {duration: 1800, authoredEnd: 605, hold: 60},
  ChatTemplate:         {duration: 1350, authoredEnd: 280, hold: 60},
  Cache:                {duration: 1800, authoredEnd: 450, hold: 60},
  PromptEngineering:    {duration: 1800, authoredEnd: 275, hold: 60},
  PromptAndSafety:      {duration: 1800, authoredEnd: 530, hold: 60},
  StateBar:             {duration: 1500, authoredEnd: 290, hold: 60},
  StateAndCompress:     {duration: 1800, authoredEnd: 520, hold: 60},
  CompressionStrategies:{duration: 2250, authoredEnd: 240, hold: 60},
  SubAgentIsolation:    {duration: 1350, authoredEnd: 260, hold: 60},
  Conclusion:           {duration: 900,  authoredEnd: 515, hold: 60},
} as const;

export type SceneKey = keyof typeof AUTHORED_TIMING;
export const SCENE_TIMING = Object.fromEntries(
  Object.entries(AUTHORED_TIMING).map(([key, spec]) => [key, {...spec, duration: voiceTimeline[key as SceneKey].duration}])
) as Record<SceneKey, {duration:number; authoredEnd:number; hold:number}>;
export const TOTAL_FRAMES: number = Object.values(SCENE_TIMING).reduce(
  (sum, scene) => sum + scene.duration, 0,
);

/** 按实际场景时长推进逻辑分镜帧；可以统一修改时长而不产生冗长定格。 */
export const getStoryFrame = (key: SceneKey, localFrame: number): number => {
  const data = voiceTimeline[key];
  const ms = localFrame / 30 * 1000;
  const anchors = [...data.anchors, {ms: (data.audioSeconds - 1) * 1000, frame: SCENE_TIMING[key].authoredEnd}];
  if (ms <= anchors[0].ms) return anchors[0].frame;
  for (let i=1; i<anchors.length; i++) {
    if (ms <= anchors[i].ms) {
      const a=anchors[i-1], b=anchors[i];
      return a.frame + (b.frame-a.frame) * Math.max(0, Math.min(1,(ms-a.ms)/(b.ms-a.ms)));
    }
  }
  return SCENE_TIMING[key].authoredEnd;
};

export const useStoryFrame = (key: SceneKey): number =>
  getStoryFrame(key, useCurrentFrame());
