import React from 'react';
import {Composition} from 'remotion';
import {Ep01} from './Ep01';
import {TOTAL_FRAMES, FPS, WIDTH, HEIGHT} from './data';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="EP01UserMemory"
    component={Ep01}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
  />
);
