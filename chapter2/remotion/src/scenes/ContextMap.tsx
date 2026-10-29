import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, Easing} from 'remotion';
import {Background} from '../components/Background';
import {TextReveal, Caption} from '../components/Typography';
import {Panel} from '../components/Panel';
import {COLORS} from '../theme';

const blocks = [
  {title:'系统规则',sub:'如何工作',color:COLORS.green,x:170,y:300},
  {title:'用户任务',sub:'要完成什么',color:COLORS.blue,x:500,y:300},
  {title:'对话历史',sub:'之前发生了什么',color:COLORS.gold,x:830,y:300},
  {title:'工具说明',sub:'可以做什么',color:COLORS.coral,x:1160,y:300},
  {title:'工具结果',sub:'实际观察到什么',color:'#7A8F6A',x:1490,y:300},
];
export const ContextMap: React.FC = () => {
  const f=useCurrentFrame();
  const pulse=interpolate(f%90,[0,45,90],[0.88,1,0.88]);
  return <AbsoluteFill>
    <Background chapter="02 / WHAT IS CONTEXT?" />
    <div style={{position:'absolute',left:0,right:0,top:108,display:'flex',justifyContent:'center'}}><TextReveal text="上下文，就是模型此刻能看到的全部信息" size={53} align="center" start={5}/></div>
    <div style={{position:'absolute',left:160,top:245,width:1600,height:310}}>
      <svg width="1600" height="310" viewBox="0 0 1600 310" style={{position:'absolute'}}>
        {blocks.slice(0,-1).map((b,i)=><g key={b.title} opacity={interpolate(f,[15+i*10,28+i*10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}><path d={`M ${b.x-160+245} 105 C ${b.x-160+280} 80, ${b.x-160+300} 80, ${b.x-160+330} 105`} stroke={COLORS.green} strokeWidth="3" fill="none" strokeDasharray="7 8"/><path d={`M ${b.x-160+312} 96 l 18 9 -18 9`} stroke={COLORS.green} strokeWidth="3" fill="none"/></g>)}
      </svg>
      {blocks.map((b,i)=><div key={b.title} style={{position:'absolute',left:b.x-160,top:25,width:245,height:160,background:COLORS.white,borderRadius:22,border:`2px solid ${b.color}`,boxShadow:`0 12px 35px ${b.color}22`,transform:`scale(${i===2?pulse:1})`,opacity:interpolate(f,[12+i*10,26+i*10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}}><div style={{height:9,background:b.color,borderRadius:'20px 20px 0 0'}}/><div style={{padding:'24px 16px 8px',fontSize:27,fontWeight:800,textAlign:'center'}}>{b.title}</div><div style={{fontSize:20,color:COLORS.inkSoft,textAlign:'center'}}>{b.sub}</div></div>)}
      <div style={{position:'absolute',top:225,left:0,right:0,textAlign:'center',fontSize:25,color:COLORS.inkSoft}}>每次请求：把相关信息组织起来，再交给模型</div>
    </div>
    <Panel x={210} y={650} w={680} h={178} title="模型本身" accent={COLORS.blue} start={72}>
      <div style={{fontSize:27,lineHeight:1.45}}>通用能力：理解、推理、生成</div>
    </Panel>
    <Panel x={1030} y={650} w={680} h={178} title="上下文工程" accent={COLORS.green} start={82}>
      <div style={{fontSize:27,lineHeight:1.45}}>选择什么信息、怎样组织、何时更新</div>
    </Panel>
    <svg style={{position:'absolute',left:0,top:0}} width="1920" height="1080"><path d="M 890 738 C 950 738 970 738 1030 738" fill="none" stroke={COLORS.green} strokeWidth="4" strokeDasharray="8 8"/></svg>
    <Caption text="不是把所有资料塞进去，而是让模型在决策时拿到有用的信息。" start={190} end={244}/>
  </AbsoluteFill>;
};
