import React from 'react';
import {AbsoluteFill,interpolate,Easing} from 'remotion';
import {Background} from '../components/Background';
import {useStoryFrame} from '../sceneTiming';
import {COLORS} from '../theme';
const clamp={extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const};
const a=(f:number,s:number,e:number)=>interpolate(f,[s,e],[0,1],{...clamp,easing:Easing.out(Easing.cubic)});
export const AgentLoop:React.FC=()=>{
 const f=useStoryFrame('AgentLoop');
 const step=f<105?0:f<225?1:f<345?2:f<465?3:f<585?4:5;
 const node=(x:number,y:number,w:number,h:number,title:string,sub:string,color:string,opacity:number,active:boolean)=> <g opacity={opacity} key={title}><rect x={x} y={y} width={w} height={h} rx="18" fill={active?'#DDECE2':'#FFFEF9'} stroke={color} strokeWidth={active?4:2}/><text x={x+22} y={y+38} fontSize="25" fill={COLORS.ink} fontWeight="800">{title}</text><text x={x+22} y={y+72} fontSize="18" fill={COLORS.inkSoft}>{sub}</text></g>;
 const packetX=interpolate(f,[95,135,225,265,345,385,465,505],[180,500,500,900,900,1300,1300,500],clamp);
 const packetY=interpolate(f,[95,135,225,265,345,385,465,505],[370,370,370,370,370,370,370,600],clamp);
 return <AbsoluteFill>
  <Background chapter="03 / THE AGENT LOOP"/>
  <div style={{position:'absolute',left:100,top:100,fontSize:52,fontWeight:850,opacity:a(f,0,18)}}>模型提出请求，框架执行工具</div>
  <svg width="1920" height="1080" style={{position:'absolute',inset:0}}>
   <path d="M 390 390 L 530 390 M 790 390 L 930 390 M 1200 390 L 1340 390" stroke={COLORS.inkSoft} strokeWidth="4" fill="none" strokeDasharray="8 8" strokeDashoffset={interpolate(f,[20,70],[140,0],clamp)}/>
   <path d="M 1500 470 C 1500 650 650 680 650 490" stroke={COLORS.green} strokeWidth="4" fill="none" strokeDasharray="10 10" strokeDashoffset={interpolate(f,[500,580],[300,0],clamp)} opacity={a(f,480,520)}/>
   {node(120,320,270,150,'用户任务','修复支付回调',COLORS.blue,a(f,10,28),step===0)}
   {node(530,320,260,150,'模型决策','读取代码还是跑测试？',COLORS.green,a(f,35,53),step===1)}
   {node(930,320,270,150,'工具执行','read_file / run_tests',COLORS.coral,a(f,75,93),step===2)}
   {node(1340,320,300,150,'工具结果','实际日志与测试反馈',COLORS.gold,a(f,110,128),step===3)}
   <g opacity={a(f,130,150)}><rect x="510" y="590" width="850" height="190" rx="22" fill="#FFFEF9" stroke={COLORS.green} strokeWidth="2"/><text x="550" y="635" fontSize="24" fill={COLORS.green} fontWeight="800">下一轮上下文更新</text><text x="550" y="680" fontSize="21" fill={COLORS.ink}>观察：测试报错 “duplicate charge”</text><text x="550" y="720" fontSize="21" fill={COLORS.ink}>新决定：先读取幂等实现，再修改代码</text></g>
   <g opacity={a(f,155,175)}><rect x="1390" y="590" width="380" height="150" rx="20" fill="#E2EEE5" stroke={COLORS.green} strokeWidth="2"/><text x="1420" y="632" fontSize="23" fill={COLORS.green} fontWeight="800">新请求</text><text x="1420" y="674" fontSize="20" fill={COLORS.ink}>带着测试结果继续推理</text><text x="1420" y="710" fontSize="20" fill={COLORS.ink}>循环，直到满足完成条件</text></g>
   <g opacity={a(f,190,210)}><rect x="120" y="820" width="1640" height="86" rx="18" fill="#E8EDE5"/><text x="155" y="855" fontSize="22" fill={COLORS.inkSoft}>关键区别</text><text x="155" y="886" fontSize="25" fill={COLORS.ink} fontWeight="800">模型只发出工具调用请求；Agent 框架负责执行，并把真实结果追加到上下文。</text></g>
   <circle cx={packetX} cy={packetY} r="13" fill={step===2?COLORS.coral:COLORS.gold} stroke="#FFFEF9" strokeWidth="4" opacity={a(f,85,100)}/>
  </svg>
 </AbsoluteFill>;
}