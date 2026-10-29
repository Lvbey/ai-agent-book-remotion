import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, Easing} from 'remotion';
import {Background} from '../components/Background';
import {TextReveal, Caption} from '../components/Typography';
import {COLORS} from '../theme';

export const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const left = interpolate(f, [10, 42], [-260, 0], {extrapolateLeft:'clamp', extrapolateRight:'clamp', easing:Easing.out(Easing.cubic)});
  const redOpacity = interpolate(f,[60,72,110,125],[0,1,1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const lightOpacity = interpolate(f,[122,145,180],[0,1,0.15],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  return <AbsoluteFill>
    <Background chapter="01 / THE MISSING CONTEXT" />
    <div style={{position:'absolute',left:90,top:210,width:670}}>
      <TextReveal text="修复这个 Bug。" start={5} size={68} width={650}/>
      <TextReveal text="你已经知道项目怎么运作了吧？" start={35} size={34} weight={500} width={660}/>
      <div style={{marginTop:42, opacity: interpolate(f,[48,65],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}), color:COLORS.danger, fontSize:28,fontWeight:700}}>Agent：当然。正在修改核心模块……</div>
      <div style={{marginTop:26, opacity:redOpacity, color:COLORS.danger,fontSize:24}}>× 忽略团队约定　× 改错调用链　× 测试失败</div>
    </div>
    <div style={{position:'absolute',right:115,top:210,width:700,height:580,transform:`translateX(${left}px)`}}>
      <svg width="700" height="580" viewBox="0 0 700 580">
        <rect x="70" y="50" width="550" height="440" rx="28" fill="#FFFDF7" stroke="#D4DCD1" strokeWidth="3" />
        <rect x="105" y="92" width="480" height="48" rx="12" fill="#F1EDE3" />
        <text x="128" y="123" fontSize="23" fill="#49615A">project / payment-service</text>
        {['src/','tests/','README.md','AGENTS.md'].map((s,i)=><g key={s} opacity={lightOpacity}><rect x="110" y={175+i*62} width="250" height="42" rx="8" fill={i===3?'#D8E9DF':'#F1F3EE'}/><text x="130" y={203+i*62} fontSize="23" fill={COLORS.ink}>{s}</text></g>)}
        <rect x="390" y="178" width="190" height="192" rx="16" fill="#F9E6DF" stroke="#D9674E" strokeWidth="2" opacity={redOpacity}/>
        <text x="412" y="220" fontSize="23" fill="#B74F42" opacity={redOpacity}>未读取规范</text>
        <text x="412" y="260" fontSize="20" fill="#B74F42" opacity={redOpacity}>架构未知</text>
        <text x="412" y="295" fontSize="20" fill="#B74F42" opacity={redOpacity}>测试未知</text>
        <text x="412" y="330" fontSize="20" fill="#B74F42" opacity={redOpacity}>状态未知</text>
        <path d="M 370 260 L 390 260" stroke="#D9674E" strokeWidth="5" strokeDasharray="5 7" opacity={redOpacity}/>
        <circle cx="350" cy="520" r="28" fill={COLORS.green} />
        <text x="350" y="529" fontSize="23" textAnchor="middle" fill="white">AI</text>
      </svg>
    </div>
    <Caption text="模型很聪明，却不知道这个项目真正的规则。" start={126} end={178}/>
  </AbsoluteFill>;
};
