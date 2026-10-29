import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, Easing} from 'remotion';
import {Background} from '../components/Background';
import {COLORS} from '../theme';

const cl = {extrapolateLeft:'clamp' as const, extrapolateRight:'clamp' as const};
const p = (f:number,s:number,e:number) => interpolate(f,[s,e],[0,1],{...cl,easing:Easing.out(Easing.cubic)});
const rect = (x:number,y:number,w:number,h:number,fill:string,stroke:string='#D8DED4') => ({x,y,width:w,height:h,rx:14,fill,stroke,strokeWidth:2});

export const ApiStructure:React.FC=()=>{
 const f=useCurrentFrame()*7.05;
 const roles=[['system','开发者规则',COLORS.green],['user','用户任务',COLORS.blue],['assistant','模型回复 / 工具请求',COLORS.gold],['tool','工具执行结果',COLORS.coral]];
 return <AbsoluteFill><Background chapter="03 / API MESSAGE STRUCTURE"/>
  <div style={{position:'absolute',left:100,top:100,fontSize:52,fontWeight:850,opacity:p(f,0,18)}}>模型每次收到的，是一份被组装好的请求</div>
  <svg width="1920" height="1080" style={{position:'absolute',inset:0}}>
   <text x="120" y="205" fontSize="25" fill={COLORS.inkSoft}>第一次调用 · messages + tools</text>
   {roles.slice(0,2).map((r,i)=><g key={r[0]} opacity={p(f,25+i*25,45+i*25)}><rect {...rect(120,245+i*125,700,90,'#FFFEF9',String(r[2]))}/><text x="155" y={285+i*125} fontSize="25" fill={String(r[2])} fontWeight="800">{String(r[0])}</text><text x="350" y={285+i*125} fontSize="23" fill={COLORS.ink}>{String(r[1])}</text><text x="350" y={317+i*125} fontSize="18" fill={COLORS.inkSoft}>{i===0?'You are a helpful assistant…':'帮我查温哥华现在的天气'}</text></g>)}
   <g opacity={p(f,80,110)}><rect {...rect(900,245,870,215,'#E3EBF3',COLORS.blue)}/><text x="940" y="290" fontSize="26" fill={COLORS.blue} fontWeight="800">tools：工具定义（独立字段）</text><text x="940" y="340" fontSize="22" fill={COLORS.ink}>get_current_time(timezone)</text><text x="940" y="385" fontSize="22" fill={COLORS.ink}>get_weather(city, unit)</text><text x="940" y="425" fontSize="19" fill={COLORS.inkSoft}>名称、描述、参数 Schema</text></g>
   <path d="M 820 330 C 865 330 860 330 900 330" stroke={COLORS.green} strokeWidth="4" strokeDasharray="8 8" strokeDashoffset={interpolate(f,[70,110],[80,0],cl)}/>
   <g opacity={p(f,130,155)}><rect {...rect(120,540,1650,115,'#E4EEE5',COLORS.green)}/><text x="160" y="585" fontSize="25" fill={COLORS.green} fontWeight="800">模型返回 assistant.tool_calls</text><text x="160" y="625" fontSize="22" fill={COLORS.ink}>“请调用 get_current_time 和 get_weather”——这只是请求，还没有执行。</text></g>
   <g opacity={p(f,170,200)}><path d="M 950 655 L 950 720" stroke={COLORS.coral} strokeWidth="4" strokeDasharray="7 7"/><rect {...rect(120,720,760,130,'#F8E3DC',COLORS.coral)}/><text x="155" y="765" fontSize="24" fill={COLORS.coral} fontWeight="800">Agent 框架执行工具</text><text x="155" y="808" fontSize="21" fill={COLORS.ink}>调用外部 API，取得真实结果</text><rect {...rect(1010,720,760,130,'#FFFEF9',COLORS.gold)}/><text x="1045" y="765" fontSize="24" fill={COLORS.gold} fontWeight="800">tool 消息回填</text><text x="1045" y="808" fontSize="21" fill={COLORS.ink}>用 tool_call_id 关联对应结果</text></g>
   <path d="M 880 785 L 1010 785" stroke={COLORS.green} strokeWidth="4" strokeDasharray="8 8" strokeDashoffset={interpolate(f,[190,220],[130,0],cl)}/>
   <g opacity={p(f,230,255)}><text x="120" y="925" fontSize="30" fill={COLORS.green} fontWeight="800">四种消息角色 + tools 字段 = 一次请求的基本骨架</text><text x="120" y="970" fontSize="21" fill={COLORS.inkSoft}>API 通常无状态：下一次调用要重新带上必要历史与工具结果。</text></g>
  </svg>
 </AbsoluteFill>;
};

export const ChatTemplate:React.FC=()=>{
 const f=useCurrentFrame()*5.1;
 const tokens=['<|im_start|>','system','You are helpful','<|im_end|>','<|im_start|>','user','Hello!','<|im_end|>','<|im_start|>','assistant'];
 return <AbsoluteFill><Background chapter="04 / FROM MESSAGES TO TOKENS"/>
  <div style={{position:'absolute',left:100,top:100,fontSize:52,fontWeight:850,opacity:p(f,0,18)}}>消息列表，还不是模型真正处理的形式</div>
  <div style={{position:'absolute',left:105,top:190,fontSize:24,color:COLORS.inkSoft,opacity:p(f,10,25)}}>Chat Template 把带角色的消息转换成模型可识别的 token 序列。</div>
  <svg width="1920" height="1080" style={{position:'absolute',inset:0}}>
   <rect {...rect(110,260,590,430,'#FFFEF9',COLORS.blue)} opacity={p(f,20,35)}/>
   <text x="150" y="310" fontSize="27" fill={COLORS.blue} fontWeight="800" opacity={p(f,20,35)}>结构化消息</text>
   {['system: 规则','user: 任务','assistant: 回复'].map((s,i)=><g key={s} opacity={p(f,30+i*20,48+i*20)}><rect {...rect(150,350+i*95,510,65,['#E4EEE5','#E3EBF3','#F5E9C9'][i])}/><text x="180" y={391+i*95} fontSize="23" fill={COLORS.ink}>{s}</text></g>)}
   <path d="M 740 470 L 900 470" stroke={COLORS.green} strokeWidth="5" strokeDasharray="12 9" strokeDashoffset={interpolate(f,[90,130],[160,0],cl)}/>
   <rect {...rect(930,260,850,430,'#E4EEE5',COLORS.green)} opacity={p(f,90,115)}/>
   <text x="970" y="310" fontSize="27" fill={COLORS.green} fontWeight="800" opacity={p(f,90,115)}>序列化后的 token 流</text>
   {tokens.map((s,i)=>{const x=970+(i%3)*250,y=350+Math.floor(i/3)*82;return <g key={i} opacity={p(f,110+i*9,125+i*9)}><rect {...rect(x,y,220,54,i%3===0?'#DCE9E0':'#FFFEF9',i%3===0?COLORS.green:'#C7D3C8')}/><text x={x+12} y={y+34} fontSize="18" fill={COLORS.ink}>{s}</text></g>})}
   <g opacity={p(f,210,235)}><rect {...rect(110,760,1670,105,'#F8E7D9',COLORS.gold)}/><text x="150" y="805" fontSize="25" fill={COLORS.ink} fontWeight="800">边界 token 也是结构的一部分</text><text x="150" y="842" fontSize="21" fill={COLORS.ink}>角色边界、结束标记与工具调用格式会影响解析和缓存前缀。</text></g>
   <text x="110" y="930" fontSize="29" fill={COLORS.green} fontWeight="800" opacity={p(f,245,265)}>看起来相同的文字，经过模板后可能对应不同的 token 序列。</text>
  </svg>
 </AbsoluteFill>;
};

export const PromptEngineering:React.FC=()=>{
 const f=useCurrentFrame()*6.92;
 const messy=['一定要简洁','解释所有细节','不要太长','必须详细','先测再改','不要运行测试'];
 const ordered=[['目标','修复支付回调重复扣款'],['流程','读取规范 → 定位代码 → 修改 → 测试'],['边界','不提交代码；不泄露密钥'],['输出','总结改动与测试结果']];
 return <AbsoluteFill><Background chapter="07 / PROMPT ENGINEERING"/>
  <div style={{position:'absolute',left:100,top:100,fontSize:52,fontWeight:850,opacity:p(f,0,18)}}>提示词不是越长越好，而是要有结构</div>
  <svg width="1920" height="1080" style={{position:'absolute',inset:0}}>
   <text x="120" y="215" fontSize="27" fill={COLORS.coral} fontWeight="800" opacity={p(f,10,25)}>规则堆砌：互相打架</text>
   {messy.map((s,i)=><g key={s} opacity={p(f,20+i*14,35+i*14)} transform={'rotate('+((i%2?1:-1)*((i*3)%7))+' '+(350+(i%2)*90)+' '+(300+i*75)+')'}><rect {...rect(130+(i%2)*190,260+i*75,360,55,i%2?'#F8E3DC':'#F3E8D1',COLORS.coral)}/><text x={150+(i%2)*190} y={295+i*75} fontSize="20" fill={COLORS.ink}>{s}</text></g>)}
   <path d="M 650 510 L 820 510" stroke={COLORS.green} strokeWidth="5" strokeDasharray="10 8" strokeDashoffset={interpolate(f,[100,140],[170,0],cl)}/>
   <text x="900" y="215" fontSize="27" fill={COLORS.green} fontWeight="800" opacity={p(f,120,140)}>结构化：每条规则有职责</text>
   {ordered.map((s,i)=><g key={s[0]} opacity={p(f,140+i*22,158+i*22)}><rect {...rect(900,255+i*125,820,90,'#FFFEF9',[COLORS.green,COLORS.blue,COLORS.coral,COLORS.gold][i])}/><text x="935" y={293+i*125} fontSize="23" fill={[COLORS.green,COLORS.blue,COLORS.coral,COLORS.gold][i]} fontWeight="800">{s[0]}</text><text x="1080" y={293+i*125} fontSize="22" fill={COLORS.ink}>{s[1]}</text></g>)}
   <g opacity={p(f,235,260)}><rect {...rect(120,820,1600,90,'#E4EEE5',COLORS.green)}/><text x="160" y="858" fontSize="24" fill={COLORS.green} fontWeight="800">Few-shot 示例：当规则难以说清时，给模型看“输入 → 理想输出”</text><text x="160" y="890" fontSize="20" fill={COLORS.ink}>示例要代表目标行为；过多或质量差的示例同样会污染上下文。</text></g>
  </svg>
 </AbsoluteFill>;
};

export const StateBar:React.FC=()=>{
 const f=useCurrentFrame()*5.45;
 const rows=[['目标','找到支付回调入口'],['已完成','读取 callbacks.py'],['已证实','重试路径没有幂等保护'],['计数','搜索 8 次 / 测试 2 次'],['下一步','检查调用点并补测试']];
 return <AbsoluteFill><Background chapter="10 / AGENT STATE BAR"/>
  <div style={{position:'absolute',left:100,top:100,fontSize:52,fontWeight:850,opacity:p(f,0,18)}}>别让模型每一步都重新猜“现在进展到哪了”</div>
  <svg width="1920" height="1080" style={{position:'absolute',inset:0}}>
   <text x="120" y="220" fontSize="26" fill={COLORS.inkSoft} opacity={p(f,10,25)}>不断增长的历史</text>
   {Array.from({length:14},(_,i)=><g key={i} opacity={p(f,15+i*9,28+i*9)}><rect {...rect(120+(i%2)*300,260+Math.floor(i/2)*70,270,48,i%3===0?'#F3E8D1':'#FFFEF9','#D8DED4')}/><text x={140+(i%2)*300} y={290+Math.floor(i/2)*70} fontSize="17" fill={COLORS.ink}>{['搜索输出…','工具结果…','旧计划…'][i%3]}</text></g>)}
   <path d="M 770 500 L 950 500" stroke={COLORS.green} strokeWidth="5" strokeDasharray="10 8" strokeDashoffset={interpolate(f,[100,145],[180,0],cl)}/>
   <rect {...rect(980,220,800,590,'#E4EEE5',COLORS.green)} opacity={p(f,130,155)}/>
   <text x="1025" y="270" fontSize="29" fill={COLORS.green} fontWeight="800" opacity={p(f,130,155)}>Agent 状态栏</text>
   {rows.map((r,i)=><g key={r[0]} opacity={p(f,150+i*18,170+i*18)}><rect {...rect(1025,305+i*88,710,65,'#FFFEF9',i===2?COLORS.gold:COLORS.green)}/><text x="1050" y={345+i*88} fontSize="21" fill={COLORS.green} fontWeight="800">{r[0]}</text><text x="1200" y={345+i*88} fontSize="21" fill={COLORS.ink}>{r[1]}</text></g>)}
   <g opacity={p(f,250,275)}><rect {...rect(120,875,1660,75,'#F8E3DC',COLORS.coral)}/><text x="155" y="922" fontSize="23" fill={COLORS.coral} fontWeight="800">警告：状态栏是“记录”，不是事实本身；计数和状态必须由可靠机制校验。</text></g>
  </svg>
 </AbsoluteFill>;
};

export const CompressionStrategies:React.FC=()=>{
 const f=useCurrentFrame()*11.25;
 const strategies=[
  {name:'无压缩',desc:'原始结果全部保留',cost:'窗口很快溢出',c:COLORS.coral},
  {name:'逐页摘要',desc:'每个结果各自总结',cost:'信息碎片化、重复多',c:COLORS.gold},
  {name:'综合摘要',desc:'合并所有搜索结果',cost:'超长输入可能被截断',c:COLORS.blue},
  {name:'任务感知压缩',desc:'结合查询意图与当前已知',cost:'保留后续决策需要的事实',c:COLORS.green},
  {name:'带引用摘要',desc:'每条关键事实保留来源',cost:'可回查原文核实',c:'#7A8F6A'},
  {name:'自适应窗口',desc:'接近阈值时批量压缩',cost:'尽量保留前期原始信息',c:COLORS.inkSoft}
 ];
 return <AbsoluteFill><Background chapter="11 / COMPRESSION STRATEGIES"/>
  <div style={{position:'absolute',left:100,top:100,fontSize:52,fontWeight:850,opacity:p(f,0,18)}}>压缩不是“把文字变短”这么简单</div>
  <div style={{position:'absolute',left:110,top:180,fontSize:24,color:COLORS.inkSoft,opacity:p(f,10,25)}}>同一批搜索资料，不同策略会留下不同的可用信息。</div>
  <svg width="1920" height="1080" style={{position:'absolute',inset:0}}>
   {strategies.map((s,i)=>{const y=245+i*105;return <g key={s.name} opacity={p(f,20+i*22,38+i*22)}><rect {...rect(120,y,1670,78,'#FFFEF9',s.c)}/><rect x="120" y={y} width="14" height="78" rx="7" fill={s.c}/><text x="165" y={y+32} fontSize="23" fill={s.c} fontWeight="800">{s.name}</text><text x="420" y={y+32} fontSize="21" fill={COLORS.ink}>{s.desc}</text><text x="420" y={y+60} fontSize="19" fill={COLORS.inkSoft}>结果：{s.cost}</text></g>})}
   <g opacity={p(f,170,200)}><rect {...rect(120,900,1670,75,'#E4EEE5',COLORS.green)}/><text x="155" y="947" fontSize="23" fill={COLORS.green} fontWeight="800">原文特定实验：任务感知策略显著降低了该任务的 token 使用量；数字不是普遍保证。</text></g>
  </svg>
 </AbsoluteFill>;
};

export const SubAgentIsolation:React.FC=()=>{
 const f=useCurrentFrame()*5.51;
 return <AbsoluteFill><Background chapter="12 / ISOLATION OVER COMPRESSION"/>
  <div style={{position:'absolute',left:100,top:100,fontSize:52,fontWeight:850,opacity:p(f,0,18)}}>更好的减法：让噪声根本不进入主上下文</div>
  <svg width="1920" height="1080" style={{position:'absolute',inset:0}}>
   <rect {...rect(100,230,700,570,'#FFFEF9',COLORS.blue)} opacity={p(f,15,35)}/><text x="140" y="280" fontSize="28" fill={COLORS.blue} fontWeight="800" opacity={p(f,15,35)}>主 Agent 上下文</text>
   <rect {...rect(930,230,850,570,'#E4EEE5',COLORS.green)} opacity={p(f,25,45)}/><text x="970" y="280" fontSize="28" fill={COLORS.green} fontWeight="800" opacity={p(f,25,45)}>子 Agent 独立探索空间</text>
   {Array.from({length:16},(_,i)=><g key={i} opacity={p(f,35+i*7,48+i*7)}><rect {...rect(980+(i%4)*180,330+Math.floor(i/4)*90,150,58,i%3===0?'#F3E8D1':'#FFFEF9','#C8D4C8')}/><text x={995+(i%4)*180} y={365+Math.floor(i/4)*90} fontSize="18" fill={COLORS.ink}>{['搜索文件','读代码','找调用点','检查测试'][i%4]}</text></g>)}
   <g opacity={p(f,90,115)}><rect {...rect(140,340,610,90,'#E4EEE5',COLORS.green)}/><text x="175" y="378" fontSize="22" fill={COLORS.green} fontWeight="800">任务描述（自包含）</text><text x="175" y="408" fontSize="19" fill={COLORS.ink}>找到支付回调入口和调用点</text></g>
   <path d="M 800 520 L 920 520" stroke={COLORS.green} strokeWidth="5" strokeDasharray="10 8" strokeDashoffset={interpolate(f,[130,170],[120,0],cl)}/>
   <g opacity={p(f,145,175)}><rect {...rect(980,720,700,60,'#DDECE2',COLORS.green)}/><text x="1010" y="758" fontSize="22" fill={COLORS.green} fontWeight="800">回传：路径、结论、证据、未知项</text></g>
   <g opacity={p(f,180,210)}><rect {...rect(140,500,610,180,'#E3EBF3',COLORS.blue)}/><text x="175" y="545" fontSize="24" fill={COLORS.blue} fontWeight="800">主上下文只收到结论</text><text x="175" y="590" fontSize="21" fill={COLORS.ink}>src/payment/callbacks.py</text><text x="175" y="630" fontSize="21" fill={COLORS.ink}>handle_callback；另有两处调用点</text></g>
   <text x="120" y="890" fontSize="25" fill={COLORS.green} fontWeight="800" opacity={p(f,220,245)}>隔离减少噪声，但子 Agent 看不到主上下文的全部内容——委派任务必须写清目标与约束。</text>
  </svg>
 </AbsoluteFill>;
};
