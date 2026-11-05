import { Easing, interpolate, useCurrentFrame } from 'remotion';
import type { CameraKey, CameraMode } from './types';

// Framing presets for the 1080x1920 presenter shot.
// Points map as p' = s * p + t, i.e. scale s around the face centre (cx, cy).
// Face metrics of the source (V5 source: head top y≈600, face centre y≈760) can be overridden per job
// via timeline.face, so another take of the same studio with a different head height keeps the same framing rules.
// cardScale/card2Scale: a source whose head sits higher needs a stronger push-down to free the top area.
export type Face = { cx: number; cy: number; top: number; cardScale?: number; card2Scale?: number };
export const DEFAULT_FACE: Face = { cx: 540, cy: 760, top: 600 };

const toAffine = (m: CameraMode, face: Face) => {
  // "card"/"card2" scale around y = 0, which pushes the presenter down so the upper ~37% of the frame is free.
  if (m === 'card' || m === 'card2') {
    const s = (m === 'card' ? face.cardScale : face.card2Scale) ?? (m === 'card' ? 1.25 : 1.32);
    return { s, tx: face.cx * (1 - s), ty: 0 };
  }
  if (m === 'right') {
    // face centre lands at (760, 760): the left 40% of the frame is free for a device demo
    const s = 1.3;
    return { s, tx: 790 - face.cx * s, ty: 760 - face.cy * s };
  }
  const s = { wide: 1.0, medium: 1.14, close: 1.26 }[m];
  return { s, tx: face.cx * (1 - s), ty: face.cy * (1 - s) };
};

const SMOOTH_FRAMES = 12;

export const cameraAt = (keys: CameraKey[], frame: number, face: Face = DEFAULT_FACE) => {
  let idx = 0;
  for (let i = 0; i < keys.length; i++) if (keys[i].frame <= frame) idx = i;
  const cur = keys[idx];
  const target = toAffine(cur.mode, face);
  // Very slow push-in inside each camera segment keeps static shots alive (max +1.5%).
  const nextFrame = idx + 1 < keys.length ? keys[idx + 1].frame : cur.frame + 300;
  const drift = interpolate(frame, [cur.frame, nextFrame], [0, 0.015], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  let res = target;
  if (cur.smooth && idx > 0 && frame < cur.frame + SMOOTH_FRAMES) {
    const prev = toAffine(keys[idx - 1].mode, face);
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
  const fx = face.cx * res.s + res.tx;
  const fy = face.cy * res.s + res.ty;
  return { s: s2, tx: fx - face.cx * s2, ty: fy - face.cy * s2 };
};

export const useCamera = (keys: CameraKey[], face: Face = DEFAULT_FACE) => {
  const frame = useCurrentFrame();
  return cameraAt(keys, frame, face);
};
