import React from 'react';
import {AbsoluteFill,interpolate,Easing} from 'remotion';
import {Background} from '../components/Background';
import {useStoryFrame} from '../sceneTiming';
import {COLORS} from '../theme';
const clamp={extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const};
const a=(f:number,s:number,e:number)=>interpolate(f,[s,e],[0,1],{...clamp,easing:Easing.out(Easing.cubic)});
export const StateAndCompress:React.FC=()=>{
 const f=useStoryFrame('StateAndCompress');
 const phase=f<110?0:f<230?1:f<350?2:f<470?3:4;
 const logs=Array.from({length:24},(_,i)=>({x:120+(i%6)*175,y:255+Math.floor(i/6)*110,t:['搜索输出','重复日志','旧尝试','测试结果'][i%4]}));
 const summary=[
  ['目标','修复支付回调的重复扣款'],
  ['已证实','入口位于 callbacks.py'],
  ['失败路径','重试时未使用幂等键'],
  ['下一步','补充重复请求测试'],
  ['证据','tests/payment_test.py']
 ];
 return <AbsoluteFill>
  <Background chapter="06 / STATE & COMPRESSION"/>
  <div style={{position:'absolute',left:100,top:95,fontSize:52,fontWeight:850,opacity:a(f,0,18)}}>长历史里，重要信息会被噪声淹没</div>
  <svg width="1920" height="1080" style={{position:'absolute',inset:0}}>
   <text x="120" y="205" fontSize="27" fill={COLORS.inkSoft} fontWeight="800" opacity={a(f,10,25)}>多轮工具调用留下的轨迹</text>
   {logs.map((l,i)=>{const keep=[2,7,12,17,22].includes(i);const x=phase<2?l.x:interpolate(f,[220,290],[l.x,keep?940:1500],clamp);const y=phase<2?l.y:interpolate(f,[220,290],[l.y,keep?310+(summary.findIndex(s=>s[0]===['目标','已证实','失败路径','下一步','证据'][[2,7,12,17,22].indexOf(i)])*100):80],clamp);return <g key={i} opacity={phase<2?a(f,15+i*3,27+i*3):keep?1:1-a(f,220,290)}><rect x={x} y={y} width="150" height="70" rx="10" fill={keep?'#DDECE2':'#EEE9DE'} stroke={keep?COLORS.green:'#D5D1C7'} strokeWidth="2"/><text x={x+12} y={y+28} fontSize="18" fill={COLORS.ink}>{l.t}</text><path d={'M '+(x+12)+' '+(y+45)+' h 100'} stroke="#B6C1B7" strokeWidth="4" strokeLinecap="round"/></g>})}
   <g opacity={a(f,170,205)}><path d="M 1220 520 C 1300 570 1320 620 1390 650" stroke={COLORS.green} strokeWidth="4" fill="none" strokeDasharray="8 8" strokeDashoffset={interpolate(f,[190,240],[200,0],clamp)}/><text x="1220" y="565" fontSize="21" fill={COLORS.green} fontWeight="800">提炼任务相关信息</text></g>
   <g opacity={a(f,260,300)}><rect x="1270" y="235" width="550" height="540" rx="22" fill="#FFFEF9" stroke={COLORS.green} strokeWidth="3"/><text x="1310" y="285" fontSize="29" fill={COLORS.green} fontWeight="800">当前状态 / 摘要</text>
    {summary.map((s,i)=><g key={s[0]} opacity={a(f,285+i*18,300+i*18)}><rect x="1310" y={320+i*83} width="470" height="68" rx="12" fill={i===2?'#F8E3DC':'#E5EEE6'}/><text x="1330" y={347+i*83} fontSize="19" fill={i===2?COLORS.coral:COLORS.green} fontWeight="800">{s[0]}</text><text x="1330" y={374+i*83} fontSize="18" fill={COLORS.ink}>{s[1]}</text></g>)}
   </g>
   <g opacity={a(f,390,420)}><rect x="120" y="820" width="1700" height="92" rx="18" fill="#E9EDE5"/><text x="160" y="858" fontSize="24" fill={COLORS.ink} fontWeight="800">压缩不是无损：保留决策、约束、失败路径、证据和来源。</text><text x="160" y="890" fontSize="20" fill={COLORS.inkSoft}>大量探索也可交给子 Agent 隔离执行，只把可验证结论返回主上下文。</text></g>
  </svg>
 </AbsoluteFill>;
}