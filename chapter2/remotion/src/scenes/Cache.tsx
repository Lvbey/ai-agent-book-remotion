import React from 'react';
import {AbsoluteFill,interpolate,useCurrentFrame,Easing} from 'remotion';
import {Background} from '../components/Background';
import {COLORS} from '../theme';
const clamp={extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const};
const a=(f:number,s:number,e:number)=>interpolate(f,[s,e],[0,1],{...clamp,easing:Easing.out(Easing.cubic)});
export const Cache:React.FC=()=>{
 const f=useCurrentFrame()*0.287;
 const phase=f<100?0:f<210?1:f<320?2:f<430?3:4;
 const blocks=Array.from({length:18},(_,i)=>i);
 const changed=phase===0?5:phase===1?2:phase===2?5:phase===3?2:5;
 const progress=interpolate(f,[70,150,250,330,430],[0,0.28,0.55,0.78,1],clamp);
 return <AbsoluteFill>
  <Background chapter="05 / KV CACHE & STABLE PREFIX"/>
  <div style={{position:'absolute',left:100,top:95,fontSize:52,fontWeight:850,opacity:a(f,0,18)}}>缓存复用，取决于前缀是否匹配</div>
  <div style={{position:'absolute',left:110,top:185,fontSize:24,color:COLORS.inkSoft,opacity:a(f,10,25)}}>示意：同一个请求模板连续运行两次</div>
  <svg width="1920" height="1080" style={{position:'absolute',inset:0}}>
   <text x="130" y="285" fontSize="28" fill={COLORS.ink} fontWeight="800">请求 A</text>
   <text x="130" y="525" fontSize="28" fill={COLORS.ink} fontWeight="800">请求 B</text>
   {blocks.map((i)=><g key={'a'+i} opacity={a(f,20+i*3,34+i*3)}><rect x={270+i*77} y="235" width="66" height="80" rx="9" fill={i<14?'#DCE9E0':'#DCE5F0'} stroke={i<14?COLORS.green:COLORS.blue} strokeWidth="2"/><text x={303+i*77} y="282" fontSize="18" fill={COLORS.ink} textAnchor="middle">{i<5?'SYS':i<9?'TOOL':i<14?'RULE':'MSG'}</text></g>)}
   {blocks.map((i)=>{const prefixMatch=i<changed; const c=phase<2?'#5AA88B':prefixMatch?'#5AA88B':i===changed?'#D9674E':'#E7B44E'; const opacity=phase<2?a(f,80+i*2,94+i*2):a(f,200+i*5,215+i*5);return <g key={'b'+i} opacity={opacity}><rect x={270+i*77} y="475" width="66" height="80" rx="9" fill={c} stroke={c} strokeWidth="2"/><text x={303+i*77} y="522" fontSize="18" fill={i===changed?'#fff':COLORS.ink} textAnchor="middle">{i<5?'SYS':i<9?'TOOL':i<14?'RULE':'MSG'}</text></g>})}
   <path d="M 270 345 L 1650 345" stroke={COLORS.inkSoft} strokeWidth="2" strokeDasharray="4 8" opacity={a(f,55,75)}/>
   <path d={'M '+(270+changed*77)+' 400 L '+(270+changed*77)+' 455'} stroke={COLORS.coral} strokeWidth="5" opacity={a(f,170,190)}/>
   <path d={'M '+(270+changed*77)+' 405 l -10 12 m 10 -12 l 10 12'} stroke={COLORS.coral} strokeWidth="5" fill="none" opacity={a(f,170,190)}/>
   <rect x="270" y="620" width="1385" height="36" rx="18" fill="#E6EAE3"/><rect x="270" y="620" width={1385*progress} height="36" rx="18" fill={phase<2?COLORS.green:'#5AA88B'}/>
   <text x="270" y="700" fontSize="23" fill={COLORS.green} fontWeight="800" opacity={a(f,80,100)}>绿色：与之前前缀匹配，有机会复用缓存</text>
   <text x="270" y="744" fontSize="23" fill={COLORS.coral} fontWeight="800" opacity={a(f,180,200)}>红色：变化点；其后的缓存复用可能受影响</text>
   <g opacity={a(f,300,330)}><rect x="270" y="795" width="1385" height="105" rx="18" fill="#FFFEF9" stroke={COLORS.green} strokeWidth="2"/><text x="305" y="838" fontSize="24" fill={COLORS.ink} fontWeight="800">工程做法：稳定规则和工具定义放前面，动态信息尽量追加在后面。</text><text x="305" y="875" fontSize="20" fill={COLORS.inkSoft}>实际缓存粒度、有效期与跨请求复用行为由模型服务和推理系统决定。</text></g>
  </svg>
 </AbsoluteFill>;
}