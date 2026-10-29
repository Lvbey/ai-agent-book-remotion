import React from 'react';
import {Composition} from 'remotion';
import {MainVideo} from './MainVideo';
import {VIDEO} from './theme';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="ContextEngineering"
    component={MainVideo}
    durationInFrames={VIDEO.durationInFrames}
    fps={VIDEO.fps}
    width={VIDEO.width}
    height={VIDEO.height}
  />
);
