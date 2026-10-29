import React from 'react';
import {interpolate, useCurrentFrame, Easing} from 'remotion';
import {COLORS, TYPE} from '../theme';

export const TextReveal: React.FC<{
  text: string;
  start?: number;
  duration?: number;
  size?: number;
  color?: string;
  weight?: number;
  align?: 'left' | 'center' | 'right';
  width?: number | string;
  lineHeight?: number;
}> = ({text, start = 0, duration = 18, size = TYPE.h2, color = COLORS.ink, weight = 700, align = 'left', width = 'auto', lineHeight = 1.3}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [start, start + duration], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});
  const y = interpolate(frame, [start, start + duration], [18, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return <div style={{width, fontSize: size, lineHeight, fontWeight: weight, color, textAlign: align, opacity, transform: `translateY(${y}px)`, whiteSpace: 'pre-line'}}>{text}</div>;
};

export const Caption: React.FC<{text: string; start?: number; end?: number}> = ({text, start = 0, end = 150}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [start, start + 8, end - 8, end], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <div style={{position: 'absolute', bottom: 82, left: 220, right: 220, textAlign: 'center', fontSize: 30, fontWeight: 600, lineHeight: 1.45, color: COLORS.ink, background: 'rgba(255,254,249,0.9)', borderRadius: 16, padding: '16px 28px', opacity, boxShadow: '0 8px 30px rgba(24,48,45,0.08)'}}>{text}</div>;
};
