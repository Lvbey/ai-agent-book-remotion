import React from 'react';
import {Unit} from '../data';
import {useSceneSteps, bucket, SceneStep, flowPhase} from '../clock';
import {SceneShell, Item, Chip, TextReveal} from '../components/ui';
import {COLORS, SEM} from '../theme';

// 图 3-1 本章知识脉络：两个尺度 + 共用技术 + 共同麻烦 + 本章路线
export const IntroMap: React.FC<{unit: Unit}> = ({unit}) => {
  const {steps, frame} = useSceneSteps(unit);

  // 按出现顺序把 list 归到最近的 branch 之下
  const branches: {name: string; sub: string; items: SceneStep[]; r: number}[] = [];
  for (const s of steps) {
    if (s.step.kind === 'branch') {
      branches.push({name: s.step.label, sub: s.step.v ?? '', items: [], r: s.r});
    } else if (s.step.kind === 'list' && branches.length) {
      branches[branches.length - 1].items.push(s);
    }
  }
  const shared = bucket(steps, 'shared', 3);
  const trouble = bucket(steps, 'trouble', 3);
  const route = bucket(steps, 'route', 3);
  const focus = bucket(steps, 'focus', 1)[0];
  const notes = bucket(steps, 'note', 2);

  // 连续流动：数据包沿「用户记忆 → 共用技术 → 知识库」推进
  const pulse = flowPhase(frame, 120);
  const px = 660 + pulse * 620;

  return (
    <SceneShell unit={unit}>
      {/* 两个尺度 */}
      {branches.slice(-2).map((b, bi) => {
        const x = bi === 0 ? 110 : 1290;
        const glow = focus && focus.step.label.includes(b.name.slice(0, 2));
        return (
          <div key={b.name}>
            <div
              style={{
                position: 'absolute',
                left: x,
                top: 190,
                width: 520,
                boxSizing: 'border-box',
                borderRadius: 22,
                padding: '20px 24px',
                background: COLORS.white,
                border: `2.5px solid ${glow ? COLORS.coral : '#D8DED4'}`,
                boxShadow: glow ? '0 0 0 8px rgba(217,103,78,0.14)' : '0 18px 48px rgba(24,48,45,0.07)',
                opacity: b.r,
              }}
            >
              <div style={{fontSize: 34, fontWeight: 800, color: COLORS.ink}}>{b.name}</div>
              <div style={{fontSize: 22, fontWeight: 700, color: COLORS.green, marginTop: 4}}>{b.sub}</div>
              <div style={{marginTop: 14, position: 'relative', minHeight: 150}}>
                {b.items.slice(-3).map((it, i) => (
                  <div
                    key={`${it.unitId}-${i}`}
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: COLORS.inkSoft,
                      background: '#F1F5EE',
                      borderRadius: 10,
                      padding: '8px 14px',
                      marginBottom: 8,
                      opacity: it.r,
                      transform: `translateX(${(1 - it.r) * 16}px)`,
                    }}
                  >
                    · {it.step.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {/* 连接线 + 流动数据包 */}
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
        <line x1="640" y1="300" x2="1280" y2="300" stroke={COLORS.green} strokeWidth="3" opacity="0.35" />
        <circle cx={px} cy="300" r="10" fill={COLORS.green} />
        <circle cx={px} cy="300" r="18" fill={COLORS.green} opacity="0.18" />
      </svg>

      {/* 共用底层技术 */}
      <div style={{position: 'absolute', left: 700, top: 372, width: 520}}>
        <div style={{fontSize: 21, fontWeight: 800, color: COLORS.inkSoft, marginBottom: 8}}>共用底层技术</div>
        {shared.map((s, i) => (
          <Chip key={`${s.unitId}-sh-${i}`} x={0} y={44 + i * 52} r={s.r} label={s.step.label} bg={COLORS.green} />
        ))}
      </div>

      {/* 三个共同的麻烦 */}
      <div style={{position: 'absolute', left: 110, top: 520, width: 1700}}>
        <div style={{fontSize: 21, fontWeight: 800, color: COLORS.danger, marginBottom: 10}}>共同的麻烦</div>
        <div style={{display: 'flex', gap: 20}}>
          {trouble.map((s, i) => (
            <div key={`${s.unitId}-tb-${i}`} style={{position: 'relative'}}>
              <Chip flow x={0} y={0} r={s.r} label={s.step.label} bg={COLORS.danger} fontSize={24} />
            </div>
          ))}
        </div>
      </div>

      {/* 本章路线 */}
      <div style={{position: 'absolute', left: 110, top: 660, width: 1700}}>
        <div style={{fontSize: 21, fontWeight: 800, color: COLORS.inkSoft, marginBottom: 10}}>本章路线</div>
        {route.map((s, i) => (
          <div key={`${s.unitId}-rt-${i}`} style={{position: 'relative'}}>
            <Item
              x={i * 560}
              y={0}
              w={520}
              r={s.r}
              color={i === 0 ? COLORS.coral : COLORS.inkSoft}
              fontSize={26}
            >
              <span style={{color: COLORS.green, marginRight: 10}}>{s.step.v}</span>
              {s.step.label}
            </Item>
          </div>
        ))}
      </div>

      {notes.map((s, i) => (
        <TextReveal
          key={`${s.unitId}-nt-${i}`}
          text={s.step.label}
          x={110}
          y={800 + i * 44}
          w={1200}
          r={s.r}
          size={26}
          color={COLORS.inkSoft}
        />
      ))}
    </SceneShell>
  );
};
