import React from 'react';
import {useCurrentFrame, interpolate} from 'remotion';
import {Unit} from '../data';
import {useSceneSteps, bucket, flowPhase} from '../clock';
import {SceneShell, Item, Chip, TextReveal} from '../components/ui';
import {COLORS} from '../theme';

const FORMATS = [
  {id: 'simple', name: 'Simple Notes', desc: '最小不可再分事实'},
  {id: 'enhanced', name: 'Enhanced Notes', desc: '完整上下文段落'},
  {id: 'json', name: 'JSON Cards', desc: '类别→子类别→键值'},
  {id: 'advanced', name: 'Advanced JSON', desc: '+backstory/person/relationship'},
];

// 四种存储格式：递进轴 + 当前格式卡片 + 优劣对照 + 实验 3-2 观察
export const Formats: React.FC<{unit: Unit}> = ({unit}) => {
  const {steps, frame, p} = useSceneSteps(unit);
  const local = frame - unit.start;

  const formatSteps = bucket(steps, 'format', 0);
  const active = formatSteps.length ? formatSteps[formatSteps.length - 1].step.v : 'simple';
  const activeIdx = Math.max(0, FORMATS.findIndex((f) => f.id === active));
  const prevIdx = Math.max(0, formatSteps.length > 1 ? FORMATS.findIndex((f) => f.id === formatSteps[formatSteps.length - 2].step.v) : 0);
  const slide = interpolate(local, [0, 26], [prevIdx, activeIdx], {extrapolateRight: 'clamp'});
  const nodeX = (i: number) => 200 + i * 400;

  const atoms = bucket(steps, 'atom', 3);
  const paras = bucket(steps, 'para', 2);
  const paths = bucket(steps, 'path', 4);
  const metas = bucket(steps, 'meta', 5);
  const pros = bucket(steps, 'pro', 4);
  const cons = bucket(steps, 'con', 5);
  const splits = bucket(steps, 'split', 3);
  const ambigs = bucket(steps, 'ambig', 2);
  const cases = bucket(steps, 'case', 3);
  const chooses = bucket(steps, 'choose', 2);
  const exps = bucket(steps, 'exp', 3);
  const notes = bucket(steps, 'note', 3);
  const axes = bucket(steps, 'axis', 2);
  const axisV = axes.length ? Number(axes[axes.length - 1].step.v ?? 0.5) : 0.5;

  const pulse = flowPhase(frame, 130);

  return (
    <SceneShell unit={unit}>
      {/* 顶部：递进轴 */}
      <div style={{position: 'absolute', left: 110, top: 176, width: 1700}}>
        <svg width="1700" height="120" viewBox="0 0 1700 120">
          <line x1="200" y1="60" x2="1500" y2="60" stroke="#D8DED4" strokeWidth="4" />
          <line x1="200" y1="60" x2={200 + axisV * 1300} y2="60" stroke={COLORS.green} strokeWidth="4" />
          {FORMATS.map((f, i) => {
            const on = i === activeIdx;
            return (
              <g key={f.id}>
                <circle cx={nodeX(i)} cy="60" r={on ? 17 : 12} fill={on ? COLORS.coral : COLORS.white} stroke={on ? COLORS.coral : '#B9C4B6'} strokeWidth="3" />
                <text x={nodeX(i)} y="104" fontSize="21" fontWeight="800" fill={on ? COLORS.coral : COLORS.inkSoft} textAnchor="middle">
                  {f.name}
                </text>
              </g>
            );
          })}
          {/* 滑块：随当前讲解对象连续移动 */}
          <circle cx={nodeX(slide) + (nodeX(Math.min(3, Math.floor(slide) + 1)) - nodeX(slide)) * (slide % 1)} cy="60" r="26" fill={COLORS.coral} opacity="0.16" />
          <text x="200" y="30" fontSize="18" fontWeight="700" fill={COLORS.inkSoft}>简单性</text>
          <text x="1500" y="30" fontSize="18" fontWeight="700" fill={COLORS.inkSoft} textAnchor="end">表达力</text>
          {/* 轴上的流动光点 */}
          <circle cx={200 + pulse * 1300} cy="60" r="5" fill={COLORS.green} />
        </svg>
      </div>

      {/* 中左：当前格式的表示形态 */}
      <div
        style={{
          position: 'absolute',
          left: 110,
          top: 320,
          width: 700,
          height: 330,
          boxSizing: 'border-box',
          borderRadius: 22,
          padding: 18,
          background: COLORS.white,
          border: `2px solid ${COLORS.coral}`,
        }}
      >
        <div style={{fontSize: 24, fontWeight: 800, color: COLORS.coral, marginBottom: 10}}>
          {FORMATS[activeIdx].name} · {FORMATS[activeIdx].desc}
        </div>
        {[...atoms, ...paras, ...paths, ...metas].slice(-6).map((s, i) => (
          <div
            key={`${s.unitId}-m-${i}`}
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: COLORS.ink,
              background: '#F1F5EE',
              borderRadius: 8,
              padding: '5px 12px',
              marginBottom: 5,
              opacity: s.r,
              transform: `translateX(${(1 - s.r) * 16}px)`,
            }}
          >
            {s.step.label}
          </div>
        ))}
      </div>

      {/* 中右：优势 / 代价 */}
      <div style={{position: 'absolute', left: 850, top: 320, width: 960}}>
        <div style={{display: 'flex', gap: 20}}>
          <div style={{flex: 1}}>
            <div style={{fontSize: 20, fontWeight: 800, color: COLORS.green, marginBottom: 8}}>✓ 优势</div>
            {pros.slice(-4).map((s, i) => (
              <div
                key={`${s.unitId}-pr-${i}`}
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: COLORS.ink,
                  background: 'rgba(39,106,87,0.10)',
                  borderLeft: `5px solid ${COLORS.green}`,
                  borderRadius: 8,
                  padding: '7px 12px',
                  marginBottom: 6,
                  opacity: s.r,
                  transform: `translateX(${(1 - s.r) * 14}px)`,
                }}
              >
                {s.step.label}
              </div>
            ))}
          </div>
          <div style={{flex: 1}}>
            <div style={{fontSize: 20, fontWeight: 800, color: COLORS.danger, marginBottom: 8}}>✗ 代价 / 风险</div>
            {cons.slice(-4).map((s, i) => (
              <div
                key={`${s.unitId}-cn-${i}`}
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: COLORS.ink,
                  background: 'rgba(183,79,66,0.09)',
                  borderLeft: `5px solid ${COLORS.danger}`,
                  borderRadius: 8,
                  padding: '7px 12px',
                  marginBottom: 6,
                  opacity: s.r,
                  transform: `translateX(${(1 - s.r) * 14}px)`,
                }}
              >
                {s.step.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 底部：拆分示例 / 消歧 / 案例 */}
      <div style={{position: 'absolute', left: 110, top: 672, width: 700}}>
        <div style={{fontSize: 19, fontWeight: 800, color: COLORS.danger, marginBottom: 6}}>关联性丢失示例</div>
        <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
          {splits.map((s, i) => (
            <div key={`${s.unitId}-sp-${i}`} style={{position: 'relative'}}>
              <Chip flow x={0} y={0} r={s.r} label={s.step.label} bg={COLORS.danger} fontSize={19} />
            </div>
          ))}
          {ambigs.map((s, i) => (
            <div key={`${s.unitId}-am-${i}`} style={{position: 'relative'}}>
              <Chip flow x={0} y={0} r={s.r} label={s.step.label} bg={COLORS.gold} color={COLORS.ink} fontSize={19} />
            </div>
          ))}
        </div>
        <div style={{display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8}}>
          {cases.map((s, i) => (
            <div key={`${s.unitId}-cs-${i}`} style={{position: 'relative'}}>
              <Chip flow x={0} y={0} r={s.r} label={s.step.label} bg={COLORS.blue} fontSize={19} />
            </div>
          ))}
        </div>
      </div>

      {/* 底部右：选择标准与实验观察 */}
      <div style={{position: 'absolute', left: 850, top: 672, width: 960}}>
        <div style={{display: 'flex', gap: 10, flexWrap: 'wrap'}}>
          {chooses.map((s, i) => (
            <div key={`${s.unitId}-ch-${i}`} style={{position: 'relative'}}>
              <Chip flow x={0} y={0} r={s.r} label={`${s.step.label} → ${s.step.v}`} bg={COLORS.green} fontSize={19} />
            </div>
          ))}
          {exps.map((s, i) => (
            <div key={`${s.unitId}-ex-${i}`} style={{position: 'relative'}}>
              <Chip flow x={0} y={0} r={s.r} label={s.step.label} bg={COLORS.inkSoft} fontSize={19} />
            </div>
          ))}
          {notes.slice(-2).map((s, i) => (
            <div key={`${s.unitId}-no-${i}`} style={{position: 'relative'}}>
              <Chip flow x={0} y={0} r={s.r} label={s.step.label} bg={COLORS.gold} color={COLORS.ink} fontSize={19} />
            </div>
          ))}
        </div>
      </div>
    </SceneShell>
  );
};
