import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, Easing} from 'remotion';
import {Background} from '../components/Background';
import {COLORS} from '../theme';

const clamp={extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const};
const appear=(f:number,a:number,b:number)=>interpolate(f,[a,b],[0,1],{...clamp,easing:Easing.out(Easing.cubic)});
export const Intro:React.FC=()=>{
 const f=useCurrentFrame();
 const cursor=interpolate(f,[25,95],[0,1],clamp);
 const bad=appear(f,105,118);
 const error=appear(f,155,168);
 const missing=appear(f,300,322);
 const fix=appear(f,460,485);
 const title=appear(f,675,700);
 const codeY=interpolate(f,[90,130,175],[0,16,0],clamp);
 return <AbsoluteFill>
  <Background chapter="01 / THE MISSING CONTEXT"/>
  <div style={{position:'absolute',left:110,top:150,fontSize:22,color:COLORS.green,fontWeight:800,letterSpacing:3,opacity:appear(f,0,15)}}>INCIDENT 001 · PAYMENT SERVICE</div>
  <div style={{position:'absolute',left:110,top:215,fontSize:65,fontWeight:850,lineHeight:1.15,width:710,opacity:appear(f,10,28)}}>修复这个 Bug。</div>
  <div style={{position:'absolute',left:110,top:300,fontSize:34,width:680,lineHeight:1.4,opacity:appear(f,30,48)}}>“你已经知道项目怎么运作了吧？”</div>
  <div style={{position:'absolute',left:105,top:420,width:690,height:250,background:'#FFFEF9',border:'2px solid #D8DED4',borderRadius:22,padding:25,boxSizing:'border-box',opacity:appear(f,52,68),transform:'translateY('+codeY+'px)'}}>
   <div style={{display:'flex',gap:9,marginBottom:20}}>{['#D9674E','#E7B44E','#5AA88B'].map((c,i)=><div key={i} style={{width:11,height:11,borderRadius:99,background:c}}/>)}</div>
   <div style={{fontFamily:'monospace',fontSize:23,lineHeight:1.65,color:COLORS.ink}}>
    <div>function handlePayment(event) {'{'}</div>
    <div style={{paddingLeft:25,color:COLORS.blue}}>return charge(event.user);</div>
    <div>{'}'}</div>
    <div style={{color:COLORS.coral,opacity:bad}}>// 没有检查幂等键，也没看项目规范</div>
   </div>
   <div style={{position:'absolute',right:22,top:25,fontSize:18,color:COLORS.coral,fontWeight:800,opacity:bad}}>PATCH APPLIED</div>
  </div>
  <div style={{position:'absolute',left:840,top:200,width:920,height:540}}>
   <svg width="920" height="540" viewBox="0 0 920 540">
    <rect x="60" y="20" width="800" height="480" rx="24" fill="#FFFEF9" stroke="#D8DED4" strokeWidth="2"/>
    <text x="100" y="65" fontSize="24" fill={COLORS.ink} fontWeight="700">项目文件树</text>
    {['src/payment.ts','src/idempotency.ts','tests/payment.test.ts','AGENTS.md'].map((s,i)=>{
      const y=105+i*77; const op=appear(f,70+i*30,88+i*30);
      return <g key={s} opacity={op}><rect x="90" y={y} width="480" height="54" rx="10" fill={i===3?'#E0EDE3':'#F1F2EC'} stroke={i===3?COLORS.green:'#D8DED4'} strokeWidth="2"/><text x="115" y={y+34} fontSize="22" fill={COLORS.ink}>{s}</text>{i===3&&<text x="600" y={y+34} fontSize="20" fill={COLORS.coral} opacity={bad}>未读取</text>}</g>
    })}
    <g opacity={error}><rect x="595" y="170" width="220" height="155" rx="15" fill="#F8E3DC" stroke={COLORS.coral} strokeWidth="2"/><text x="615" y="210" fontSize="22" fill={COLORS.coral} fontWeight="700">测试失败</text><text x="615" y="250" fontSize="18" fill={COLORS.ink}>重复扣款</text><text x="615" y="282" fontSize="18" fill={COLORS.ink}>规范未检查</text></g>
    <path d="M570 280 C610 280 580 220 595 220" stroke={COLORS.coral} strokeWidth="4" fill="none" strokeDasharray="7 7" opacity={error}/>
    <g opacity={missing}><rect x="90" y="415" width="725" height="62" rx="12" fill="#E0EDE3"/><text x="115" y="453" fontSize="22" fill={COLORS.green} fontWeight="700">缺失信息：项目约定 / 调用链 / 测试状态</text></g>
   </svg>
  </div>
  <div style={{position:'absolute',left:110,top:760,fontSize:29,fontWeight:750,color:COLORS.coral,opacity:error}}>模型完成了修改，但任务失败了。</div>
  <div style={{position:'absolute',left:110,top:825,fontSize:34,fontWeight:750,color:COLORS.green,opacity:fix}}>问题不一定是模型不够聪明，而是它没看到关键背景。</div>
  <div style={{position:'absolute',left:110,top:900,fontSize:72,fontWeight:900,color:COLORS.ink,opacity:title}}>上下文工程</div>
  <div style={{position:'absolute',left:112,top:990,fontSize:26,color:COLORS.inkSoft,opacity:title}}>让正确的信息，在决策时刻出现。</div>
 </AbsoluteFill>;
};