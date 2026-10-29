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

const sceneSpecs = [
  {name:'01 开场：信息缺失', duration:900, component:Intro},
  {name:'02 上下文是什么', duration:1350, component:ContextMap},
  {name:'03 API 消息结构', duration:1800, component:ApiStructure},
  {name:'04 Agent 工具循环', duration:1800, component:AgentLoop},
  {name:'05 Chat Template：消息到 Token', duration:1350, component:ChatTemplate},
  {name:'06 KV Cache 与稳定前缀', duration:1800, component:Cache},
  {name:'07 提示工程与 Few-shot', duration:1800, component:PromptEngineering},
  {name:'08 Skills、提示注入与安全', duration:1800, component:PromptAndSafety},
  {name:'09 Agent 状态栏', duration:1500, component:StateBar},
  {name:'10 上下文压缩：状态与噪声', duration:1800, component:StateAndCompress},
  {name:'11 六类压缩策略与生产分层', duration:2250, component:CompressionStrategies},
  {name:'12 子 Agent 上下文隔离', duration:1350, component:SubAgentIsolation},
  {name:'13 总结：设计上下文', duration:900, component:Conclusion},
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
