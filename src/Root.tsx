import React from 'react';
import { Composition } from 'remotion';
import './fonts.css';
import { BelesReel } from './BelesReel';
import timeline from '../data/timeline.generated.json';
import type { Timeline } from './types';

const tl = timeline as unknown as Timeline;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Duration is derived from the final edit timeline (data/timeline.generated.json). */}
      <Composition
        id="BelesReel"
        component={BelesReel}
        durationInFrames={tl.durationInFrames}
        fps={tl.fps}
        width={tl.width}
        height={tl.height}
        defaultProps={{ timeline: tl }}
      />
      {/* Same film with a selectable subtitle concept, for the A–E comparison preview. */}
      <Composition
        id="SubStyle"
        component={BelesReel}
        durationInFrames={tl.durationInFrames}
        fps={tl.fps}
        width={tl.width}
        height={tl.height}
        defaultProps={{ timeline: tl, subVariant: 'A' as const, styleLabel: 'A' }}
      />
    </>
  );
};
