import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Background} from '../components/Background';
import {TextReveal, Caption} from '../components/Typography';
import {COLORS} from '../theme';

export const Cache: React.FC = () => {
  const f=useCurrentFrame();
  const old=interpolate(f,[30,70],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const good=interpolate(f,[115,145],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  return <AbsoluteFill>
    <Background chapter="05 / CACHE LOVES STABILITY" />
    <div style={{position:'absolute',top:95,left:0,right:0,display:'flex',justifyContent:'center'}}><TextReveal text="有些信息，最好不要每次重写" size={55} align="center" start={5}/></div>
    <div style={{position:'absolute',left:170,top:250,width:700,height:430}}>
      <div style={{fontSize:31,fontWeight:800,color:COLORS.danger,marginBottom:26}}>错误：把当前时间写进最前面</div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{['系统规则','当前时间 09:01','工具说明','历史消息'].map((t,i)=><div key={t} style={{padding:'20px 16px',background:i===1?'#F8E0D9':'#DFE9E0',borderRadius:12,border:`2px solid ${i===1?COLORS.coral:COLORS.green}`,fontSize:21,fontWeight:700,opacity:interpolate(f,[18+i*12,30+i*12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}}>{t}</div>)}</div>
      <div style={{marginTop:34,background:'#F8E0D9',padding:20,borderRadius:16,opacity:old}}>
        <div style={{fontSize:23,fontWeight:800,color:COLORS.danger}}>下一次请求：09:02</div>
        <div style={{height:22,display:'flex',gap:4,marginTop:15}}>{Array.from({length:16},(_,i)=><div key={i} style={{height:22,flex:1,background:i<2?'#D9674E':'#D2AAA0',borderRadius:4}}/>)}</div>
        <div style={{fontSize:21,marginTop:12}}>动态内容靠前 → 后面大段缓存难以复用</div>
      </div>
    </div>
    <div style={{position:'absolute',left:1030,top:250,width:720,height:430}}>
      <div style={{fontSize:31,fontWeight:800,color:COLORS.green,marginBottom:26}}>更好：稳定前缀，动态内容后置</div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{['系统规则','工具说明','历史消息','追加当前时间'].map((t,i)=><div key={t} style={{padding:'20px 16px',background:i===3?'#F6E8C8':'#DFE9E0',borderRadius:12,border:`2px solid ${i===3?COLORS.gold:COLORS.green}`,fontSize:21,fontWeight:700,opacity:interpolate(f,[35+i*12,47+i*12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}}>{t}</div>)}</div>
      <div style={{marginTop:34,background:'#DFEDE3',padding:20,borderRadius:16,opacity:good}}>
        <div style={{fontSize:23,fontWeight:800,color:COLORS.green}}>下一次请求：09:02</div>
        <div style={{height:22,display:'flex',gap:4,marginTop:15}}>{Array.from({length:16},(_,i)=><div key={i} style={{height:22,flex:1,background:i<13?'#5AA88B':'#E7B44E',borderRadius:4}}/>)}</div>
        <div style={{fontSize:21,marginTop:12}}>相同的前缀 → 有机会复用已有计算</div>
      </div>
    </div>
    <div style={{position:'absolute',left:870,top:390,fontSize:65,color:COLORS.inkSoft,fontWeight:300}}>→</div>
    <Caption text="KV Cache 是单次推理中的缓存；跨请求复用相同前缀通常称为 Prompt Cache。" start={170} end={220}/>
  </AbsoluteFill>;
};
