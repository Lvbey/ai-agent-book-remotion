import React from 'react';
import {AbsoluteFill,interpolate,spring,useCurrentFrame,useVideoConfig} from 'remotion';
import timeline from '../voice-timeline.json';

/** Decorative motion is driven by the same spoken semantic anchors as the diagram. */
export const VisualStage:React.FC<{sceneKey:keyof typeof timeline;children:React.ReactNode}>=({sceneKey,children})=>{
 const frame=useCurrentFrame();const {fps}=useVideoConfig();const data=timeline[sceneKey];
 const ms=frame/fps*1000;
 const current=data.anchors.reduce((last,c,i)=>ms>=c.ms?i:last,-1);
 const elapsed=current<0?0:frame-data.anchors[current].ms*fps/1000;
 const pulse=current<0?0:interpolate(elapsed,[0,9,30],[0,1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 const enter=spring({frame,fps,config:{damping:24,stiffness:85}});
 const number=String(data.number).padStart(2,'0');
 return <AbsoluteFill style={{overflow:'hidden',background:'#f6f3ea'}}>
  <div style={{position:'absolute',left:58,top:35,bottom:178,width:5,background:'#d4dfd3'}}/>
  <div style={{position:'absolute',left:58,top:35,width:5,height:(frame/data.duration)*850,background:'#276a57'}}/>
  <div style={{position:'absolute',right:30,top:55,fontFamily:'Georgia,serif',fontSize:120,lineHeight:1,color:'#276a57',opacity:0.11}}>{number}</div>
  <AbsoluteFill style={{transform:`translateY(${(1-enter)*22}px) scale(${0.844+enter*0.016})`,transformOrigin:'50% 0%',filter:'drop-shadow(0 18px 22px rgba(24,48,45,0.12))'}}>{children}</AbsoluteFill>
  <svg width="1920" height="1080" style={{position:'absolute',inset:0,pointerEvents:'none'}}>
   <path d="M 112 42 H 1808 V 875 H 112 Z" fill="none" stroke="#276a57" strokeWidth="1" opacity=".15"/>
   <path d="M 112 95 V 42 H 165 M 1755 42 H 1808 V 95 M 112 822 V 875 H 165 M 1755 875 H 1808 V 822" fill="none" stroke="#276a57" strokeWidth="3"/>
   <path d="M 112 42 H 1808 V 875 H 112 Z" fill="none" stroke="#e7b44e" strokeWidth="3" strokeDasharray="95 4963" strokeDashoffset={-frame*7} opacity={0.3+pulse*0.6}/>
   {data.anchors.map((a,i)=>{const y=170+i* Math.min(48,570/data.anchors.length);return <g key={a.phrase}><circle cx="61" cy={y} r={i===current?7:3} fill={i===current?'#e7b44e':i<current?'#276a57':'#becbbd'}/>{i===current&&<circle cx="61" cy={y} r={8+pulse*15} fill="none" stroke="#e7b44e" opacity={pulse}/>}</g>})}
   <path d="M 1790 120 V 790" stroke="#276a57" opacity=".13" strokeDasharray="2 12"/>
  </svg>
  <div style={{position:'absolute',left:110,top:890,display:'flex',gap:8,alignItems:'center',fontFamily:'Microsoft YaHei,sans-serif',fontSize:13,letterSpacing:3,color:'#537465'}}><span style={{width:24,height:2,background:'#e7b44e'}}/>上下文工程 <span style={{opacity:.45}}> / </span> {number} — 13</div>
 </AbsoluteFill>;
};
