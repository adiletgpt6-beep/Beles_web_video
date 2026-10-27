import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import type { Subtitle } from './types';
import { COLORS, FONTS, SUB } from './layout';

// Short phrase groups (2–5 words) that follow the voice; key word in gold.
export const Subtitles: React.FC<{ subtitles: Subtitle[] }> = ({ subtitles }) => {
  const f = useCurrentFrame();
  const cur = subtitles.find((s) => f >= s.startFrame && f < s.endFrame);
  if (!cur) return null;
  const local = f - cur.startFrame;
  const len = cur.endFrame - cur.startFrame;
  const a = interpolate(local, [0, 5], [0, 1], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const o = interpolate(local, [len - 3, len], [1, 0.0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          left: SUB.left,
          right: SUB.right,
          bottom: 1920 - SUB.bottom,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            maxWidth: 810,
            padding: '12px 26px 14px',
            borderRadius: 22,
            background: COLORS.pill,
            textAlign: 'center',
            fontFamily: FONTS.body,
            fontWeight: 800,
            fontSize: 54,
            lineHeight: '66px',
            color: COLORS.white,
            textShadow: '0 2px 8px rgba(0,0,0,0.35)',
            opacity: a * o,
            transform: `translateY(${(1 - a) * 12}px) scale(${0.97 + 0.03 * a})`,
          }}
        >
          {cur.words.map((w, i) => (
            <span key={i} style={{ color: w.key ? COLORS.gold : COLORS.white }}>
              {w.text}
              {i < cur.words.length - 1 ? ' ' : ''}
            </span>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
