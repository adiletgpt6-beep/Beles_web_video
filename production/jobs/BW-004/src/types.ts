import type { Timeline } from '../../../../src/types';

// BW-004 «Үч ката»: mode-B scenes produced by scripts/build-timeline.mjs from edit.json "overlays"
// (anchors → frames, beats → scene-local frames). Each kind is drawn by a component in paper.tsx.
export type Overlay = {
  kind: 'three' | 'beauty' | 'mobile' | 'checklist' | 'cta';
  startFrame: number;
  endFrame: number;
  beats: Record<string, number>;
  hold?: boolean; // last scene: no fade back to the presenter
  [key: string]: unknown;
};

export type TimelineBW004 = Timeline & { overlays?: Overlay[] };
