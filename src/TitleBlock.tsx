import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Title } from './types';
import { COLORS, FONTS, SAFE, TITLE_TOP, fitSize } from './layout';

const ease = Easing.bezier(0.2, 0.8, 0.2, 1);

export const TitleBlock: React.FC<{ title: Title }> = ({ title }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const len = title.endFrame - title.startFrame;
  const inA = interpolate(f, [0, 9], [0, 1], { easing: ease, extrapolateRight: 'clamp' });
  const inB = interpolate(f, [3, 13], [0, 1], { easing: ease, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const out = interpolate(f, [len - 7, len], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  void fps;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          top: TITLE_TOP,
          left: SAFE.left,
          right: SAFE.left, // titles are centred in the upper area; top-right has no Reels UI
          textAlign: 'center',
          opacity: out,
        }}
      >
        {title.accent ? (
          <div
            style={{
              fontFamily: FONTS.body,
              fontStyle: 'italic',
              fontWeight: 700,
              fontSize: 44,
              lineHeight: '50px',
              color: COLORS.gold,
              textShadow: '0 3px 14px rgba(0,0,0,0.45)',
              opacity: inA,
              transform: `translateY(${(1 - inA) * 14}px)`,
            }}
          >
            {title.accent}
          </div>
        ) : null}
        <div
          style={{
            fontFamily: FONTS.head,
            fontWeight: 700,
            fontSize: fitSize(title.main, 84, 880),
            lineHeight: '92px',
            letterSpacing: 1,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            color: COLORS.white,
            textShadow: '0 4px 18px rgba(0,0,0,0.5)',
            opacity: inB,
            transform: `translateY(${(1 - inB) * 18}px) scale(${0.96 + 0.04 * inB})`,
          }}
        >
          {title.main}
        </div>
      </div>
    </AbsoluteFill>
  );
};
