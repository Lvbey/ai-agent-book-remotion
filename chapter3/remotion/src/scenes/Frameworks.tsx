import React from 'react';
import {Unit} from '../data';
import {useSceneSteps, bucket, flowPhase, SceneStep} from '../clock';
import {SceneShell, Chip, MeterBar, TextReveal} from '../components/ui';
import {COLORS, SEM} from '../theme';

// Mem0（v2 写时消歧 / v3 检索时消歧）与 Memobase（画像 + 事件），以及多类型记忆参考架构
export const Frameworks: React.FC<{unit: Unit}> = ({unit}) => {
  const {steps, frame} = useSceneSteps(unit);

  const v2 = bucket(steps, 'v2stage', 5);
  const v3 = bucket(steps, 'v3stage', 5);
  const decides = bucket(steps, 'decide', 4);
  const metrics = bucket(steps, 'metric', 2);
  const profiles = bucket(steps, 'profile', 4);
  const events = bucket(steps, 'event', 3);
  const buffers = bucket(steps, 'buffer', 3);
  const arches = bucket(steps, 'arch', 5);
  const cmps = bucket(steps, 'cmp', 4);
  // 注解只跟随当前语义单元，避免跨子视图（v2 / v3 / memobase / arch / cmp）泄漏
  const notes = steps.filter((s) => s.isCurrent && s.step.kind === 'note').slice(-4);

  const kinds = new Set(unit.steps.map((s) => s.kind));
  const mode: 'v2' | 'v3' | 'memobase' | 'arch' | 'cmp' = kinds.has('arch')
    ? 'arch'
    : kinds.has('profile') || kinds.has('event') || kinds.has('buffer')
    ? 'memobase'
    : kinds.has('v3stage') || kinds.has('metric')
    ? 'v3'
    : kinds.has('v2stage') || kinds.has('decide')
    ? 'v2'
    : 'cmp';

  const flow = flowPhase(frame, 110);

  const Pipeline: React.FC<{items: SceneStep[]; color: string}> = ({items, color}) => (
    <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
      {items.slice(-5).map((s, i) => (
        <React.Fragment key={`${s.unitId}-${i}`}>
          <div
            style={{
              minWidth: 210,
              borderRadius: 14,
              padding: '14px 16px',
              background: COLORS.white,
              border: `2px solid ${color}`,
              fontSize: 21,
              fontWeight: 800,
              color: COLORS.ink,
              opacity: s.r,
              transform: `translateY(${(1 - s.r) * 14}px)`,
            }}
          >
            {s.step.label}
          </div>
          {i < Math.min(5, items.length) - 1 ? (
            <div style={{position: 'relative', width: 46, height: 4, background: '#DCE3DA', borderRadius: 2}}>
              <div
                style={{
                  position: 'absolute',
                  left: flow * 34,
                  top: -5,
                  width: 12,
                  height: 14,
                  borderRadius: 7,
                  background: color,
                }}
              />
            </div>
          ) : null}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <SceneShell unit={unit}>
      {/* 顶部：框架标识 */}
      <div style={{position: 'absolute', left: 110, top: 168, display: 'flex', gap: 14}}>
        {[
          {k: 'v2', label: 'Mem0 · v2（2025 论文）写入时消歧', c: COLORS.blue},
          {k: 'v3', label: 'Mem0 · v3（2026.04）检索时消歧', c: COLORS.green},
          {k: 'memobase', label: 'Memobase · 画像 + 事件', c: COLORS.gold},
          {k: 'arch', label: '参考架构（图 3-4）', c: COLORS.coral},
        ].map((t) => (
          <div
            key={t.k}
            style={{
              fontSize: 21,
              fontWeight: 800,
              color: mode === t.k ? COLORS.white : COLORS.inkSoft,
              background: mode === t.k ? t.c : COLORS.white,
              border: `2px solid ${t.c}`,
              borderRadius: 999,
              padding: '8px 18px',
            }}
          >
            {t.label}
          </div>
        ))}
      </div>

      {/* Mem0 v2 */}
      {mode === 'v2' ? (
        <>
          <div style={{position: 'absolute', left: 110, top: 250}}>
            <Pipeline items={v2} color={COLORS.blue} />
          </div>
          <div style={{position: 'absolute', left: 110, top: 400, display: 'flex', gap: 14}}>
            {decides.map((s, i) => (
              <div key={`${s.unitId}-d-${i}`} style={{position: 'relative'}}>
                <Chip
                  flow
                  x={0}
                  y={0}
                  r={s.r}
                  label={s.step.label}
                  bg={/DELETE|NOOP/.test(s.step.label) ? COLORS.danger : COLORS.blue}
                  fontSize={22}
                />
              </div>
            ))}
          </div>
          <div style={{position: 'absolute', left: 110, top: 490, width: 1700}}>
            <div style={{display: 'flex', gap: 14, flexWrap: 'wrap'}}>
              {notes.slice(-4).map((s, i) => (
                <div key={`${s.unitId}-n-${i}`} style={{position: 'relative'}}>
                  <Chip flow x={0} y={0} r={s.r} label={s.step.label} bg={COLORS.inkSoft} fontSize={19} />
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {/* Mem0 v3 */}
      {mode === 'v3' ? (
        <>
          <div style={{position: 'absolute', left: 110, top: 250}}>
            <Pipeline items={v3} color={COLORS.green} />
          </div>
          <div style={{position: 'absolute', left: 110, top: 430, width: 900}}>
            {metrics.map((s, i) => {
              const [a, b] = (s.step.v ?? '0 → 0').split('→').map((x) => parseFloat(x.trim()));
              const val = a + (b - a) * s.r;
              return (
                <div key={`${s.unitId}-m-${i}`} style={{position: 'relative', height: 90}}>
                  <MeterBar
                    x={0}
                    y={0}
                    w={760}
                    h={26}
                    r={val / 100}
                    color={COLORS.green}
                    label={s.step.label}
                    value={`${val.toFixed(1)}`}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 62,
                      fontSize: 19,
                      fontWeight: 700,
                      color: COLORS.inkSoft,
                    }}
                  >
                    {s.step.v}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{position: 'absolute', left: 1050, top: 430, width: 760}}>
            <div style={{display: 'flex', gap: 12, flexWrap: 'wrap'}}>
              {notes.slice(-4).map((s, i) => (
                <div key={`${s.unitId}-n-${i}`} style={{position: 'relative'}}>
                  <Chip flow x={0} y={0} r={s.r} label={s.step.label} bg={COLORS.inkSoft} fontSize={19} />
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {/* Memobase */}
      {mode === 'memobase' ? (
        <>
          <div
            style={{
              position: 'absolute',
              left: 110,
              top: 250,
              width: 620,
              height: 380,
              boxSizing: 'border-box',
              borderRadius: 22,
              padding: 18,
              background: COLORS.white,
              border: `2px solid ${COLORS.gold}`,
            }}
          >
            <div style={{fontSize: 24, fontWeight: 800, color: COLORS.gold, marginBottom: 10}}>用户画像（可配置槽位）</div>
            {profiles.slice(-4).map((s, i) => (
              <div
                key={`${s.unitId}-p-${i}`}
                style={{
                  fontSize: 21,
                  fontWeight: 700,
                  color: COLORS.ink,
                  background: '#FBF5E6',
                  borderRadius: 8,
                  padding: '8px 12px',
                  marginBottom: 7,
                  opacity: s.r,
                  transform: `translateX(${(1 - s.r) * 16}px)`,
                }}
              >
                {s.step.label}
              </div>
            ))}
          </div>
          <div
            style={{
              position: 'absolute',
              left: 770,
              top: 250,
              width: 500,
              height: 380,
              boxSizing: 'border-box',
              borderRadius: 22,
              padding: 18,
              background: COLORS.white,
              border: `2px solid ${SEM.episodic}`,
            }}
          >
            <div style={{fontSize: 24, fontWeight: 800, color: SEM.episodic, marginBottom: 10}}>事件记忆（时间线）</div>
            {events.slice(-4).map((s, i) => (
              <div
                key={`${s.unitId}-e-${i}`}
                style={{
                  fontSize: 21,
                  fontWeight: 700,
                  color: COLORS.ink,
                  borderLeft: `5px solid ${SEM.episodic}`,
                  background: '#F1F5EE',
                  borderRadius: 8,
                  padding: '8px 12px',
                  marginBottom: 7,
                  opacity: s.r,
                  transform: `translateX(${(1 - s.r) * 16}px)`,
                }}
              >
                {s.step.label}
              </div>
            ))}
          </div>
          <div
            style={{
              position: 'absolute',
              left: 1310,
              top: 250,
              width: 500,
              height: 380,
              boxSizing: 'border-box',
              borderRadius: 22,
              padding: 18,
              background: COLORS.white,
              border: '1.5px dashed #C9D2C9',
            }}
          >
            <div style={{fontSize: 24, fontWeight: 800, color: COLORS.ink, marginBottom: 10}}>缓冲批处理</div>
            {/* 缓冲区水位：随帧上升，达阈值后统一触发 */}
            <div style={{height: 150, borderRadius: 12, background: '#F1F5EE', position: 'relative', overflow: 'hidden'}}>
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: `${20 + flowPhase(frame, 160) * 70}%`,
                  background: 'rgba(231,180,78,0.35)',
                  borderTop: `3px solid ${COLORS.gold}`,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 30,
                  borderTop: `2px dashed ${COLORS.danger}`,
                }}
              />
              <div style={{position: 'absolute', left: 12, top: 8, fontSize: 17, fontWeight: 800, color: COLORS.danger}}>
                触发阈值（规模 / 时限）
              </div>
            </div>
            {buffers.slice(-3).map((s, i) => (
              <div
                key={`${s.unitId}-b-${i}`}
                style={{
                  fontSize: 19,
                  fontWeight: 700,
                  color: COLORS.ink,
                  marginTop: 8,
                  opacity: s.r,
                  transform: `translateY(${(1 - s.r) * 10}px)`,
                }}
              >
                {s.step.label}
              </div>
            ))}
          </div>
        </>
      ) : null}

      {/* 参考架构 */}
      {mode === 'arch' ? (
        <>
          <div
            style={{
              position: 'absolute',
              left: 110,
              top: 250,
              width: 420,
              height: 330,
              boxSizing: 'border-box',
              borderRadius: 22,
              padding: 18,
              background: COLORS.white,
              border: `2px solid ${SEM.working}`,
            }}
          >
            <div style={{fontSize: 24, fontWeight: 800, color: SEM.working, marginBottom: 8}}>工作记忆</div>
            <div style={{fontSize: 19, fontWeight: 700, color: COLORS.inkSoft}}>当前任务状态（动态子集）</div>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14}}>
              {arches.map((s, i) => (
                <div key={`${s.unitId}-a-${i}`} style={{position: 'relative'}}>
                  <Chip flow x={0} y={0} r={s.r} label={s.step.label} bg={SEM.working} fontSize={18} />
                </div>
              ))}
            </div>
          </div>
          <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
            <defs>
              <marker id="fw-ah" markerWidth="12" markerHeight="9" refX="11" refY="4.5" orient="auto">
                <polygon points="0 0, 12 4.5, 0 9" fill={COLORS.green} />
              </marker>
            </defs>
            <line x1="540" y1="380" x2="700" y2="380" stroke={COLORS.green} strokeWidth="3" markerEnd="url(#fw-ah)" />
            <line x1="700" y1="440" x2="540" y2="440" stroke={COLORS.coral} strokeWidth="3" markerEnd="url(#fw-ah)" />
            <text x="620" y="366" fontSize="17" fontWeight="700" fill={COLORS.green} textAnchor="middle">
              选择性转移
            </text>
            <text x="620" y="470" fontSize="17" fontWeight="700" fill={COLORS.coral} textAnchor="middle">
              激活加载
            </text>
            <circle cx={540 + flow * 160} cy="380" r="6" fill={COLORS.green} />
            <circle cx={700 - flow * 160} cy="440" r="6" fill={COLORS.coral} />
          </svg>
          <div style={{position: 'absolute', left: 720, top: 250, width: 1090}}>
            <div style={{fontSize: 22, fontWeight: 800, color: COLORS.ink, marginBottom: 10}}>长期记忆（跨会话）</div>
            {['情景记忆（多维元数据检索）', '语义记忆（抽象出的一般知识）', '程序记忆（可复用行为流程）'].map((t, i) => (
              <div
                key={t}
                style={{
                  fontSize: 21,
                  fontWeight: 800,
                  color: [SEM.episodic, SEM.semantic, SEM.procedural][i],
                  background: COLORS.white,
                  border: `2px solid ${[SEM.episodic, SEM.semantic, SEM.procedural][i]}`,
                  borderRadius: 14,
                  padding: '12px 16px',
                  marginBottom: 10,
                }}
              >
                {t}
              </div>
            ))}
            <div style={{display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8}}>
              {arches.slice(-4).map((s, i) => (
                <div key={`${s.unitId}-ac-${i}`} style={{position: 'relative'}}>
                  <Chip flow x={0} y={0} r={s.r} label={s.step.label} bg={SEM.episodic} fontSize={19} />
                </div>
              ))}
            </div>
          </div>
          <div style={{position: 'absolute', left: 110, top: 620, width: 1700}}>
            <div style={{display: 'flex', gap: 12, flexWrap: 'wrap'}}>
              {notes.slice(-3).map((s, i) => (
                <div key={`${s.unitId}-n-${i}`} style={{position: 'relative'}}>
                  <Chip flow x={0} y={0} r={s.r} label={s.step.label} bg={COLORS.inkSoft} fontSize={19} />
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {/* 对比 */}
      {mode === 'cmp' ? (
        <div style={{position: 'absolute', left: 110, top: 250, width: 1700}}>
          <div style={{fontSize: 22, fontWeight: 800, color: COLORS.ink, marginBottom: 12}}>对比与取舍</div>
          {cmps.slice(-4).map((s, i) => (
            <div
              key={`${s.unitId}-c-${i}`}
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: COLORS.ink,
                background: COLORS.white,
                borderLeft: `6px solid ${COLORS.coral}`,
                borderRadius: 12,
                padding: '14px 18px',
                marginBottom: 12,
                opacity: s.r,
                transform: `translateX(${(1 - s.r) * 18}px)`,
              }}
            >
              {s.step.label}
            </div>
          ))}
          <div style={{display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8}}>
            {notes.slice(-3).map((s, i) => (
              <div key={`${s.unitId}-n-${i}`} style={{position: 'relative'}}>
                <Chip flow x={0} y={0} r={s.r} label={s.step.label} bg={COLORS.inkSoft} fontSize={19} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </SceneShell>
  );
};
