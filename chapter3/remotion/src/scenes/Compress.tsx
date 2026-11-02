import React from 'react';
import {Unit} from '../data';
import {useSceneSteps, bucket, flowPhase} from '../clock';
import {SceneShell, Chip, MeterBar} from '../components/ui';
import {COLORS} from '../theme';

// 记忆压缩与整理：重要性评分 → 聚类摘要 → 抽象泛化
export const Compress: React.FC<{unit: Unit}> = ({unit}) => {
  const {steps, frame} = useSceneSteps(unit);

  const grows = bucket(steps, 'grow', 2);
  const factors = bucket(steps, 'factor', 5);
  const scores = bucket(steps, 'score', 5);
  const clusters = bucket(steps, 'cluster', 3);
  const lifts = bucket(steps, 'lift', 2);
  const notes = bucket(steps, 'note', 3);

  const targetCount = grows.length ? Number(grows[grows.length - 1].step.v ?? 120) : 120;
  const flow = flowPhase(frame, 90);
  // 点阵数量连续逼近目标值，保证每秒都在变化
  const shown = Math.round(targetCount * Math.min(1, (frame % 90) / 60 + 0.45));

  const FACTOR_COLORS = [COLORS.green, COLORS.blue, COLORS.coral, COLORS.gold];

  return (
    <SceneShell unit={unit}>
      {/* 左：记忆库膨胀 */}
      <div
        style={{
          position: 'absolute',
          left: 110,
          top: 168,
          width: 520,
          height: 430,
          boxSizing: 'border-box',
          borderRadius: 22,
          padding: 18,
          background: COLORS.white,
          border: '1.5px solid #D8DED4',
        }}
      >
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
          <div style={{fontSize: 23, fontWeight: 800, color: COLORS.ink}}>记忆库规模</div>
          <div style={{fontSize: 28, fontWeight: 800, color: COLORS.danger}}>{shown} 条</div>
        </div>
        <div style={{marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 5}}>
          {Array.from({length: Math.min(240, shown)}).map((_, i) => (
            <div
              key={i}
              style={{
                width: 9,
                height: 9,
                borderRadius: 5,
                background: i < shown * 0.2 ? COLORS.danger : COLORS.greenBright,
                opacity: 0.35 + 0.65 * ((i % 7) === Math.floor(flow * 7) ? 1 : 0.4),
              }}
            />
          ))}
        </div>
      </div>

      {/* 中：重要性评分四因素 */}
      <div
        style={{
          position: 'absolute',
          left: 670,
          top: 168,
          width: 560,
          height: 430,
          boxSizing: 'border-box',
          borderRadius: 22,
          padding: 18,
          background: COLORS.white,
          border: `2px solid ${COLORS.green}`,
        }}
      >
        <div style={{fontSize: 23, fontWeight: 800, color: COLORS.green, marginBottom: 12}}>第一层 · 重要性评分</div>
        {factors.slice(-4).map((s, i) => (
          <div key={`${s.unitId}-f-${i}`} style={{position: 'relative', height: 62}}>
            <MeterBar
              x={0}
              y={0}
              w={420}
              h={16}
              r={s.r}
              color={FACTOR_COLORS[i % 4]}
              label={s.step.label}
            />
          </div>
        ))}
        <div
          style={{
            marginTop: 6,
            fontSize: 19,
            fontWeight: 800,
            color: COLORS.danger,
            borderTop: `2px dashed ${COLORS.danger}`,
            paddingTop: 6,
          }}
        >
          低于阈值 → 标记为「可压缩 / 可删除」
        </div>
      </div>

      {/* 右：评分示例 */}
      <div
        style={{
          position: 'absolute',
          left: 1270,
          top: 168,
          width: 540,
          height: 430,
          boxSizing: 'border-box',
          borderRadius: 22,
          padding: 18,
          background: COLORS.white,
          border: '1.5px solid #D8DED4',
        }}
      >
        <div style={{fontSize: 23, fontWeight: 800, color: COLORS.ink, marginBottom: 10}}>评分示例</div>
        {scores.slice(-5).map((s, i) => {
          const high = s.step.v === 'high';
          const c = high ? COLORS.green : s.step.v === 'threshold' ? COLORS.gold : COLORS.danger;
          return (
            <div
              key={`${s.unitId}-s-${i}`}
              style={{
                fontSize: 21,
                fontWeight: 700,
                color: COLORS.ink,
                background: high ? 'rgba(39,106,87,0.10)' : 'rgba(183,79,66,0.09)',
                borderLeft: `5px solid ${c}`,
                borderRadius: 8,
                padding: '7px 12px',
                marginBottom: 7,
                opacity: s.r,
                transform: `translateX(${(1 - s.r) * 16}px)`,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>{s.step.label}</span>
              <span style={{color: c, fontWeight: 800}}>{high ? '保留' : s.step.v === 'threshold' ? '阈值' : '压缩'}</span>
            </div>
          );
        })}
      </div>

      {/* 底部：聚类与抽象泛化 */}
      <div style={{position: 'absolute', left: 110, top: 626, width: 1700}}>
        <div style={{display: 'flex', gap: 30}}>
          <div style={{flex: 1}}>
            <div style={{fontSize: 20, fontWeight: 800, color: COLORS.green, marginBottom: 8}}>第二层 · 聚类与代表性摘要</div>
            {clusters.slice(-2).map((s, i) => (
              <div
                key={`${s.unitId}-c-${i}`}
                style={{
                  fontSize: 21,
                  fontWeight: 700,
                  color: COLORS.ink,
                  background: COLORS.white,
                  border: '1.5px solid #D8DED4',
                  borderRadius: 10,
                  padding: '9px 14px',
                  marginBottom: 7,
                  opacity: s.r,
                  transform: `translateY(${(1 - s.r) * 12}px)`,
                }}
              >
                {s.step.label}
              </div>
            ))}
          </div>
          <div style={{flex: 1}}>
            <div style={{fontSize: 20, fontWeight: 800, color: COLORS.coral, marginBottom: 8}}>第三层 · 抽象与泛化</div>
            {lifts.slice(-2).map((s, i) => (
              <div
                key={`${s.unitId}-l-${i}`}
                style={{
                  fontSize: 21,
                  fontWeight: 700,
                  color: COLORS.ink,
                  background: COLORS.white,
                  border: `1.5px solid ${COLORS.coral}`,
                  borderRadius: 10,
                  padding: '9px 14px',
                  marginBottom: 7,
                  opacity: s.r,
                  transform: `translateY(${(1 - s.r) * 12}px)`,
                }}
              >
                {i === 0 ? `${s.step.label}  →` : `✔ ${s.step.label}`}
              </div>
            ))}
          </div>
        </div>
        <div style={{display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12}}>
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
