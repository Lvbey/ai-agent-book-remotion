import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Background} from '../components/Background';
import {TextReveal, Caption} from '../components/Typography';
import {COLORS} from '../theme';

export const StateAndCompress: React.FC = () => {
  const f=useCurrentFrame();
  const clutter=interpolate(f,[10,70],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const compress=interpolate(f,[95,145],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const items=Array.from({length:18},(_,i)=>({x:170+(i%6)*260,y:255+Math.floor(i/6)*115, t:['搜索结果','日志片段','重复片段','旧输出'][i%4]}));
  return <AbsoluteFill>
    <Background chapter="06 / KEEP SIGNAL, LOSE NOISE" />
    <div style={{position:'absolute',top:96,left:0,right:0,display:'flex',justifyContent:'center'}}><TextReveal text="上下文不是越长越好" size={57} align="center" start={5}/></div>
    <div style={{position:'absolute',left:140,top:235,width:1120,height:535}}>
      <div style={{fontSize:29,fontWeight:800,color:COLORS.inkSoft,marginBottom:20}}>原始历史：内容不断累积</div>
      {items.map((it,i)=><div key={i} style={{position:'absolute',left:it.x-140,top:50+(it.y-255),width:210,height:72,border:`1.5px solid ${i%4===3?'#D9C6A4':'#C7D3C8'}`,borderRadius:10,background:i%4===3?'#F1E4D1':'#E6EBE3',padding:12,boxSizing:'border-box',fontSize:20,fontWeight:600,opacity:clutter*(1-compress*0.7),transform:`translateY(${interpolate(f,[10,70],[20,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}px)`}}>{it.t}<div style={{height:5,marginTop:9,width:`${50+(i*13)%40}%`,background:'#B2BFB4',borderRadius:3}}/></div>)}
      <div style={{position:'absolute',left:0,top:435,fontSize:24,color:COLORS.danger,opacity:clutter}}>信息多 ≠ 信息好找</div>
    </div>
    <div style={{position:'absolute',left:1330,top:260,width:470,height:500,border:`2px solid ${COLORS.green}`,borderRadius:24,background:COLORS.white,padding:28,boxSizing:'border-box',opacity:compress,transform:`translateX(${(1-compress)*40}px)`}}>
      <div style={{fontSize:31,fontWeight:800,color:COLORS.green,marginBottom:28}}>任务状态栏</div>
      {['目标：修复支付回调','已确认：入口在 callbacks.py','已尝试：重试逻辑导致重复调用','下一步：补充幂等测试','证据：日志与文件路径'].map((t,i)=><div key={t} style={{padding:'12px 0',borderBottom:'1px solid #E0E5DC',fontSize:21,lineHeight:1.35,opacity:interpolate(f,[130+i*5,142+i*5],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}}>{t}</div>)}
      <div style={{marginTop:20,fontSize:20,color:COLORS.inkSoft}}>只保留当前任务需要的关键状态</div>
    </div>
    <Caption text="摘要应保留决策、约束、失败路径和来源；不相关内容可以删除，大体积探索也可交给子 Agent。" start={175} end={230}/>
  </AbsoluteFill>;
};
