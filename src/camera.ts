import { Easing, interpolate, useCurrentFrame } from 'remotion';
import type { CameraKey, CameraMode } from './types';

// Framing presets for the 1080x1920 presenter shot.
// Points map as p' = s * p + t, i.e. scale s around origin (ox, oy).
// Head top in the source sits at y≈600, face centre at y≈760.
const PRESETS: Record<CameraMode, { s: number; ox: number; oy: number }> = {
  wide: { s: 1.0, ox: 540, oy: 760 },
  medium: { s: 1.14, ox: 540, oy: 760 },
  close: { s: 1.26, ox: 540, oy: 760 },
  // Pushes the presenter down so the upper ~37% of the frame is free for title + site card.
  card: { s: 1.25, ox: 540, oy: 0 },
  // Tighter variant of "card" for consecutive card takes, so the cut between two takes reads as a punch-in.
  card2: { s: 1.32, ox: 540, oy: 0 },
};

const toAffine = (m: CameraMode) => {
  const p = PRESETS[m];
  return { s: p.s, tx: p.ox * (1 - p.s), ty: p.oy * (1 - p.s) };
};

const SMOOTH_FRAMES = 12;

export const cameraAt = (keys: CameraKey[], frame: number) => {
  let idx = 0;
  for (let i = 0; i < keys.length; i++) if (keys[i].frame <= frame) idx = i;
  const cur = keys[idx];
  const target = toAffine(cur.mode);
  // Very slow push-in inside each camera segment keeps static shots alive (max +1.5%).
  const nextFrame = idx + 1 < keys.length ? keys[idx + 1].frame : cur.frame + 300;
  const drift = interpolate(frame, [cur.frame, nextFrame], [0, 0.015], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  let res = target;
  if (cur.smooth && idx > 0 && frame < cur.frame + SMOOTH_FRAMES) {
    const prev = toAffine(keys[idx - 1].mode);
    const k = interpolate(frame, [cur.frame, cur.frame + SMOOTH_FRAMES], [0, 1], {
      easing: Easing.bezier(0.33, 0, 0.2, 1),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    res = {
      s: prev.s + (target.s - prev.s) * k,
      tx: prev.tx + (target.tx - prev.tx) * k,
      ty: prev.ty + (target.ty - prev.ty) * k,
    };
  }
  // apply drift around the face centre
  const s2 = res.s * (1 + drift);
  const fx = 540 * res.s + res.tx;
  const fy = 760 * res.s + res.ty;
  return { s: s2, tx: fx - 540 * s2, ty: fy - 760 * s2 };
};

export const useCamera = (keys: CameraKey[]) => {
  const frame = useCurrentFrame();
  return cameraAt(keys, frame);
};
