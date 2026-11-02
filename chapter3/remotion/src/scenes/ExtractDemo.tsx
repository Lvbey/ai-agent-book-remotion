import React from 'react';
import {Unit} from '../data';
import {useSceneSteps, bucket, flowPhase} from '../clock';
import {SceneShell, Item, Chip, TextReveal} from '../components/ui';
import {COLORS} from '../theme';

const WHO_COLOR: Record<string, string> = {
  user: COLORS.green,
  agent: COLORS.blue,
  tool: COLORS.gold,
};
const WHO_LABEL: Record<string, string> = {user: 'User', agent: 'Agent', tool: 'Tool'};

// 记忆提取流水线：对话 → 额外 LLM 调用 → 结构化记忆，外加选择性/抽象化/结构化三条规则
export const ExtractDemo: React.FC<{unit: Unit}> = ({unit}) => {
  const {steps, frame} = useSceneSteps(unit);

  const dialog = bucket(steps, 'dialog', 6);
  const extracts = bucket(steps, 'extract', 6);
  const pipes = bucket(steps, 'pipe', 3);
  const drops = bucket(steps, 'drop', 3);
  const abstracts = bucket(steps, 'abstract', 2);
  const structs = bucket(steps, 'struct', 3);
  const notes = bucket(steps, 'note', 2);

  const flow = flowPhase(frame, 100);
  const scanY = 210 + flow * 120;

  return (
    <SceneShell unit={unit}>
      {/* 左：原始对话 */}
      <div
        style={{
          position: 'absolute',
          left: 110,
          top: 168,
          width: 540,
          height: 470,
          boxSizing: 'border-box',
          borderRadius: 22,
          padding: 20,
          background: COLORS.white,
          border: '1.5px solid #D8DED4',
        }}
      >
        <div style={{fontSize: 24, fontWeight: 800, marginBottom: 12, color: COLORS.ink}}>原始对话</div>
        {dialog.slice(-5).map((s, i) => {
          const who = s.step.who ?? 'user';
          return (
            <div
              key={`${s.unitId}-d-${i}`}
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: COLORS.ink,
                background: '#F1F5EE',
                borderLeft: `5px solid ${WHO_COLOR[who]}`,
                borderRadius: 8,
                padding: '8px 14px',
                marginBottom: 8,
                opacity: s.r,
                transform: `translateX(${(1 - s.r) * 18}px)`,
              }}
            >
              <span style={{color: WHO_COLOR[who], marginRight: 10}}>{WHO_LABEL[who]}</span>
              {s.step.label}
            </div>
          );
        })}
      </div>

      {/* 中：提取流程（连续扫描） */}
      <div
        style={{
          position: 'absolute',
          left: 700,
          top: 168,
          width: 420,
          height: 470,
          boxSizing: 'border-box',
          borderRadius: 22,
          padding: 20,
          background: COLORS.white,
          border: `2px solid ${COLORS.green}`,
          overflow: 'hidden',
        }}
      >
        <div style={{fontSize: 24, fontWeight: 800, marginBottom: 12, color: COLORS.green}}>额外 LLM 调用</div>
        {/* 扫描光带：始终在动，代表正在逐句分析；用柔和光带避免穿过文字时像删除线 */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: scanY - 22,
            height: 44,
            background: `linear-gradient(180deg, rgba(90,168,139,0), rgba(90,168,139,0.16), rgba(90,168,139,0))`,
          }}
        />
        {pipes.map((s, i) => (
          <div
            key={`${s.unitId}-p-${i}`}
            style={{
              fontSize: 23,
              fontWeight: 700,
              color: COLORS.ink,
              padding: '10px 0',
              borderBottom: '1px dashed #D8DED4',
              opacity: s.r,
              transform: `translateY(${(1 - s.r) * 12}px)`,
            }}
          >
            {s.step.label}
          </div>
        ))}
      </div>

      {/* 右：提取出的记忆 */}
      <div
        style={{
          position: 'absolute',
          left: 1170,
          top: 168,
          width: 640,
          height: 470,
          boxSizing: 'border-box',
          borderRadius: 22,
          padding: 20,
          background: COLORS.white,
          border: '1.5px solid #D8DED4',
        }}
      >
        <div style={{fontSize: 24, fontWeight: 800, marginBottom: 12, color: COLORS.ink}}>长期记忆（结构化）</div>
        {extracts.slice(-6).map((s, i) => (
          <div
            key={`${s.unitId}-e-${i}`}
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: COLORS.ink,
              background: '#F1F5EE',
              borderRadius: 10,
              padding: '9px 14px',
              marginBottom: 8,
              opacity: s.r,
              transform: `translateX(${(1 - s.r) * 20}px)`,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>{s.step.label}</span>
            <span style={{color: COLORS.green, fontSize: 19}}>{s.step.v}</span>
          </div>
        ))}
      </div>

      {/* 底部：三条规则的可视化 */}
      <div style={{position: 'absolute', left: 110, top: 672, width: 540}}>
        <div style={{fontSize: 20, fontWeight: 800, color: COLORS.danger, marginBottom: 8}}>选择性 · 丢弃</div>
        {drops.slice(-2).map((s, i) => (
          <div
            key={`${s.unitId}-dr-${i}`}
            style={{
              fontSize: 21,
              fontWeight: 700,
              color: COLORS.muted,
              textDecoration: 'line-through',
              opacity: s.r * 0.9,
            }}
          >
            {s.step.label}
          </div>
        ))}
      </div>

      <div style={{position: 'absolute', left: 700, top: 672, width: 420}}>
        <div style={{fontSize: 20, fontWeight: 800, color: COLORS.green, marginBottom: 8}}>抽象化</div>
        {abstracts.map((s, i) => (
          <div
            key={`${s.unitId}-ab-${i}`}
            style={{
              fontSize: 21,
              fontWeight: 700,
              color: i === 0 ? COLORS.inkSoft : COLORS.green,
              opacity: s.r,
              transform: `translateY(${(1 - s.r) * 10}px)`,
            }}
          >
            {i === 0 ? `${s.step.label}  →` : `✔ ${s.step.label}`}
          </div>
        ))}
      </div>

      <div style={{position: 'absolute', left: 1170, top: 672, width: 640}}>
        <div style={{fontSize: 20, fontWeight: 800, color: COLORS.blue, marginBottom: 8}}>结构化字段</div>
        <div style={{display: 'flex', gap: 12}}>
          {structs.map((s, i) => (
            <div key={`${s.unitId}-st-${i}`} style={{position: 'relative'}}>
              <Chip flow x={0} y={0} r={s.r} label={s.step.label} bg={COLORS.blue} fontSize={21} />
            </div>
          ))}
        </div>
      </div>

      {notes.map((s, i) => (
        <TextReveal
          key={`${s.unitId}-n-${i}`}
          text={s.step.label}
          x={110}
          y={632 - i * 0}
          w={700}
          r={s.r * 0.9}
          size={22}
          color={COLORS.green}
        />
      ))}
    </SceneShell>
  );
};
