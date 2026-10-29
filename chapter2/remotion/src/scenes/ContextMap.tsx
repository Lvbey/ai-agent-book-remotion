import React from 'react';
import {AbsoluteFill,interpolate,useCurrentFrame,Easing} from 'remotion';
import {Background} from '../components/Background';
import {COLORS} from '../theme';
const clamp={extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const};
const a=(f:number,s:number,e:number)=>interpolate(f,[s,e],[0,1],{...clamp,easing:Easing.out(Easing.cubic)});
const items=[
 {name:'系统规则',detail:'遵守项目规范',c:COLORS.green},
 {name:'用户任务',detail:'修复支付回调',c:COLORS.blue},
 {name:'历史消息',detail:'已经尝试过什么',c:COLORS.gold},
 {name:'工具定义',detail:'能读文件、跑测试',c:COLORS.coral},
 {name:'工具结果',detail:'日志与测试反馈',c:'#7A8F6A'}
];
export const ContextMap:React.FC=()=>{
 const f=useCurrentFrame()*1.5;
 const selected=f<150?0:f<300?1:f<450?2:f<600?3:4;
 const showWindow=a(f,50,80), assemble=a(f,160,205), filter=a(f,330,370), final=a(f,650,685);
 return <AbsoluteFill>
  <Background chapter="02 / WHAT IS CONTEXT?"/>
  <div style={{position:'absolute',left:110,top:105,fontSize:53,fontWeight:850,opacity:a(f,0,18)}}>模型这一次到底看到了什么？</div>
  <div style={{position:'absolute',left:110,top:180,fontSize:25,color:COLORS.inkSoft,opacity:a(f,10,28)}}>上下文不是只有聊天记录，而是本轮请求实际携带的信息。</div>
  {items.map((it,i)=>{
   const y=275+i*112;
   const p=a(f,30+i*22,52+i*22);
   const move=interpolate(f,[150,205],[0,1],clamp);
   return <div key={it.name} style={{position:'absolute',left:110+(i*8),top:y,width:620,height:82,borderRadius:16,background:'#FFFEF9',border:'2px solid '+it.c,display:'flex',alignItems:'center',padding:'0 22px',boxSizing:'border-box',opacity:p*(1-filter*0.25),transform:'translateX('+(i<selected?move*12:0)+'px)'}}>
    <div style={{width:15,height:45,borderRadius:7,background:it.c,marginRight:20}}/>
    <div style={{flex:1}}><div style={{fontSize:27,fontWeight:800}}>{it.name}</div><div style={{fontSize:19,color:COLORS.inkSoft,marginTop:3}}>{it.detail}</div></div>
    <div style={{fontSize:22,color:it.c,fontWeight:800}}>{i===selected?'当前关注':'+'}</div>
   </div>
  })}
  <svg width="1920" height="1080" style={{position:'absolute',inset:0}}>
   <path d="M 790 330 C 890 330 850 470 1000 470" stroke={COLORS.green} strokeWidth="4" fill="none" strokeDasharray="9 9" strokeDashoffset={interpolate(f,[160,240],[160,0],clamp)} opacity={assemble}/>
   <path d="M 790 440 C 890 440 870 470 1000 470" stroke={COLORS.blue} strokeWidth="4" fill="none" strokeDasharray="9 9" strokeDashoffset={interpolate(f,[190,260],[160,0],clamp)} opacity={assemble}/>
   <path d="M 790 550 C 890 550 870 490 1000 490" stroke={COLORS.gold} strokeWidth="4" fill="none" strokeDasharray="9 9" strokeDashoffset={interpolate(f,[220,290],[160,0],clamp)} opacity={assemble}/>
   <path d="M 790 660 C 900 660 880 510 1000 510" stroke={COLORS.coral} strokeWidth="4" fill="none" strokeDasharray="9 9" strokeDashoffset={interpolate(f,[250,320],[160,0],clamp)} opacity={assemble}/>
   <path d="M 790 770 C 900 770 880 530 1000 530" stroke="#7A8F6A" strokeWidth="4" fill="none" strokeDasharray="9 9" strokeDashoffset={interpolate(f,[280,350],[160,0],clamp)} opacity={assemble}/>
   <rect x="1000" y="330" width="760" height="360" rx="28" fill="#E4EEE5" stroke={COLORS.green} strokeWidth="3" opacity={showWindow}/>
   <text x="1050" y="390" fontSize="27" fill={COLORS.green} fontWeight="800" opacity={showWindow}>模型本轮输入 / CONTEXT WINDOW</text>
   {items.map((it,i)=><g key={it.name} opacity={a(f,190+i*24,220+i*24)}><rect x={1050+(i%2)*330} y={430+Math.floor(i/2)*75} width="300" height="54" rx="10" fill="#FFFEF9" stroke={it.c} strokeWidth="2"/><text x={1070+(i%2)*330} y={464+Math.floor(i/2)*75} fontSize="22" fill={COLORS.ink}>{it.name}</text></g>)}
   <g opacity={filter}><rect x="1000" y="730" width="760" height="92" rx="18" fill="#F8E7D9" stroke={COLORS.coral} strokeWidth="2"/><text x="1030" y="768" fontSize="23" fill={COLORS.coral} fontWeight="800">筛选：与当前任务相关的信息优先</text><text x="1030" y="800" fontSize="19" fill={COLORS.ink}>不是越多越好，也不是把所有资料永久塞进窗口。</text></g>
   <g opacity={final}><text x="1000" y="900" fontSize="35" fill={COLORS.green} fontWeight="800">信息组织 → 决策依据</text></g>
  </svg>
 </AbsoluteFill>;
}