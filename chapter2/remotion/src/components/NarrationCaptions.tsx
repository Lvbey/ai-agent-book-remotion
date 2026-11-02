import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import timeline from '../voice-timeline.json';

export const NarrationCaptions: React.FC<{sceneKey:keyof typeof timeline}> = ({sceneKey}) => {
 const frame=useCurrentFrame(); const {fps}=useVideoConfig(); const ms=frame/fps*1000;
 const data=timeline[sceneKey];
 const cue=data.captions.find(c=>ms>=c.startMs && ms<c.endMs);
 const current=data.anchors.reduce((last,a,i)=>ms>=a.ms?i:last,-1);
 return <>
  <div style={{position:'absolute',left:110,right:110,bottom:34,height:125,borderRadius:18,background:'#173d34',color:'#fffef9',display:'flex',alignItems:'center',justifyContent:'center',padding:'12px 36px',fontFamily:'Microsoft YaHei, sans-serif',fontSize:40,lineHeight:1.5,textAlign:'center',boxSizing:'border-box'}}>{cue?.text??''}</div>
  <div style={{position:'absolute',left:110,right:110,bottom:17,display:'flex',gap:8}}>{data.anchors.map((a,i)=><div key={a.phrase} style={{height:4,flex:1,borderRadius:3,background:i===current?'#e7b44e':i<current?'#276a57':'#ccd5ca'}}/>)}</div>
 </>;
};
