import React from 'react';
import {Composition} from 'remotion';
import {MainVideo} from './MainVideo';
import {VIDEO} from './theme';
import {AuditionVideo} from './AuditionVideo';

export const RemotionRoot: React.FC = () => (
  <> <Composition
    id="ContextEngineering"
    component={MainVideo}
    durationInFrames={VIDEO.durationInFrames}
    fps={VIDEO.fps}
    width={VIDEO.width}
    height={VIDEO.height}
  /> <Composition id="VoiceAudition" component={AuditionVideo} durationInFrames={1033} fps={30} width={1920} height={1080} /> </>
);

