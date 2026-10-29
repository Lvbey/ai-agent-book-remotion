import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Background} from '../components/Background';
import {TextReveal, Caption} from '../components/Typography';
import {COLORS} from '../theme';

export const AgentLoop: React.FC = () => {
  const f=useCurrentFrame();
  const stages=[
    {x:140,y:310,w:280,h:140,title:'用户任务',desc:'修复支付回调 Bug',c:COLORS.blue},
    {x:540,y:310,w:300,h:140,title:'模型决策',desc:'读取文件？运行测试？',c:COLORS.green},
    {x:960,y:310,w:310,h:140,title:'工具执行',desc:'读取代码 / 运行测试',c:COLORS.coral},
    {x:1380,y:310,w:320,h:140,title:'结果返回',desc:'错误日志 / 测试结果',c:COLORS.gold},
  ];
  const end=Math.min(1,Math.max(0,(f-20)/90));
  return <AbsoluteFill>
    <Background chapter="03 / THE AGENT LOOP" />
    <div style={{position:'absolute',top:105,left:0,right:0,display:'flex',justifyContent:'center'}}><TextReveal text="Agent 不是问一次就结束" size={56} align="center" start={4}/></div>
    <svg width="1920" height="1080" style={{position:'absolute',inset:0}} viewBox="0 0 1920 1080">
      {stages.slice(0,-1).map((s,i)=>{const x1=s.x+s.w; const x2=stages[i+1].x; const op=interpolate(f,[20+i*20,36+i*20],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});return <g key={s.title} opacity={op}><path d={`M${x1} 380 L${x2-15} 380`} stroke={COLORS.inkSoft} strokeWidth="4" fill="none"/><path d={`M${x2-28} 370 L${x2-15} 380 L${x2-28} 390`} stroke={COLORS.inkSoft} strokeWidth="4" fill="none"/></g>})}
      <path d="M1540 465 C1540 660 650 660 650 470" fill="none" stroke={COLORS.green} strokeWidth="4" strokeDasharray="10 10" opacity={interpolate(f,[95,115],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}/>
      <path d="M 660 485 L 650 470 L 640 485" fill="none" stroke={COLORS.green} strokeWidth="4" opacity={interpolate(f,[95,115],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}/>
      <circle cx={140+end*1540} cy="380" r="10" fill={COLORS.coral} />
    </svg>
    {stages.map((s,i)=><div key={s.title} style={{position:'absolute',left:s.x,top:s.y,width:s.w,height:s.h,borderRadius:22,background:COLORS.white,border:`2px solid ${s.c}`,padding:22,boxSizing:'border-box',opacity:interpolate(f,[18+i*16,34+i*16],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}),transform:`translateY(${interpolate(f,[18+i*16,34+i*16],[18,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}px)`}}><div style={{fontSize:29,fontWeight:800,marginBottom:12}}>{s.title}</div><div style={{fontSize:21,color:COLORS.inkSoft}}>{s.desc}</div></div>)}
    <div style={{position:'absolute',left:270,top:720,width:1380,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      {['上下文历史','工具调用请求','工具结果','新的上下文'].map((x,i)=><div key={x} style={{padding:'14px 22px',borderRadius:14,background:i===1?'#F9E4DD':'#E5EEE6',fontSize:23,fontWeight:700,opacity:interpolate(f,[105+i*9,120+i*9],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}}>{x}</div>)}
    </div>
    <Caption text="模型负责提出下一步行动；Agent 框架负责执行工具，并把结果送回来。" start={145} end={198}/>
  </AbsoluteFill>;
};
