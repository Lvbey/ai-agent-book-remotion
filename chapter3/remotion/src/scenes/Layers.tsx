import React from 'react';
import {Unit} from '../data';
import {useSceneSteps, bucket, flowPhase} from '../clock';
import {SceneShell, Item, Chip, TextReveal} from '../components/ui';
import {COLORS, SEM} from '../theme';

// 记忆的层次结构：轨迹（append-only） / 用户长期记忆（可改写） / 业务状态
export const Layers: React.FC<{unit: Unit}> = ({unit}) => {
  const {steps, frame} = useSceneSteps(unit);

  const appends = bucket(steps, 'append', 7);
  const compress = bucket(steps, 'compress', 3);
  const writes = bucket(steps, 'write', 6);
  const reads = bucket(steps, 'read', 2);
  const states = bucket(steps, 'state', 4);
  const contrasts = bucket(steps, 'contrast', 2);
  const freezes = bucket(steps, 'freeze', 2);
  const dims = bucket(steps, 'dim', 3);
  const notes = bucket(steps, 'note', 3);

  // 写入头沿轨迹时间轴持续下移，代表事件不断追加
  const head = flowPhase(frame, 110);
  const headY = 250 + head * 300;

  return (
    <SceneShell unit={unit}>
      {/* 左：轨迹 append-only */}
      <div
        style={{
          position: 'absolute',
          left: 110,
          top: 168,
          width: 560,
          height: 520,
          boxSizing: 'border-box',
          borderRadius: 22,
          padding: 18,
          background: COLORS.white,
          border: `2px solid ${SEM.trajectory}`,
        }}
      >
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div style={{fontSize: 24, fontWeight: 800, color: SEM.trajectory}}>轨迹 Trajectory</div>
          <div style={{fontSize: 18, fontWeight: 800, color: COLORS.white, background: SEM.trajectory, borderRadius: 999, padding: '4px 12px'}}>
            append-only
          </div>
        </div>
        <div style={{position: 'relative', marginTop: 10}}>
          <div style={{position: 'absolute', left: 12, top: 0, bottom: 0, width: 3, background: '#DCE3DA'}} />
          <div style={{position: 'absolute', left: 6, top: headY - 250, width: 15, height: 15, borderRadius: 8, background: SEM.trajectory}} />
          {appends.slice(-6).map((s, i) => (
            <div
              key={`${s.unitId}-a-${i}`}
              style={{
                position: 'relative',
                marginLeft: 34,
                fontSize: 21,
                fontWeight: 700,
                color: COLORS.ink,
                background: '#F1F5EE',
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
        {freezes.map((s, i) => (
          <div
            key={`${s.unitId}-f-${i}`}
            style={{fontSize: 20, fontWeight: 800, color: SEM.trajectory, marginTop: 6, opacity: s.r}}
          >
            🔒 {s.step.label}
          </div>
        ))}
      </div>

      {/* 中：运行时上下文压缩 */}
      <div
        style={{
          position: 'absolute',
          left: 710,
          top: 168,
          width: 460,
          height: 520,
          boxSizing: 'border-box',
          borderRadius: 22,
          padding: 18,
          background: COLORS.white,
          border: '1.5px dashed #C9D2C9',
        }}
      >
        <div style={{fontSize: 24, fontWeight: 800, color: COLORS.ink, marginBottom: 8}}>运行时 Context</div>
        {/* 压缩动画：多条线周期性向中心收拢 */}
        <svg width="420" height="150" viewBox="0 0 420 150" style={{marginBottom: 8}}>
          {[0, 1, 2, 3, 4].map((i) => {
            const t = flowPhase(frame + i * 18, 100);
            const y = 20 + i * 26;
            const x = 30 + t * 300;
            return (
              <g key={i}>
                <line x1={30} y1={y} x2={390} y2={y} stroke="#E1E6DE" strokeWidth="2" />
                <rect x={x} y={y - 7} width={70 - t * 30} height={14} rx={5} fill={COLORS.blue} opacity={0.35 + 0.5 * (1 - t)} />
              </g>
            );
          })}
          <rect x="150" y="112" width="120" height="30" rx="8" fill={COLORS.blue} opacity="0.9" />
          <text x="210" y="132" fontSize="16" fontWeight="700" fill="#fff" textAnchor="middle">
            摘要 / 压缩结果
          </text>
        </svg>
        {compress.slice(-3).map((s, i) => (
          <div
            key={`${s.unitId}-cp-${i}`}
            style={{
              fontSize: 21,
              fontWeight: 700,
              color: COLORS.blue,
              background: 'rgba(90,124,168,0.10)',
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
        {dims.map((s, i) => (
          <div key={`${s.unitId}-d-${i}`} style={{fontSize: 20, fontWeight: 800, color: COLORS.inkSoft, opacity: s.r}}>
            【{s.step.label}】{s.step.v ? ` ← ${s.step.v}` : ''}
          </div>
        ))}
      </div>

      {/* 右：用户长期记忆（键值对 + 工具调用） */}
      <div
        style={{
          position: 'absolute',
          left: 1210,
          top: 168,
          width: 600,
          height: 520,
          boxSizing: 'border-box',
          borderRadius: 22,
          padding: 18,
          background: COLORS.white,
          border: `2px solid ${SEM.longTerm}`,
        }}
      >
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div style={{fontSize: 24, fontWeight: 800, color: SEM.longTerm}}>用户长期记忆（跨会话）</div>
          <div style={{fontSize: 18, fontWeight: 800, color: COLORS.white, background: SEM.longTerm, borderRadius: 999, padding: '4px 12px'}}>
            可改写 · 合并 · 淘汰
          </div>
        </div>
        {writes.slice(-6).map((s, i) => (
          <div
            key={`${s.unitId}-w-${i}`}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 21,
              fontWeight: 700,
              color: COLORS.ink,
              background: '#F1F5EE',
              borderLeft: `5px solid ${SEM.longTerm}`,
              borderRadius: 8,
              padding: '7px 12px',
              marginTop: 7,
              opacity: s.r,
              transform: `translateX(${(1 - s.r) * 16}px)`,
            }}
          >
            <span>{s.step.label}</span>
            <span style={{color: SEM.longTerm}}>{s.step.v}</span>
          </div>
        ))}
        {reads.map((s, i) => (
          <div
            key={`${s.unitId}-r-${i}`}
            style={{fontSize: 20, fontWeight: 800, color: COLORS.blue, marginTop: 8, opacity: s.r}}
          >
            ⚙ {s.step.label}
          </div>
        ))}
        {contrasts.map((s, i) => (
          <div
            key={`${s.unitId}-ct-${i}`}
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: s.step.v === 'longTerm' ? SEM.longTerm : SEM.trajectory,
              marginTop: 6,
              opacity: s.r,
            }}
          >
            {s.step.label}
          </div>
        ))}
      </div>

      {/* 底部：业务状态与注解 */}
      <div style={{position: 'absolute', left: 110, top: 712, width: 1700}}>
        <div style={{fontSize: 20, fontWeight: 800, color: COLORS.gold, marginBottom: 8}}>业务状态（开发者定义的高层抽象）</div>
        <div style={{display: 'flex', gap: 14}}>
          {states.map((s, i) => (
            <div key={`${s.unitId}-st-${i}`} style={{position: 'relative'}}>
              <Chip flow x={0} y={0} r={s.r} label={s.step.label} bg={COLORS.gold} color={COLORS.ink} fontSize={22} />
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
