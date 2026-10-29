import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, Easing} from 'remotion';
import {Background} from '../components/Background';
import {TextReveal, Caption} from '../components/Typography';
import {COLORS} from '../theme';

export const Conclusion: React.FC = () => {
  const f=useCurrentFrame();
  const rings=interpolate(f,[15,70],[0.3,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.out(Easing.cubic)});
  const cards=[
    {n:'01',t:'组织',d:'规则清楚，格式稳定'},
    {n:'02',t:'供给',d:'知识按需，状态显式'},
    {n:'03',t:'精简',d:'压缩噪声，保留证据'},
    {n:'04',t:'隔离',d:'让无关过程不进主上下文'},
  ];
  return <AbsoluteFill>
    <Background chapter="07 / DESIGN THE CONTEXT" dark />
    <div style={{position:'absolute',left:120,top:150,width:700}}>
      <TextReveal text="模型决定能做什么。" start={8} size={65} color={COLORS.paper} width={690}/>
      <TextReveal text="上下文，决定它此刻能用什么。" start={40} size={48} color="#A9D7C0" width={690}/>
      <div style={{fontSize:25,color:'#D0DCD5',lineHeight:1.6,marginTop:40,opacity:interpolate(f,[76,100],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}}>上下文工程，就是为每一次决策，提供准确、相关、可控的信息。</div>
    </div>
    <div style={{position:'absolute',right:155,top:185,width:620,height:560}}>
      <svg width="620" height="560" viewBox="0 0 620 560">
        <circle cx="310" cy="280" r={190*rings} fill="none" stroke="#5AA88B" strokeWidth="3" opacity="0.45"/>
        <circle cx="310" cy="280" r={135*rings} fill="none" stroke="#E7B44E" strokeWidth="3" opacity="0.7"/>
        <circle cx="310" cy="280" r={78*rings} fill="#2D6E58" stroke="#8CC3A5" strokeWidth="2"/>
        <text x="310" y="270" fill="#FFFEF9" fontSize="28" textAnchor="middle" fontWeight="700">Agent</text>
        <text x="310" y="306" fill="#CBE5D6" fontSize="20" textAnchor="middle">决策时刻</text>
        {[[310,75],[515,280],[310,485],[105,280]].map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r="20" fill={['#5AA88B','#E7B44E','#D9674E','#5A7CA8'][i]}/><path d={`M310 280 L${x} ${y}`} stroke="#D2DED5" strokeWidth="2" strokeDasharray="5 7" opacity="0.65"/></g>)}
      </svg>
    </div>
    <div style={{position:'absolute',left:115,top:665,width:1040,display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      {cards.map((c,i)=><div key={c.n} style={{display:'flex',gap:18,alignItems:'center',padding:'17px 22px',borderRadius:15,background:'#24423A',border:'1px solid #45695C',opacity:interpolate(f,[95+i*10,112+i*10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}}><div style={{fontSize:20,color:'#E7B44E',fontWeight:800}}>{c.n}</div><div><div style={{fontSize:23,color:COLORS.paper,fontWeight:800}}>{c.t}</div><div style={{fontSize:18,color:'#C5D8CC',marginTop:5}}>{c.d}</div></div></div>)}
    </div>
    <div style={{position:'absolute',right:140,bottom:75,fontSize:22,color:'#A9D7C0',letterSpacing:2,opacity:interpolate(f,[140,165],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}}>让有用的信息，出现在正确的时刻。</div>
    <Caption text="Agent 的能力不只存在于模型里，也存在于信息如何被组织和交付。" start={180} end={235}/>
  </AbsoluteFill>;
};
