import React from 'react';
import { Composition } from 'remotion';
import '../../../../src/fonts.css';
import { BelesReelBW004 } from './BelesReelBW004';
import timeline from '../data/timeline.generated.json';
import type { TimelineBW004 } from './types';

// BW-004 entry: its own composition (concept «Үч ката», strict A/B alternation), fed with this job's own timeline.
const tl = timeline as unknown as TimelineBW004;

export const RemotionRoot: React.FC = () => (
  <Composition
    id="BelesReelBW004"
    component={BelesReelBW004}
    durationInFrames={tl.durationInFrames}
    fps={tl.fps}
    width={tl.width}
    height={tl.height}
    defaultProps={{ timeline: tl }}
  />
);
