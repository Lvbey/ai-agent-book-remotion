import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate, Easing} from 'remotion';
import {COLORS, TYPE} from '../theme';
import {Background, ChapterLabel, ReviewBadge} from './Background';
import {captionAtFrame, TOTAL_FRAMES, SCENE_TITLES, Unit} from '../data';

export const Panel: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  title?: string;
  accent?: string;
  children?: React.ReactNode;
  r?: number;
}> = ({x, y, w, h, title, accent = COLORS.green, children, r = 1}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, 14], [r, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        boxSizing: 'border-box',
        borderRadius: 24,
        padding: 24,
        background: COLORS.white,
        border: `1.5px solid #D8DED4`,
        boxShadow: '0 18px 48px rgba(24,48,45,0.07)',
        color: COLORS.ink,
        transform: `translateY(${(1 - p) * 14}px)`,
        opacity: p,
      }}
    >
      <div style={{position: 'absolute', top: 0, left: 24, width: 54, height: 5, borderRadius: '0 0 4px 4px', background: accent}} />
      {title ? <div style={{fontSize: 25, fontWeight: 800, marginBottom: 14}}>{title}</div> : null}
      {children}
    </div>
  );
};

/** 通用条目：按揭示进度做位移+淡入，并带一条随进度推进的高亮扫描。 */
export const Item: React.FC<{
  x: number;
  y: number;
  w?: number;
  r: number;
  children?: React.ReactNode;
  color?: string;
  fill?: string;
  h?: number;
  fontSize?: number;
}> = ({x, y, w = 520, r, children, color = COLORS.ink, fill, h = 58, fontSize = 26}) => {
  const eased = interpolate(r, [0, 1], [0, 1], {easing: Easing.out(Easing.cubic)});
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y + (1 - eased) * 14,
        width: w,
        minHeight: h,
        boxSizing: 'border-box',
        borderRadius: 14,
        padding: '12px 20px',
        background: fill ?? COLORS.white,
        border: `1.5px solid ${color}`,
        color,
        fontSize,
        fontWeight: 700,
        lineHeight: 1.28,
        opacity: eased,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 8px 22px rgba(24,48,45,0.06)',
      }}
    >
      {/* 揭示扫描条：随进度推进，保证该条目出现过程中每帧都有变化 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${eased * 100}%`,
          background: color,
          opacity: 0.12,
          borderRadius: 14,
        }}
      />
      <div style={{position: 'relative'}}>{children}</div>
    </div>
  );
};

export const Chip: React.FC<{
  x: number;
  y: number;
  r: number;
  label: string;
  color?: string;
  bg?: string;
  fontSize?: number;
  /** flex/grid 等流式容器中使用，避免绝对定位导致所有 Chip 叠在 (0,0)。 */
  flow?: boolean;
}> = ({x, y, r, label, color = COLORS.white, bg = COLORS.green, fontSize = 22, flow = false}) => {
  const eased = interpolate(r, [0, 1], [0, 1], {easing: Easing.out(Easing.back(1.4))});
  return (
    <div
      style={{
        position: flow ? 'relative' : 'absolute',
        left: flow ? 0 : x,
        top: flow ? 0 : y,
        display: 'inline-flex',
        alignItems: 'center',
        padding: '9px 18px',
        borderRadius: 999,
        background: bg,
        color,
        fontSize,
        fontWeight: 700,
        opacity: eased,
        transform: `scale(${0.86 + 0.14 * eased})`,
        transformOrigin: 'left center',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </div>
  );
};

/** 数值条：从 0 连续推进到 target，用于评分/指标等可核验推进。 */
export const MeterBar: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
  color: string;
  label?: string;
  value?: string;
}> = ({x, y, w, h, r, color, label, value}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w}}>
    {label || value ? (
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6}}>
        {label ? <div style={{fontSize: 21, fontWeight: 700, color: COLORS.inkSoft}}>{label}</div> : <span />}
        {value ? <div style={{fontSize: 24, fontWeight: 800, color}}>{value}</div> : null}
      </div>
    ) : null}
    <div style={{width: w, height: h, borderRadius: h / 2, background: '#E3E8E1', overflow: 'hidden'}}>
      <div
        style={{
          width: `${Math.max(0, Math.min(1, r)) * 100}%`,
          height: '100%',
          background: color,
          borderRadius: h / 2,
        }}
      />
    </div>
  </div>
);

export const TextReveal: React.FC<{
  text: string;
  x: number;
  y: number;
  w?: number;
  r: number;
  size?: number;
  color?: string;
  weight?: number;
  align?: 'left' | 'center' | 'right';
}> = ({text, x, y, w = 900, r, size = TYPE.h2, color = COLORS.ink, weight = 700, align = 'left'}) => {
  const eased = interpolate(r, [0, 1], [0, 1], {easing: Easing.out(Easing.quad)});
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y + (1 - eased) * 16,
        width: w,
        fontSize: size,
        lineHeight: 1.32,
        fontWeight: weight,
        color,
        textAlign: align,
        opacity: eased,
        whiteSpace: 'pre-line',
      }}
    >
      {text}
    </div>
  );
};

/** 底部字幕：直接读取生成的字幕轨，保证与口播稿逐字一致。 */
export const Subtitle: React.FC = () => {
  const frame = useCurrentFrame();
  const cap = captionAtFrame(frame);
  const rel = frame - cap.startFrame;
  const len = Math.max(1, cap.endFrame - cap.startFrame);
  // 短条（≤10 帧）容不下淡入淡出两个拐点，区间会退化成非严格单调而抛错，故常显。
  const opacity =
    len <= 10
      ? 1
      : interpolate(rel, [0, 5, len - 5, len], [0, 1, 1, 0.92], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 46,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        opacity,
      }}
    >
      <div
        style={{
          maxWidth: 1500,
          fontSize: 42,
          fontWeight: 700,
          lineHeight: 1.42,
          color: COLORS.ink,
          background: 'rgba(255,254,249,0.93)',
          borderRadius: 18,
          padding: '14px 34px',
          boxShadow: '0 10px 34px rgba(24,48,45,0.10)',
          textAlign: 'center',
        }}
      >
        {cap.text}
      </div>
    </div>
  );
};

/** 场景外壳：统一背景、章节标签、审核标识、场景标题与字幕。 */
export const SceneShell: React.FC<{unit: Unit; children: React.ReactNode}> = ({unit, children}) => {
  const frame = useCurrentFrame();
  const progress = frame / Math.max(1, TOTAL_FRAMES);
  const titleR = interpolate(frame, [unit.start, unit.start + 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill>
      <Background />
      <ChapterLabel />
      <ReviewBadge progress={progress} />
      <div
        style={{
          position: 'absolute',
          left: 76,
          top: 88,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          opacity: titleR,
        }}
      >
        <span
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: COLORS.white,
            background: COLORS.green,
            borderRadius: 999,
            padding: '6px 18px',
          }}
        >
          {unit.section}
        </span>
        <span style={{fontSize: 26, fontWeight: 800, color: COLORS.ink}}>
          {SCENE_TITLES[unit.scene] ?? unit.scene}
        </span>
        <span style={{fontSize: 20, fontWeight: 600, color: COLORS.muted}}>{unit.title}</span>
      </div>
      {children}
      <Subtitle />
    </AbsoluteFill>
  );
};

export const Arrow: React.FC<{x1: number; y1: number; x2: number; y2: number; color: string; r?: number; w?: number}> = ({
  x1,
  y1,
  x2,
  y2,
  color,
  r = 1,
  w = 3,
}) => (
  <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
    <defs>
      <marker id="c3-ah" markerWidth="12" markerHeight="9" refX="11" refY="4.5" orient="auto">
        <polygon points="0 0, 12 4.5, 0 9" fill={color} />
      </marker>
    </defs>
    <line
      x1={x1}
      y1={y1}
      x2={x1 + (x2 - x1) * Math.max(0, Math.min(1, r))}
      y2={y1 + (y2 - y1) * Math.max(0, Math.min(1, r))}
      stroke={color}
      strokeWidth={w}
      markerEnd="url(#c3-ah)"
    />
  </svg>
);
