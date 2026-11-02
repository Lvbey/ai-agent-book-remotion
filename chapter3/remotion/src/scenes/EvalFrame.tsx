import React from 'react';
import {useCurrentFrame, interpolate} from 'remotion';
import {Unit} from '../data';
import {useSceneSteps, bucket, flowPhase} from '../clock';
import {SceneShell, Item, Chip, TextReveal, MeterBar} from '../components/ui';
import {COLORS} from '../theme';

// 三层次评估框架：八项能力 + 三级递进 + 实验 3-1 的评估流程
export const EvalFrame: React.FC<{unit: Unit}> = ({unit}) => {
  const {steps, frame} = useSceneSteps(unit);
  const abilities = bucket(steps, 'ability', 8);
  const layers = bucket(steps, 'layer', 3);
  const cases = bucket(steps, 'case', 4);
  const exps = bucket(steps, 'exp', 4);
  const scores = bucket(steps, 'score', 1);
  const stats = bucket(steps, 'stat', 3);
  const tasks = bucket(steps, 'task', 5);
  const benches = bucket(steps, 'bench', 1);
  const notes = bucket(steps, 'note', 2);
  const axes = bucket(steps, 'axis', 1);
  const axisV = axes.length ? Number(axes[0].step.v ?? 0.3) : (layers.length ? layers[layers.length - 1].r : 0.2);

  // 评委扫描光束：始终在动，代表 LLM-as-a-judge 正在逐条比对
  const beam = flowPhase(frame, 150);
  const beamY = 168 + beam * 560;

  const LAYER_META = [
    {n: 1, name: '第一层 · 基础回忆', c: COLORS.green},
    {n: 2, name: '第二层 · 多会话检索', c: COLORS.gold},
    {n: 3, name: '第三层 · 主动服务', c: COLORS.coral},
  ];
  const activeLayer = layers.length ? Number(layers[layers.length - 1].step.v ?? '1') : 1;

  return (
    <SceneShell unit={unit}>
      {/* 左：八项能力 */}
      <div
        style={{
          position: 'absolute',
          left: 110,
          top: 168,
          width: 640,
          height: 400,
          boxSizing: 'border-box',
          borderRadius: 22,
          padding: 18,
          background: COLORS.white,
          border: '1.5px solid #D8DED4',
        }}
      >
        <div style={{fontSize: 23, fontWeight: 800, marginBottom: 10, color: COLORS.ink}}>
          八项记忆能力（笔者归纳口径）
        </div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10}}>
          {Array.from({length: 8}).map((_, i) => {
            const a = abilities[i];
            const on = !!a;
            const r = a ? a.r : 0;
            return (
              <div
                key={i}
                style={{
                  borderRadius: 10,
                  padding: '8px 12px',
                  background: on ? `rgba(39,106,87,${0.08 + 0.14 * r})` : '#F1F5EE',
                  border: `1.5px solid ${on ? COLORS.green : '#E1E6DE'}`,
                  opacity: on ? 0.35 + 0.65 * r : 0.35,
                  transform: `scale(${on ? 0.97 + 0.03 * r : 1})`,
                }}
              >
                <div style={{fontSize: 21, fontWeight: 800, color: on ? COLORS.ink : COLORS.muted}}>
                  {a ? a.step.label : `—`}
                </div>
                {a?.step.v ? (
                  <div style={{fontSize: 17, fontWeight: 600, color: COLORS.inkSoft, marginTop: 2}}>{a.step.v}</div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* 中：三层次递进 */}
      <div
        style={{
          position: 'absolute',
          left: 790,
          top: 168,
          width: 520,
          height: 400,
          boxSizing: 'border-box',
          borderRadius: 22,
          padding: 18,
          background: COLORS.white,
          border: '1.5px solid #D8DED4',
        }}
      >
        <div style={{fontSize: 23, fontWeight: 800, marginBottom: 12, color: COLORS.ink}}>三层次评估框架</div>
        {LAYER_META.map((L, i) => {
          const isActive = activeLayer >= L.n;
          const fill = isActive ? Math.max(0.25, axisV * (1 - i * 0.12)) : 0.06;
          const highlight = activeLayer === L.n;
          return (
            <div key={L.n} style={{marginBottom: 14}}>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 21, fontWeight: 800, color: highlight ? L.c : COLORS.inkSoft}}>
                <span>{L.name}</span>
                <span>{Math.round(fill * 100)}%</span>
              </div>
              <div style={{height: 16, borderRadius: 8, background: '#E3E8E1', overflow: 'hidden', marginTop: 4}}>
                <div
                  style={{
                    width: `${fill * 100}%`,
                    height: '100%',
                    background: L.c,
                    borderRadius: 8,
                    boxShadow: highlight ? `0 0 14px ${L.c}` : 'none',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 右：案例 / 实验流程（带评委扫描光束） */}
      <div
        style={{
          position: 'absolute',
          left: 1350,
          top: 168,
          width: 460,
          height: 560,
          boxSizing: 'border-box',
          borderRadius: 22,
          padding: 18,
          background: COLORS.white,
          border: '1.5px solid #D8DED4',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: beamY - 168,
            height: 3,
            background: `linear-gradient(90deg, rgba(231,180,78,0), ${COLORS.gold}, rgba(231,180,78,0))`,
          }}
        />
        <div style={{fontSize: 23, fontWeight: 800, marginBottom: 10, color: COLORS.ink}}>案例 / 实验流程</div>
        {[...cases, ...exps].slice(-8).map((s, i) => (
          <div
            key={`${s.unitId}-c-${i}`}
            style={{
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
            {s.step.v ? <span style={{color: COLORS.blue, marginLeft: 8}}>（{s.step.v}）</span> : null}
          </div>
        ))}
      </div>

      {/* 底部左：LoCoMo 基准 */}
      <div style={{position: 'absolute', left: 110, top: 600, width: 640}}>
        <div style={{fontSize: 20, fontWeight: 800, color: COLORS.inkSoft, marginBottom: 8}}>基准与规模</div>
        {benches.map((s, i) => (
          <div key={`${s.unitId}-b-${i}`} style={{fontSize: 22, fontWeight: 800, color: COLORS.ink, opacity: s.r}}>
            {s.step.label}
          </div>
        ))}
        {stats.map((s, i) => (
          <div key={`${s.unitId}-s-${i}`} style={{position: 'relative', height: 52}}>
            <MeterBar
              x={0}
              y={0}
              w={420}
              h={14}
              r={s.r}
              color={COLORS.blue}
              label={s.step.label}
              value={s.step.v}
            />
          </div>
        ))}
        <div style={{display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4}}>
          {tasks.map((s, i) => (
            <div key={`${s.unitId}-t-${i}`} style={{position: 'relative'}}>
              <Chip flow x={0} y={0} r={s.r} label={s.step.label} bg={COLORS.blue} fontSize={19} />
            </div>
          ))}
        </div>
      </div>

      {/* 底部中：评分与注解 */}
      <div style={{position: 'absolute', left: 790, top: 600, width: 520}}>
        {scores.map((s, i) => (
          <div key={`${s.unitId}-sc-${i}`} style={{position: 'relative', height: 66}}>
            <Item x={0} y={0} w={500} r={s.r} color={COLORS.coral} fontSize={24}>
              {s.step.label}
            </Item>
          </div>
        ))}
        <div style={{display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8}}>
          {notes.slice(-4).map((s, i) => (
            <div key={`${s.unitId}-n-${i}`} style={{position: 'relative'}}>
              <Chip flow x={0} y={0} r={s.r} label={s.step.label} bg={COLORS.inkSoft} fontSize={19} />
            </div>
          ))}
        </div>
      </div>
    </SceneShell>
  );
};
