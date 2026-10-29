import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate} from 'remotion';
import {COLORS} from '../theme';

export const Background: React.FC<{chapter?: string; dark?: boolean}> = ({chapter, dark = false}) => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame % 240, [0, 240], [0, 28]);
  const bg = dark ? COLORS.ink : COLORS.paper;
  return (
    <AbsoluteFill style={{backgroundColor: bg, color: dark ? COLORS.paper : COLORS.ink, overflow: 'hidden'}}>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
        <defs>
          <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.6" fill={dark ? '#78958A' : '#BBC5B9'} opacity="0.24" />
          </pattern>
          <linearGradient id="wash" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={dark ? '#2D4A42' : '#E7EDE2'} />
            <stop offset="100%" stopColor={bg} />
          </linearGradient>
        </defs>
        <rect width="1920" height="1080" fill="url(#wash)" />
        <rect x={-drift} y="0" width="1940" height="1080" fill="url(#grid)" />
        <path d={`M 1320 ${-100 + drift} C 1540 130, 1670 40, 1980 270`} fill="none" stroke={dark ? '#5AA88B' : '#C7D8CB'} strokeWidth="2" opacity="0.25" />
        <path d={`M 1250 ${1080 - drift} C 1510 840, 1680 1080, 2000 800`} fill="none" stroke={dark ? '#5AA88B' : '#C7D8CB'} strokeWidth="2" opacity="0.18" />
      </svg>
      {chapter && <div style={{position: 'absolute', left: 76, top: 54, fontSize: 19, fontWeight: 700, letterSpacing: 3, color: dark ? '#A8CABB' : COLORS.green}}>{chapter.toUpperCase()}</div>}
      <div style={{position: 'absolute', left: 76, bottom: 42, fontSize: 17, letterSpacing: 2, opacity: 0.55}}>上下文工程 / CONTEXT ENGINEERING</div>
    </AbsoluteFill>
  );
};
