import React from 'react';
import { Composition } from 'remotion';
import '../../../../src/fonts.css';
import { BelesReel } from '../../../../src/BelesReel';
import timeline from '../data/timeline.generated.json';
import type { Timeline } from '../../../../src/types';

// BW-002 entry: the same V5 composition code (src/), fed with this job's own timeline.
const tl = timeline as unknown as Timeline;

export const RemotionRoot: React.FC = () => (
  <Composition
    id="BelesReelBW002"
    component={BelesReel}
    durationInFrames={tl.durationInFrames}
    fps={tl.fps}
    width={tl.width}
    height={tl.height}
    defaultProps={{ timeline: tl }}
  />
);
