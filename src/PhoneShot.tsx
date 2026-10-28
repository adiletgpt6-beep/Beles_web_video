import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { PhoneShot } from './types';
import { COLORS, FONTS, fitSize } from './layout';
import { viewAt } from './SiteCard';

// Separate full-screen plan: real mobile screenshot scrolling inside a phone frame,
// optionally handing over to the desktop version in a browser window ("телефон → компьютер").
// The presenter stays visible (blurred) behind it; the plan may span a cut between two takes,
// which then happens invisibly underneath (J/L-cut).
const PHONE = { w: 540, h: 1100, top: 300, radius: 64, bezel: 16 };
const DESK = { x: 50, w: 980, top: 420, h: 640, bar: 46, radius: 26 };
const SWAP = 12; // frames for the phone → desktop hand-over
const smooth = Easing.bezier(0.45, 0, 0.2, 1);

export const PhoneShotView: React.FC<{ shot: PhoneShot }> = ({ shot }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const len = shot.endFrame - shot.startFrame;
  const enter = spring({ frame: f, fps, config: { damping: 22, stiffness: 120 } });
  const exit = interpolate(f, [len - 8, len], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic) });
  const bg = interpolate(f, [0, 8, len - 8, len], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const d = shot.desktop;
  const swap = d ? interpolate(f, [d.fromFrame, d.fromFrame + SWAP], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: smooth }) : 0;
  const phoneEnd = d ? d.fromFrame + SWAP : len - 10;
  const screenW = PHONE.w - PHONE.bezel * 2;
  const screenH = PHONE.h - PHONE.bezel * 2;
  const s = screenW / shot.imageWidth;
  const scroll = interpolate(f, [10, phoneEnd], [shot.scrollFrom, shot.scrollTo], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.45, 0, 0.25, 1),
  });
  const labelEnd = shot.labelEndFrame ?? len;
  const labelOp = enter * interpolate(f, [labelEnd - 7, labelEnd], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const v = d ? viewAt(d.views, f) : null;
  const ds = d && v ? (DESK.w) / v.w : 1;

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
            opacity: labelOp,
            transform: `translateY(${(1 - enter) * 16}px)`,
          }}
        >
          {shot.label}
        </div>
      ) : null}
      {swap < 1 ? (
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
            opacity: enter * (1 - exit) * (1 - swap),
            transform: `translate(${-swap * 420}px, ${(1 - enter) * 120 + exit * 40}px) scale(${(0.94 + 0.06 * enter) * (1 - 0.25 * swap)})`,
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
          <div style={{ position: 'absolute', top: 30, left: PHONE.w / 2 - 62, width: 124, height: 34, borderRadius: 17, background: '#0D0D0F' }} />
        </div>
      ) : null}
      {d && v && swap > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: DESK.x,
            top: DESK.top,
            width: DESK.w,
            height: DESK.h,
            borderRadius: DESK.radius,
            overflow: 'hidden',
            background: '#fff',
            boxShadow: '0 36px 80px rgba(0,0,0,0.6), 0 8px 18px rgba(0,0,0,0.35)',
            opacity: swap * (1 - exit),
            transform: `translateX(${(1 - swap) * 380}px) scale(${0.86 + 0.14 * swap})`,
          }}
        >
          <div style={{ height: DESK.bar, background: '#2E2E30', display: 'flex', alignItems: 'center', padding: '0 18px', gap: 10 }}>
            {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
              <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />
            ))}
            <div
              style={{
                marginLeft: 18,
                flex: 1,
                height: 28,
                borderRadius: 14,
                background: '#454548',
                color: '#E8E8E8',
                fontFamily: FONTS.body,
                fontWeight: 600,
                fontSize: 18,
                display: 'flex',
                alignItems: 'center',
                paddingLeft: 16,
              }}
            >
              zeket.kg/ky
            </div>
          </div>
          <div style={{ position: 'relative', width: DESK.w, height: DESK.h - DESK.bar, overflow: 'hidden', background: '#F4F8F6' }}>
            <Img
              src={staticFile(d.image)}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: d.imageWidth,
                height: d.imageHeight,
                transformOrigin: '0 0',
                transform: `scale(${ds}) translate(${-v.x}px, ${-v.y}px)`,
              }}
            />
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
