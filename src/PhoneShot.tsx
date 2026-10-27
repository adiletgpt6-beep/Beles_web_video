import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { PhoneShot } from './types';
import { COLORS, FONTS, fitSize } from './layout';

// Separate full-screen plan: real mobile screenshot scrolling inside a phone frame,
// the presenter stays visible (blurred) behind it so the voice keeps its source.
const PHONE = { w: 540, h: 1100, top: 300, radius: 64, bezel: 16 };

export const PhoneShotView: React.FC<{ shot: PhoneShot }> = ({ shot }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const len = shot.endFrame - shot.startFrame;
  const enter = spring({ frame: f, fps, config: { damping: 20, stiffness: 120 } });
  const exit = interpolate(f, [len - 8, len], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic) });
  const bg = interpolate(f, [0, 8, len - 8, len], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const screenW = PHONE.w - PHONE.bezel * 2;
  const screenH = PHONE.h - PHONE.bezel * 2;
  const s = screenW / shot.imageWidth;
  const scroll = interpolate(f, [10, len - 10], [shot.scrollFrom, shot.scrollTo], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.45, 0, 0.25, 1),
  });
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill
        style={{
          backdropFilter: `blur(${22 * bg}px)`,
          background: `linear-gradient(180deg, rgba(28,6,5,${0.78 * bg}) 0%, rgba(40,10,8,${0.6 * bg}) 55%, rgba(20,5,4,${0.8 * bg}) 100%)`,
        }}
      />
      {shot.label ? (
        <div
          style={{
            position: 'absolute',
            top: 172,
            left: 90,
            right: 90,
            textAlign: 'center',
            fontFamily: FONTS.head,
            fontWeight: 700,
            fontSize: fitSize(shot.label, 74, 880),
            lineHeight: '84px',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            color: COLORS.white,
            textShadow: '0 4px 16px rgba(0,0,0,0.45)',
            opacity: enter * (1 - exit),
            transform: `translateY(${(1 - enter) * 16}px)`,
          }}
        >
          {shot.label}
        </div>
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: (1080 - PHONE.w) / 2,
          top: PHONE.top,
          width: PHONE.w,
          height: PHONE.h,
          borderRadius: PHONE.radius,
          background: '#0D0D0F',
          boxShadow: '0 40px 90px rgba(0,0,0,0.6), inset 0 0 0 3px #3A3A3E',
          opacity: enter * (1 - exit),
          transform: `translateY(${(1 - enter) * 120 + exit * 40}px) scale(${0.94 + 0.06 * enter})`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: PHONE.bezel,
            top: PHONE.bezel,
            width: screenW,
            height: screenH,
            borderRadius: PHONE.radius - PHONE.bezel,
            overflow: 'hidden',
            background: '#fff',
          }}
        >
          <Img
            src={staticFile(shot.image)}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: shot.imageWidth,
              height: shot.imageHeight,
              transformOrigin: '0 0',
              transform: `scale(${s}) translateY(${-scroll}px)`,
            }}
          />
        </div>
        {/* dynamic-island style notch */}
        <div style={{ position: 'absolute', top: 30, left: PHONE.w / 2 - 62, width: 124, height: 34, borderRadius: 17, background: '#0D0D0F' }} />
      </div>
    </AbsoluteFill>
  );
};
