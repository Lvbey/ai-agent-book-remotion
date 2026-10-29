import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {Intro} from './scenes/Intro';
import {ContextMap} from './scenes/ContextMap';
import {ApiStructure, ChatTemplate, PromptEngineering, StateBar, CompressionStrategies, SubAgentIsolation} from './scenes/ChapterDeepDive';
import {AgentLoop} from './scenes/AgentLoop';
import {PromptAndSafety} from './scenes/PromptAndSafety';
import {Cache} from './scenes/Cache';
import {StateAndCompress} from './scenes/StateAndCompress';
import {Conclusion} from './scenes/Conclusion';
import {COLORS} from './theme';
import {SCENE_TIMING} from './sceneTiming';

const sceneSpecs = [
  {name:'01 开场：信息缺失', duration:SCENE_TIMING.Intro.duration, component:Intro},
  {name:'02 上下文是什么', duration:SCENE_TIMING.ContextMap.duration, component:ContextMap},
  {name:'03 API 消息结构', duration:SCENE_TIMING.ApiStructure.duration, component:ApiStructure},
  {name:'04 Agent 工具循环', duration:SCENE_TIMING.AgentLoop.duration, component:AgentLoop},
  {name:'05 Chat Template：消息到 Token', duration:SCENE_TIMING.ChatTemplate.duration, component:ChatTemplate},
  {name:'06 KV Cache 与稳定前缀', duration:SCENE_TIMING.Cache.duration, component:Cache},
  {name:'07 提示工程与 Few-shot', duration:SCENE_TIMING.PromptEngineering.duration, component:PromptEngineering},
  {name:'08 Skills、提示注入与安全', duration:SCENE_TIMING.PromptAndSafety.duration, component:PromptAndSafety},
  {name:'09 Agent 状态栏', duration:SCENE_TIMING.StateBar.duration, component:StateBar},
  {name:'10 上下文压缩：状态与噪声', duration:SCENE_TIMING.StateAndCompress.duration, component:StateAndCompress},
  {name:'11 六类压缩策略与生产分层', duration:SCENE_TIMING.CompressionStrategies.duration, component:CompressionStrategies},
  {name:'12 子 Agent 上下文隔离', duration:SCENE_TIMING.SubAgentIsolation.duration, component:SubAgentIsolation},
  {name:'13 总结：设计上下文', duration:SCENE_TIMING.Conclusion.duration, component:Conclusion},
] as const;

let cursor = 0;
export const scenes = sceneSpecs.map((scene) => {
  const from = cursor;
  cursor += scene.duration;
  return {...scene, from};
});

export const MainVideo: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: COLORS.paper}}>
    {scenes.map((scene) => {
      const Component = scene.component;
      return <Sequence key={scene.name} from={scene.from} durationInFrames={scene.duration} name={scene.name}>
        <Component />
      </Sequence>;
    })}
  </AbsoluteFill>
);
