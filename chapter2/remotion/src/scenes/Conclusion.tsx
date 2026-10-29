import React from 'react';
import {AbsoluteFill,interpolate,useCurrentFrame,Easing} from 'remotion';
import {Background} from '../components/Background';
import {COLORS} from '../theme';
const clamp={extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const};
const a=(f:number,s:number,e:number)=>interpolate(f,[s,e],[0,1],{...clamp,easing:Easing.out(Easing.cubic)});
export const Conclusion:React.FC=()=>{
 const f=useCurrentFrame();
 const cards=[
  {n:'01',t:'组织',d:'规则清楚，结构稳定',c:COLORS.green},
  {n:'02',t:'供给',d:'技能按需，状态显式',c:COLORS.blue},
  {n:'03',t:'精简',d:'减少噪声，保留证据',c:COLORS.gold},
  {n:'04',t:'隔离',d:'别让探索噪声淹没主任务',c:COLORS.coral}
 ];
 const progress=interpolate(f,[20,500],[0,1],clamp);
 return <AbsoluteFill>
  <Background chapter="07 / DESIGN THE CONTEXT" dark/>
  <div style={{position:'absolute',left:105,top:105,fontSize:55,fontWeight:850,color:COLORS.paper,opacity:a(f,0,18)}}>同一个模型，不同的上下文</div>
  <svg width="1920" height="1080" style={{position:'absolute',inset:0}}>
   <rect x="110" y="225" width="690" height="290" rx="24" fill="#24423A" stroke="#6E8C7D" strokeWidth="2" opacity={a(f,10,30)}/>
   <text x="150" y="275" fontSize="27" fill="#C6D9CE" fontWeight="800" opacity={a(f,15,30)}>上下文不足</text>
   <rect x="150" y="310" width="210" height="50" rx="10" fill="#F8E3DC" opacity={a(f,30,45)}/><text x="170" y="342" fontSize="20" fill={COLORS.coral} opacity={a(f,30,45)}>没有项目规范</text>
   <rect x="150" y="375" width="210" height="50" rx="10" fill="#F8E3DC" opacity={a(f,45,60)}/><text x="170" y="407" fontSize="20" fill={COLORS.coral} opacity={a(f,45,60)}>缺少测试结果</text>
   <rect x="400" y="310" width="350" height="115" rx="14" fill="#F8E3DC" opacity={a(f,65,80)}/><text x="430" y="355" fontSize="24" fill={COLORS.coral} fontWeight="800" opacity={a(f,65,80)}>错误修改</text><text x="430" y="393" fontSize="20" fill={COLORS.ink} opacity={a(f,65,80)}>重复扣款仍然存在</text>
   <rect x="1120" y="225" width="690" height="290" rx="24" fill="#24423A" stroke="#6E8C7D" strokeWidth="2" opacity={a(f,100,120)}/>
   <text x="1160" y="275" fontSize="27" fill="#C6D9CE" fontWeight="800" opacity={a(f,105,120)}>上下文经过工程化组织</text>
   {['项目规则','相关代码','测试证据'].map((s,i)=><g key={s} opacity={a(f,125+i*20,142+i*20)}><rect x="1160" y={305+i*54} width="210" height="42" rx="9" fill="#DDECE2"/><text x="1180" y={333+i*54} fontSize="20" fill={COLORS.green} fontWeight="700">{s}</text></g>)}
   <rect x="1400" y="315" width="360" height="115" rx="14" fill="#DDECE2" opacity={a(f,195,220)}/><text x="1430" y="358" fontSize="24" fill={COLORS.green} fontWeight="800" opacity={a(f,195,220)}>有依据地修复</text><text x="1430" y="397" fontSize="20" fill={COLORS.ink} opacity={a(f,195,220)}>修改后重新运行测试</text>
   <path d="M 820 370 L 1080 370" stroke="#A9D7C0" strokeWidth="5" strokeDasharray="12 10" strokeDashoffset={interpolate(f,[90,125],[260,0],clamp)} opacity={a(f,90,110)}/>
   <path d="M 1060 355 L 1080 370 L 1060 385" stroke="#A9D7C0" strokeWidth="5" fill="none" opacity={a(f,90,110)}/>
   {cards.map((c,i)=><g key={c.n} opacity={a(f,250+i*28,275+i*28)}><rect x={110+i*435} y="600" width="395" height="130" rx="18" fill="#24423A" stroke={c.c} strokeWidth="2"/><text x={140+i*435} y="642" fontSize="20" fill={c.c} fontWeight="800">{c.n}</text><text x={140+i*435} y="682" fontSize="29" fill={COLORS.paper} fontWeight="800">{c.t}</text><text x={140+i*435} y="712" fontSize="18" fill="#C5D8CC">{c.d}</text></g>)}
   <text x="110" y="820" fontSize="39" fill="#A9D7C0" fontWeight="800" opacity={a(f,390,420)}>模型的能力很重要，信息如何交付同样重要。</text>
   <text x="110" y="900" fontSize="48" fill={COLORS.paper} fontWeight="900" opacity={a(f,440,475)}>让有用的信息，出现在正确的时刻。</text>
   <rect x="110" y="950" width="1690" height="5" rx="3" fill="#34574B"/><rect x="110" y="950" width={1690*progress} height="5" rx="3" fill="#A9D7C0"/>
  </svg>
 </AbsoluteFill>;
};