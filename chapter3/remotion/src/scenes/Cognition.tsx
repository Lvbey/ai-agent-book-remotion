import React from 'react';
import {Unit} from '../data';
import {useSceneSteps, bucket, flowPhase, SceneStep} from '../clock';
import {SceneShell, Chip, TextReveal} from '../components/ui';
import {COLORS, SEM} from '../theme';

const TYPE_META: Record<string, {name: string; color: string}> = {
  episodic: {name: '情景记忆 Episodic', color: SEM.episodic},
  semantic: {name: '语义记忆 Semantic', color: SEM.semantic},
  procedural: {name: '程序记忆 Procedural', color: SEM.procedural},
};

// 认知科学基础：工作记忆 + 三类长期记忆 + 三套体系正交
export const Cognition: React.FC<{unit: Unit}> = ({unit}) => {
  const {steps, frame} = useSceneSteps(unit);

  // 把 human / agent 例子归到最近出现的 type 卡片
  const cards: {id: string; r: number; rows: SceneStep[]}[] = [];
  for (const s of steps) {
    if (s.step.kind === 'type') cards.push({id: s.step.v ?? 'episodic', r: s.r, rows: []});
    else if ((s.step.kind === 'human' || s.step.kind === 'agent') && cards.length) {
      cards[cards.length - 1].rows.push(s);
    }
  }

  const wms = bucket(steps, 'wm', 3);
  const matrix = bucket(steps, 'matrix', 3);
  const combos = bucket(steps, 'combo', 3);
  const notes = bucket(steps, 'note', 3);

  // 工作记忆容量条：持续脉动，表示临时空间被占用/释放
  const pulse = flowPhase(frame, 120);
  const wmFill = 0.35 + 0.25 * Math.sin(pulse * Math.PI * 2);

  return (
    <SceneShell unit={unit}>
      {/* 顶部：工作记忆 */}
      <div
        style={{
          position: 'absolute',
          left: 110,
          top: 168,
          width: 1700,
          height: 130,
          boxSizing: 'border-box',
          borderRadius: 22,
          padding: 16,
          background: COLORS.white,
          border: `2px solid ${SEM.working}`,
        }}
      >
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div style={{fontSize: 24, fontWeight: 800, color: SEM.working}}>工作记忆 Working Memory（= 上下文窗口）</div>
          <div style={{fontSize: 19, fontWeight: 700, color: COLORS.inkSoft}}>
            占用 {Math.round(wmFill * 100)}% · 临时信息空间
          </div>
        </div>
        <div style={{height: 18, borderRadius: 9, background: '#E3E8E1', overflow: 'hidden', marginTop: 10}}>
          <div style={{width: `${wmFill * 100}%`, height: '100%', background: SEM.working, borderRadius: 9}} />
        </div>
        <div style={{display: 'flex', gap: 10, marginTop: 10}}>
          {wms.map((s, i) => (
            <div key={`${s.unitId}-w-${i}`} style={{position: 'relative'}}>
              <Chip flow x={0} y={0} r={s.r} label={s.step.label} bg={SEM.working} fontSize={19} />
            </div>
          ))}
        </div>
      </div>

      {/* 三张类型卡片 */}
      {cards.slice(-3).map((c, i) => {
        const meta = TYPE_META[c.id] ?? TYPE_META.episodic;
        return (
          <div
            key={`${c.id}-${i}`}
            style={{
              position: 'absolute',
              left: 110 + i * 570,
              top: 326,
              width: 540,
              height: 330,
              boxSizing: 'border-box',
              borderRadius: 22,
              padding: 16,
              background: COLORS.white,
              border: `2px solid ${meta.color}`,
              opacity: c.r,
            }}
          >
            <div style={{fontSize: 24, fontWeight: 800, color: meta.color, marginBottom: 10}}>{meta.name}</div>
            {c.rows.slice(-4).map((s, j) => (
              <div
                key={`${s.unitId}-${j}`}
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: COLORS.ink,
                  background: s.step.kind === 'human' ? '#F4EFE4' : '#F1F5EE',
                  borderLeft: `5px solid ${s.step.kind === 'human' ? COLORS.gold : meta.color}`,
                  borderRadius: 8,
                  padding: '7px 12px',
                  marginBottom: 7,
                  opacity: s.r,
                  transform: `translateX(${(1 - s.r) * 16}px)`,
                }}
              >
                <span style={{color: COLORS.muted, marginRight: 8, fontSize: 17}}>
                  {s.step.kind === 'human' ? '人类' : 'Agent'}
                </span>
                {s.step.label}
              </div>
            ))}
          </div>
        );
      })}

      {/* 底部：三套体系正交 + 自由组合 */}
      <div style={{position: 'absolute', left: 110, top: 682, width: 1700}}>
        <div style={{fontSize: 20, fontWeight: 800, color: COLORS.inkSoft, marginBottom: 8}}>
          三套分类体系（正交，可自由组合）
        </div>
        <div style={{display: 'flex', gap: 14}}>
          {matrix.map((s, i) => (
            <div
              key={`${s.unitId}-m-${i}`}
              style={{
                fontSize: 21,
                fontWeight: 800,
                color: COLORS.ink,
                background: COLORS.white,
                border: '1.5px solid #D8DED4',
                borderRadius: 12,
                padding: '10px 16px',
                opacity: s.r,
                transform: `translateY(${(1 - s.r) * 12}px)`,
              }}
            >
              {s.step.label}
            </div>
          ))}
          {combos.map((s, i) => (
            <div key={`${s.unitId}-cb-${i}`} style={{position: 'relative'}}>
              <Chip flow x={0} y={0} r={s.r} label={s.step.label} bg={COLORS.coral} fontSize={20} />
            </div>
          ))}
        </div>
        <div style={{display: 'flex', gap: 14, marginTop: 12}}>
          {notes.slice(-3).map((s, i) => (
            <div key={`${s.unitId}-n-${i}`} style={{position: 'relative'}}>
              <Chip flow x={0} y={0} r={s.r} label={s.step.label} bg={COLORS.inkSoft} fontSize={19} />
            </div>
          ))}
        </div>
      </div>
    </SceneShell>
  );
};
