import React from 'react';
import {interpolate, useCurrentFrame, Easing} from 'remotion';
import {COLORS} from '../theme';

export const Panel: React.FC<{
  x: number; y: number; w: number; h: number; title: string; children?: React.ReactNode;
  accent?: string; start?: number; fill?: string; dark?: boolean;
}> = ({x, y, w, h, title, children, accent = COLORS.green, start = 0, fill, dark = false}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [start, start + 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return <div style={{position: 'absolute', left: x, top: y, width: w, height: h, boxSizing: 'border-box', borderRadius: 24, padding: 26, background: fill ?? (dark ? '#24423A' : COLORS.white), border: `1.5px solid ${dark ? '#46645A' : '#D8DED4'}`, opacity: p, transform: `translateY(${(1-p)*18}px)`, boxShadow: dark ? 'none' : '0 18px 48px rgba(24,48,45,0.07)', color: dark ? COLORS.paper : COLORS.ink}}>
    <div style={{position: 'absolute', top: 0, left: 24, width: 54, height: 5, borderRadius: '0 0 4px 4px', background: accent}} />
    <div style={{fontSize: 25, fontWeight: 800, marginBottom: 18}}>{title}</div>
    {children}
  </div>;
};
