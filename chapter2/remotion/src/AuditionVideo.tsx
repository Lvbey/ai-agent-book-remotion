import React from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import captions from './audition-captions.json';
import cues from './audition-cues.json';

export const AuditionVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ms = frame / fps * 1000;
  const current = captions.find(c => ms >= c.startMs && ms < c.endMs);
  const progress = Math.min(1, ms / 34414.875);
  const stages = ['缺少背景，聪明也会犯错', '上下文：本次决策收到的信息', '模型的能力，需要任务地图', '让有用的信息出现在正确时刻'];
  const stage = ms < cues['上下文'] ? 0 : ms < cues['模型提供通用能力'] ? 1 : ms < cues['资料多'] ? 2 : 3;
  const triggers = [cues['规则'], cues['任务'], cues['历史'], cues['工具结果']];
  const active = ms < triggers[0] || ms >= cues['模型提供通用能力'] ? -1 : triggers.reduce((last, t, i) => ms >= t ? i : last, -1);
  const labels = ['项目规则', '当前任务', '历史行动', '工具结果'];
  return <AbsoluteFill style={{backgroundColor:'#f6f3ea',color:'#193d33',fontFamily:'Microsoft YaHei, sans-serif',padding:100}}>
    <Audio src={staticFile('audio/audition.wav')}/>
    <div style={{fontSize:26,letterSpacing:6,color:'#627a6e'}}>上下文工程 · 配音试听</div>
    <h1 style={{fontSize:66,margin:'32px 0 20px'}}>聪明的模型，也需要上下文</h1>
    <div style={{fontSize:34,color:'#537465'}}>{stages[stage]}</div>
    <div style={{display:'flex',gap:30,marginTop:90}}>{labels.map((label,i)=>{
      const reveal = interpolate(ms,[cues['上下文']+i*120,cues['上下文']+i*120+300],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
      return <div key={label} style={{flex:1,opacity:reveal,transform:`translateY(${(1-reveal)*25}px)`,background:i===active?'#276a57':'#e1e8df',color:i===active?'white':'#276a57',border:ms>=triggers[i]?'3px solid #276a57':'3px solid transparent',borderRadius:20,padding:'42px 20px',textAlign:'center',fontSize:36}}>{label}</div>;
    })}</div>
    <div style={{position:'absolute',left:130,right:130,bottom:165,minHeight:130,display:'flex',alignItems:'center',justifyContent:'center',fontSize:48,lineHeight:1.6,textAlign:'center',fontWeight:600}}>{current?.text ?? ''}</div>
    <div style={{position:'absolute',bottom:85,left:100,right:100,height:6,background:'#dce3d9',borderRadius:10}}><div style={{width:`${progress*100}%`,height:'100%',background:'#276a57'}}/></div>
    <div style={{position:'absolute',bottom:40,right:100,fontSize:20,color:'#6c8074'}}>豆包语音 2.0 · 知性女声 · 真实时间戳字幕</div>
  </AbsoluteFill>;
};
