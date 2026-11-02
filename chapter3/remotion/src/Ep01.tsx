import React from 'react';
import {useCurrentFrame, AbsoluteFill, Audio, staticFile, interpolate, Easing} from 'remotion';
import {unitAtFrame, SECTION_TITLES, SCENE_GROUPS, Unit, NARRATION} from './data';
import {COLORS} from './theme';
import {IntroMap} from './scenes/IntroMap';
import {ExtractDemo} from './scenes/ExtractDemo';
import {EvalFrame} from './scenes/EvalFrame';
import {Layers} from './scenes/Layers';
import {Formats} from './scenes/Formats';
import {CodeState} from './scenes/CodeState';
import {Cognition} from './scenes/Cognition';
import {Frameworks} from './scenes/Frameworks';
import {Compress} from './scenes/Compress';
import {Privacy} from './scenes/Privacy';

const SCENES: Record<string, React.FC<{unit: Unit}>> = {
  IntroMap,
  ExtractDemo,
  EvalFrame,
  Layers,
  Formats,
  CodeState,
  Cognition,
  Frameworks,
  Compress,
  Privacy,
};

/** 每个分区开场的分节卡：仅在该分区第一个语义单元前 90 帧淡出，不遮挡后续内容。 */
const SectionIntro: React.FC<{unit: Unit; local: number}> = ({unit, local}) => {
  const group = SCENE_GROUPS[unit.scene] ?? [];
  const isFirst = group.length > 0 && group[0].id === unit.id;
  if (!isFirst || local > 90) return null;
  const appear = interpolate(local, [0, 14], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const out = interpolate(local, [62, 90], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        opacity: Math.min(appear, out),
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          background: 'rgba(246,243,234,0.94)',
          border: `3px solid ${COLORS.green}`,
          borderRadius: 28,
          padding: '40px 70px',
          textAlign: 'center',
          boxShadow: '0 30px 80px rgba(24,48,45,0.14)',
        }}
      >
        <div style={{fontSize: 26, fontWeight: 800, letterSpacing: 6, color: COLORS.green}}>{unit.section}</div>
        <div style={{fontSize: 62, fontWeight: 800, color: COLORS.ink, marginTop: 10}}>
          {SECTION_TITLES[unit.section]}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Ep01: React.FC = () => {
  const frame = useCurrentFrame();
  const unit = unitAtFrame(frame);
  const Scene = SCENES[unit.scene] ?? IntroMap;
  return (
    <AbsoluteFill>
      {/* 整轨旁白：与 totalFrames 采样级对齐，见 scripts/build-narration-track.mjs */}
      {NARRATION.available && NARRATION.masterAudio ? <Audio src={staticFile(NARRATION.masterAudio)} /> : null}
      <Scene unit={unit} />
      <SectionIntro unit={unit} local={frame - unit.start} />
    </AbsoluteFill>
  );
};
