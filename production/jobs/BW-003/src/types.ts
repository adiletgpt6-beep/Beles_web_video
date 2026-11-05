import type { Timeline } from '../../../../src/types';

// BW-003 overlays: produced by scripts/build-timeline.mjs from edit.json "overlays" (anchors → frames,
// beats → overlay-local frames). Each kind is drawn by a component in night.tsx.
export type Overlay = {
  kind: 'clock' | 'chat' | 'ticket' | 'dial' | 'services' | 'sleep' | 'cta' | 'title';
  startFrame: number;
  endFrame: number;
  beats: Record<string, number>;
  [key: string]: unknown;
};

export type TimelineBW003 = Timeline & { overlays?: Overlay[]; nightTint?: number };
