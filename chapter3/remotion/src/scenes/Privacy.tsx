import React from 'react';
import {Unit} from '../data';
import {useSceneSteps, bucket, flowPhase} from '../clock';
import {SceneShell, Chip, MeterBar} from '../components/ui';
import {COLORS} from '../theme';

const SAMPLE = '用户：我叫张伟，身份证号 310101199003078765，我的密码是 abc123，住在北京市海淀区中关村大街 1 号。';

// 隐私保护：本地小模型 PII 检测与脱敏（实验 3-3）
export const Privacy: React.FC<{unit: Unit}> = ({unit}) => {
  const {steps, frame} = useSceneSteps(unit);

  const goals = bucket(steps, 'goal', 2);
  const locals = bucket(steps, 'local', 4);
  const detects = bucket(steps, 'detect', 4);
  const schemas = bucket(steps, 'schema', 3);
  const cmps = bucket(steps, 'cmp', 3);
  const hybrids = bucket(steps, 'hybrid', 2);
  const notes = bucket(steps, 'note', 3);

  // 扫描线：沿示例文本持续移动，代表正在逐段检测
  const scan = flowPhase(frame, 140);
  const scanX = 130 + scan * 620;

  const recall = cmps.length ? Math.min(0.96, cmps[cmps.length - 1].r * 0.96) : 0.4 + 0.3 * scan;

  return (
    <SceneShell unit={unit}>
      {/* 左：待脱敏文本 + 扫描 */}
      <div
        style={{
          position: 'absolute',
          left: 110,
          top: 168,
          width: 700,
          height: 250,
          boxSizing: 'border-box',
          borderRadius: 22,
          padding: 18,
          background: COLORS.white,
          border: '1.5px solid #D8DED4',
          overflow: 'hidden',
        }}
      >
        <div style={{fontSize: 22, fontWeight: 800, color: COLORS.inkSoft, marginBottom: 10}}>系统日志样本</div>
        <div style={{fontSize: 24, fontWeight: 700, lineHeight: 1.6, color: COLORS.ink}}>{SAMPLE}</div>
        <div
          style={{
            position: 'absolute',
            left: scanX,
            top: 50,
            width: 3,
            height: 170,
            background: `linear-gradient(180deg, rgba(183,79,66,0), ${COLORS.danger}, rgba(183,79,66,0))`,
          }}
        />
      </div>

      {/* 中：本地模型 */}
      <div
        style={{
          position: 'absolute',
          left: 850,
          top: 168,
          width: 460,
          height: 250,
          boxSizing: 'border-box',
          borderRadius: 22,
          padding: 18,
          background: COLORS.white,
          border: `2px solid ${COLORS.green}`,
        }}
      >
        <div style={{fontSize: 22, fontWeight: 800, color: COLORS.green, marginBottom: 8}}>本地闭环（不出网）</div>
        {locals.slice(-3).map((s, i) => (
          <div
            key={`${s.unitId}-l-${i}`}
            style={{
              fontSize: 21,
              fontWeight: 700,
              color: COLORS.ink,
              background: 'rgba(39,106,87,0.09)',
              borderLeft: `5px solid ${COLORS.green}`,
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

      {/* 右：JSON Schema 结构化输出 */}
      <div
        style={{
          position: 'absolute',
          left: 1350,
          top: 168,
          width: 460,
          height: 250,
          boxSizing: 'border-box',
          borderRadius: 22,
          padding: 18,
          background: '#1E2A26',
          color: '#E7F0EA',
          fontFamily: "ui-monospace, 'SFMono-Regular', Consolas, monospace",
        }}
      >
        <div style={{fontSize: 21, fontWeight: 800, color: COLORS.greenBright, marginBottom: 10}}>JSON Schema 输出</div>
        {schemas.slice(-3).map((s, i) => (
          <div
            key={`${s.unitId}-s-${i}`}
            style={{fontSize: 20, fontWeight: 700, marginBottom: 7, opacity: s.r, transform: `translateX(${(1 - s.r) * 14}px)`}}
          >
            {s.step.label}
          </div>
        ))}
      </div>

      {/* 中部：识别到的 PII 类型 */}
      <div style={{position: 'absolute', left: 110, top: 446, width: 700}}>
        <div style={{fontSize: 20, fontWeight: 800, color: COLORS.danger, marginBottom: 8}}>识别到的敏感信息</div>
        <div style={{display: 'flex', gap: 10, flexWrap: 'wrap'}}>
          {detects.slice(-4).map((s, i) => (
            <div key={`${s.unitId}-d-${i}`} style={{position: 'relative'}}>
              <Chip
                flow
                x={0}
                y={0}
                r={s.r}
                label={s.step.label}
                bg={s.step.v === 'structured' ? COLORS.danger : s.step.v === 'semi' ? COLORS.gold : COLORS.coral}
                color={s.step.v === 'semi' ? COLORS.ink : COLORS.white}
                fontSize={20}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 中右：召回率与对比 */}
      <div style={{position: 'absolute', left: 850, top: 446, width: 460}}>
        <div style={{position: 'relative', height: 96}}>
          <MeterBar x={0} y={4} w={420} h={26} r={recall} color={COLORS.green} label="脱敏召回率（原文报告）" value={`${(recall * 100).toFixed(0)}%`} />
        </div>
        {cmps.slice(-3).map((s, i) => (
          <div
            key={`${s.unitId}-c-${i}`}
            style={{
              marginTop: 8,
              fontSize: 20,
              fontWeight: 700,
              color: COLORS.ink,
              background: COLORS.white,
              borderLeft: `5px solid ${COLORS.green}`,
              borderRadius: 8,
              padding: '7px 12px',
              opacity: s.r,
            }}
          >
            {s.step.label}
          </div>
        ))}
      </div>

      {/* 底部：混合策略与目标 */}
      <div style={{position: 'absolute', left: 110, top: 700, width: 1700}}>
        <div style={{display: 'flex', gap: 30}}>
          <div style={{flex: 1}}>
            <div style={{fontSize: 20, fontWeight: 800, color: COLORS.inkSoft, marginBottom: 8}}>核心目标</div>
            {goals.slice(-2).map((s, i) => (
              <div
                key={`${s.unitId}-g-${i}`}
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
            <div style={{fontSize: 20, fontWeight: 800, color: COLORS.blue, marginBottom: 8}}>超高吞吐混合策略</div>
            {hybrids.slice(-2).map((s, i) => (
              <div
                key={`${s.unitId}-h-${i}`}
                style={{
                  fontSize: 21,
                  fontWeight: 700,
                  color: COLORS.ink,
                  background: 'rgba(90,124,168,0.10)',
                  borderLeft: `5px solid ${COLORS.blue}`,
                  borderRadius: 10,
                  padding: '9px 14px',
                  marginBottom: 7,
                  opacity: s.r,
                  transform: `translateX(${(1 - s.r) * 14}px)`,
                }}
              >
                {`${i + 1}. ${s.step.label}`}
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
