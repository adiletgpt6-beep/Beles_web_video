import React from 'react';
import { Composition } from 'remotion';
import '../../../../src/fonts.css';
import { BelesReelBW003 } from './BelesReelBW003';
import timeline from '../data/timeline.generated.json';
import type { TimelineBW003 } from './types';

// BW-003 entry: its own composition (night-shift concept), fed with this job's own timeline.
const tl = timeline as unknown as TimelineBW003;

export const RemotionRoot: React.FC = () => (
  <Composition
    id="BelesReelBW003"
    component={BelesReelBW003}
    durationInFrames={tl.durationInFrames}
    fps={tl.fps}
    width={tl.width}
    height={tl.height}
    defaultProps={{ timeline: tl }}
  />
);
