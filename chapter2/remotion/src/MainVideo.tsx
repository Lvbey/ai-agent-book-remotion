import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {Intro} from './scenes/Intro';
import {ContextMap} from './scenes/ContextMap';
import {AgentLoop} from './scenes/AgentLoop';
import {PromptAndSafety} from './scenes/PromptAndSafety';
import {Cache} from './scenes/Cache';
import {StateAndCompress} from './scenes/StateAndCompress';
import {Conclusion} from './scenes/Conclusion';
import {COLORS} from './theme';

const scenes = [
  {name:'开场：信息缺失', from:0, duration:900, component:Intro},
  {name:'上下文是什么', from:900, duration:1500, component:ContextMap},
  {name:'Agent 工具循环', from:2400, duration:1800, component:AgentLoop},
  {name:'规则、Skills 与安全', from:4200, duration:1800, component:PromptAndSafety},
  {name:'KV Cache 与稳定前缀', from:6000, duration:1500, component:Cache},
  {name:'状态与压缩', from:7500, duration:1800, component:StateAndCompress},
  {name:'结尾：设计上下文', from:9300, duration:1500, component:Conclusion},
] as const;

export const MainVideo: React.FC = () => {
  return <AbsoluteFill style={{backgroundColor:COLORS.paper}}>
    {scenes.map((scene) => {
      const Component = scene.component;
      return <Sequence key={scene.name} from={scene.from} durationInFrames={scene.duration} name={scene.name}>
        <Component />
      </Sequence>;
    })}
  </AbsoluteFill>;
};

export {scenes};
