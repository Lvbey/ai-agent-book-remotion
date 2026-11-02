import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate} from 'remotion';
import {COLORS} from '../theme';
import {NARRATION} from '../data';

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 150) * 14;
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.paper,
        color: COLORS.ink,
        overflow: 'hidden',
        fontFamily:
          "'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', 'Hiragino Sans GB', system-ui, sans-serif",
      }}
    >
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
        <defs>
          <pattern id="c3-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.6" fill="#BBC5B9" opacity="0.24" />
          </pattern>
          <linearGradient id="c3-wash" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E7EDE2" />
            <stop offset="100%" stopColor={COLORS.paper} />
          </linearGradient>
        </defs>
        <rect width="1920" height="1080" fill="url(#c3-wash)" />
        <g opacity={0.07} stroke={COLORS.green} fill="none">
          <circle cx="1780" cy="150" r="260" strokeWidth="1" />
          <circle
            cx="1780"
            cy="150"
            r="220"
            strokeWidth="16"
            strokeDasharray="1 28"
            transform={`rotate(${frame / 8} 1780 150)`}
          />
          <path d="M 1500 150 H 1920 M 1780 0 V 430" />
        </g>
        <rect x={-drift} y="0" width="1940" height="1080" fill="url(#c3-grid)" />
        <path
          d={`M 1320 ${-100 + drift} C 1540 130, 1670 40, 1980 270`}
          fill="none"
          stroke="#C7D8CB"
          strokeWidth="2"
          opacity="0.25"
        />
      </svg>
    </AbsoluteFill>
  );
};

export const ChapterLabel: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      left: 76,
      top: 46,
      fontSize: 19,
      fontWeight: 700,
      letterSpacing: 3,
      color: COLORS.green,
    }}
  >
    CHAPTER 3 · 用户记忆和知识库 / USER MEMORY &amp; KNOWLEDGE BASE
  </div>
);

/** 顶部：无声审核版标识 + 预估时码声明（不冒充真实语音同步）。 */
export const ReviewBadge: React.FC<{progress: number}> = ({progress}) => (
  <>
    <div
      style={{
        position: 'absolute',
        right: 76,
        top: 42,
        display: 'flex',
        gap: 10,
        alignItems: 'center',
      }}
    >
      <span
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: NARRATION.available ? COLORS.green : COLORS.danger,
          border: `1.5px solid ${NARRATION.available ? COLORS.green : COLORS.danger}`,
          borderRadius: 999,
          padding: '5px 14px',
          background: 'rgba(255,254,249,0.86)',
        }}
      >
        {NARRATION.available ? '配音版 · 真实语音' : '无声审核版 · 未配音'}
      </span>
      <span
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: COLORS.inkSoft,
          border: `1.5px solid #C9D2C9`,
          borderRadius: 999,
          padding: '5px 14px',
          background: 'rgba(255,254,249,0.86)',
        }}
      >
        {NARRATION.wordLevelCaptions ? '字幕已按语音对齐' : '字幕为预估时码'}
      </span>
    </div>
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        height: 5,
        width: `${progress * 100}%`,
        background: COLORS.green,
      }}
    />
  </>
);
