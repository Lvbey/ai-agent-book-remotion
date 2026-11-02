import React from 'react';
import {Unit} from '../data';
import {useSceneSteps, bucket, flowPhase} from '../clock';
import {SceneShell, Chip, TextReveal} from '../components/ui';
import {COLORS} from '../theme';

// User as Code：只增日志 + 带类型状态 + 用普通函数完成聚合/冲突/约束
export const CodeState: React.FC<{unit: Unit}> = ({unit}) => {
  const {steps, frame} = useSceneSteps(unit);

  const wals = bucket(steps, 'wal', 4);
  const states = bucket(steps, 'state', 6);
  const rules = bucket(steps, 'rule', 3);
  const execs = bucket(steps, 'exec', 4);
  const results = bucket(steps, 'result', 2);
  const textvs = bucket(steps, 'textvs', 3);
  const notes = bucket(steps, 'note', 2);

  // 打字机光标：持续闪烁，配合逐字输出保证每秒都有可见推进
  const blink = flowPhase(frame, 40) > 0.5 ? 1 : 0.15;
  // 打字结束到下一元素入场之间可能留出 3 秒空档，仅靠光标会判为画面停滞；
  // 用一条低透明度扫描光带循环扫过代码面板，兼顾「面板仍在推进」与「可验证/可执行」的语义。
  const sweep = flowPhase(frame, 96);
  const codeLines = [...rules, ...execs].slice(-5);

  const typed = (s: {step: {label: string}; r: number}) => {
    const n = Math.floor(s.step.label.length * s.r);
    return s.step.label.slice(0, n);
  };

  return (
    <SceneShell unit={unit}>
      {/* 左：只增日志 */}
      <div
        style={{
          position: 'absolute',
          left: 110,
          top: 168,
          width: 480,
          height: 300,
          boxSizing: 'border-box',
          borderRadius: 22,
          padding: 18,
          background: COLORS.white,
          border: `2px solid ${COLORS.blue}`,
        }}
      >
        <div style={{fontSize: 23, fontWeight: 800, color: COLORS.blue, marginBottom: 10}}>只增日志（原始证据）</div>
        {wals.slice(-4).map((s, i) => (
          <div
            key={`${s.unitId}-w-${i}`}
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: COLORS.ink,
              background: '#F1F5EE',
              borderLeft: `5px solid ${COLORS.blue}`,
              borderRadius: 8,
              padding: '7px 12px',
              marginBottom: 7,
              opacity: s.r,
              transform: `translateX(${(1 - s.r) * 16}px)`,
            }}
          >
            {s.step.label}
          </div>
        ))}
      </div>

      {/* 中：带类型状态 */}
      <div
        style={{
          position: 'absolute',
          left: 630,
          top: 168,
          width: 560,
          height: 322,
          boxSizing: 'border-box',
          borderRadius: 22,
          padding: 18,
          background: COLORS.white,
          border: `2px solid ${COLORS.green}`,
        }}
      >
        <div style={{fontSize: 23, fontWeight: 800, color: COLORS.green, marginBottom: 10}}>带类型的可执行状态</div>
        {states.slice(-5).map((s, i) => (
          <div
            key={`${s.unitId}-s-${i}`}
            style={{
              fontSize: 19,
              fontWeight: 700,
              color: COLORS.ink,
              background: 'rgba(39,106,87,0.08)',
              borderRadius: 8,
              padding: '5px 10px',
              marginBottom: 5,
              opacity: s.r,
              transform: `translateX(${(1 - s.r) * 14}px)`,
              fontFamily: "ui-monospace, 'SFMono-Regular', Consolas, monospace",
            }}
          >
            {s.step.label}
          </div>
        ))}
      </div>

      {/* 右：代码执行（打字机逐字输出） */}
      <div
        style={{
          position: 'absolute',
          left: 1230,
          top: 168,
          width: 580,
          height: 430,
          boxSizing: 'border-box',
          borderRadius: 22,
          padding: 18,
          background: '#1E2A26',
          color: '#E7F0EA',
          fontFamily: "ui-monospace, 'SFMono-Regular', Consolas, monospace",
        }}
      >
        <div style={{fontSize: 20, fontWeight: 800, color: COLORS.greenBright, marginBottom: 10}}>
          确定性函数（可验证介质）
        </div>
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            top: 58 + sweep * 344,
            height: 3,
            borderRadius: 2,
            background:
              'linear-gradient(90deg, rgba(126,233,180,0) 0%, rgba(126,233,180,0.42) 42%, rgba(126,233,180,0.05) 100%)',
            pointerEvents: 'none',
          }}
        />
        {codeLines.map((s, i) => {
          const t = typed(s);
          const done = s.r >= 1;
          return (
            <div
              key={`${s.unitId}-c-${i}`}
              style={{
                fontSize: 20,
                lineHeight: 1.5,
                color: s.step.kind === 'rule' ? COLORS.gold : '#D7E6DC',
                whiteSpace: 'pre',
              }}
            >
              <span style={{color: COLORS.muted, marginRight: 8}}>{s.step.kind === 'rule' ? 'def' : '›'}</span>
              {t}
              {!done ? <span style={{opacity: blink, color: '#fff'}}>|</span> : null}
            </div>
          );
        })}
        {results.map((s, i) => (
          <div
            key={`${s.unitId}-r-${i}`}
            style={{
              marginTop: 14,
              fontSize: 24,
              fontWeight: 800,
              color: '#0F1F1A',
              background: COLORS.greenBright,
              borderRadius: 10,
              padding: '8px 14px',
              opacity: s.r,
              transform: `scale(${0.94 + 0.06 * s.r})`,
            }}
          >
            {s.step.label}
          </div>
        ))}
      </div>

      {/* 底部：文本表示 vs 可执行表示 */}
      <div style={{position: 'absolute', left: 110, top: 500, width: 1080}}>
        <div style={{fontSize: 20, fontWeight: 800, color: COLORS.inkSoft, marginBottom: 8}}>为什么换成可执行对象</div>
        {textvs.slice(-3).map((s, i) => (
          <div
            key={`${s.unitId}-t-${i}`}
            style={{
              fontSize: 21,
              fontWeight: 700,
              color: COLORS.ink,
              background: '#F1F5EE',
              borderRadius: 8,
              padding: '7px 12px',
              marginBottom: 7,
              opacity: s.r,
              transform: `translateY(${(1 - s.r) * 10}px)`,
            }}
          >
            {s.step.label}
          </div>
        ))}
      </div>

      <div style={{position: 'absolute', left: 110, top: 690, width: 1080}}>
        <div style={{display: 'flex', gap: 10, flexWrap: 'wrap'}}>
          {notes.map((s, i) => (
            <div key={`${s.unitId}-n-${i}`} style={{position: 'relative'}}>
              <Chip flow x={0} y={0} r={s.r} label={s.step.label} bg={COLORS.green} fontSize={19} />
            </div>
          ))}
        </div>
      </div>
    </SceneShell>
  );
};
