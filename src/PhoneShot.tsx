import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { PhoneShot } from './types';
import { COLORS, FONTS, fitSize } from './layout';
import { viewAt } from './SiteCard';

// Separate full-screen plan: real mobile screenshot scrolling inside a phone, then a MATCH CUT to the desktop
// version: the phone screen morphs into the browser window while the same element (the hero headline)
// keeps its place and size — both pages are positioned so that headline stays continuous.
// The presenter stays visible (blurred) behind it; the plan spans the cut between two takes (J/L-cut).
// It leaves with a directional move up (light motion blur), revealing the close-up.
const PHONE = { w: 520, h: 1040, top: 290, radius: 62, bezel: 16 };
const DESK = { x: 50, w: 980, top: 420, h: 640, bar: 46, radius: 22 };
const MORPH = 14; // frames
const EXIT = 10; // frames
const inOut = Easing.bezier(0.65, 0, 0.35, 1);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const BrowserBar: React.FC<{ url: string; opacity?: number }> = ({ url, opacity = 1 }) => (
  <div style={{ height: DESK.bar, background: '#2E2E30', display: 'flex', alignItems: 'center', padding: '0 18px', gap: 10, opacity }}>
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
      {url}
    </div>
  </div>
);

export const PhoneShotView: React.FC<{ shot: PhoneShot }> = ({ shot }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const len = shot.endFrame - shot.startFrame;
  const enter = spring({ frame: f, fps, config: { damping: 22, stiffness: 120 } });
  const ex = interpolate(f, [len - EXIT, len], [0, 1], { ...clamp, easing: Easing.bezier(0.55, 0, 0.75, 0.2) });
  const exPrev = interpolate(f - 1, [len - EXIT, len], [0, 1], { ...clamp, easing: Easing.bezier(0.55, 0, 0.75, 0.2) });
  const exitBlur = Math.min(3, Math.abs(ex - exPrev) * 22);
  const bg = interpolate(f, [0, 8], [0, 1], clamp) * (1 - ex);
  const d = shot.desktop;
  const m = d ? interpolate(f, [d.fromFrame, d.fromFrame + MORPH], [0, 1], { ...clamp, easing: inOut }) : 0;
  const mPrev = d ? interpolate(f - 1, [d.fromFrame, d.fromFrame + MORPH], [0, 1], { ...clamp, easing: inOut }) : 0;
  const morphBlur = Math.min(2, Math.abs(m - mPrev) * 14);
  const phoneEnd = d ? d.fromFrame : len - 10;

  // phone screen geometry (global px)
  const screen = { x: (1080 - PHONE.w) / 2 + PHONE.bezel, y: PHONE.top + PHONE.bezel, w: PHONE.w - PHONE.bezel * 2, h: PHONE.h - PHONE.bezel * 2 };
  const sm = screen.w / shot.imageWidth;
  const scroll = interpolate(f, [10, phoneEnd], [shot.scrollFrom, shot.scrollTo], { ...clamp, easing: Easing.bezier(0.45, 0, 0.25, 1) });
  // desktop content geometry (global px)
  const content = { x: DESK.x, y: DESK.top + DESK.bar, w: DESK.w, h: DESK.h - DESK.bar };
  const v = d ? viewAt(d.views, f) : null;
  const sd = v ? content.w / v.w : 1;

  const labelEnd = shot.labelEndFrame ?? len;
  const labelOp = enter * interpolate(f, [labelEnd - 7, labelEnd], [1, 0], clamp);
  const exitT = `translateY(${-ex * 300}px) scale(${1 - 0.08 * ex})`;

  let device: React.ReactNode = null;
  if (!d || m === 0) {
    // phone
    device = (
      <div
        style={{
          position: 'absolute',
          left: screen.x - PHONE.bezel,
          top: PHONE.top,
          width: PHONE.w,
          height: PHONE.h,
          borderRadius: PHONE.radius,
          background: '#0D0D0F',
          boxShadow: '0 40px 90px rgba(0,0,0,0.6), inset 0 0 0 3px #3A3A3E',
          opacity: enter * (d ? 1 : 1 - ex),
          transform: `translateY(${(1 - enter) * 120}px) scale(${0.94 + 0.06 * enter})`,
        }}
      >
        <div style={{ position: 'absolute', left: PHONE.bezel, top: PHONE.bezel, width: screen.w, height: screen.h, borderRadius: PHONE.radius - PHONE.bezel, overflow: 'hidden', background: '#fff' }}>
          <Img
            src={staticFile(shot.image)}
            style={{ position: 'absolute', left: 0, top: 0, width: shot.imageWidth, height: shot.imageHeight, transformOrigin: '0 0', transform: `scale(${sm}) translateY(${-scroll}px)` }}
          />
        </div>
        <div style={{ position: 'absolute', top: 30, left: PHONE.w / 2 - 62, width: 124, height: 34, borderRadius: 17, background: '#0D0D0F' }} />
      </div>
    );
  } else if (d && v && m < 1 && d.match) {
    // MATCH CUT: the screen rect morphs into the browser content rect; both pages are placed so the
    // matched element (hero headline) has the same centre and width on screen at every instant.
    const mt = d.match.mobile;
    const dt = d.match.desktop;
    const p0 = { x: screen.x + mt.cx * sm, y: screen.y + (mt.cy - shot.scrollTo) * sm, w: mt.w * sm };
    const v0 = d.views[0];
    const sd0 = content.w / v0.w;
    const p1 = { x: content.x + (dt.cx - v0.x) * sd0, y: content.y + (dt.cy - v0.y) * sd0, w: dt.w * sd0 };
    const P = { x: lerp(p0.x, p1.x, m), y: lerp(p0.y, p1.y, m), w: lerp(p0.w, p1.w, m) };
    const R = { x: lerp(screen.x, content.x, m), y: lerp(screen.y, content.y, m), w: lerp(screen.w, content.w, m), h: lerp(screen.h, content.h, m) };
    const bezel = lerp(PHONE.bezel, 0, m);
    const radius = lerp(PHONE.radius - PHONE.bezel, 0, m);
    const smk = P.w / mt.w;
    const sdk = P.w / dt.w;
    const xf = interpolate(m, [0.42, 0.6], [0, 1], clamp); // short cross-over: no lingering double headline
    device = (
      <div style={{ filter: morphBlur > 0.2 ? `blur(${morphBlur.toFixed(2)}px)` : undefined }}>
        {/* frame: phone bezel shrinking into the browser window + its bar */}
        <div
          style={{
            position: 'absolute',
            left: R.x - bezel,
            top: R.y - bezel - DESK.bar * m,
            width: R.w + bezel * 2,
            height: R.h + bezel * 2 + DESK.bar * m,
            borderRadius: lerp(PHONE.radius, DESK.radius, m),
            background: '#0D0D0F',
            boxShadow: '0 40px 90px rgba(0,0,0,0.6)',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', left: 0, top: 0, right: 0 }}>
            <BrowserBar url="zeket.kg/ky" opacity={interpolate(m, [0.5, 1], [0, 1], clamp)} />
          </div>
        </div>
        <div style={{ position: 'absolute', left: R.x, top: R.y, width: R.w, height: R.h, borderRadius: radius, overflow: 'hidden', background: '#F4F8F6' }}>
          <Img
            src={staticFile(shot.image)}
            style={{ position: 'absolute', left: 0, top: 0, width: shot.imageWidth, height: shot.imageHeight, transformOrigin: '0 0', opacity: 1 - xf, transform: `translate(${P.x - R.x - mt.cx * smk}px, ${P.y - R.y - mt.cy * smk}px) scale(${smk})` }}
          />
          <Img
            src={staticFile(d.image)}
            style={{ position: 'absolute', left: 0, top: 0, width: d.imageWidth, height: d.imageHeight, transformOrigin: '0 0', opacity: xf, transform: `translate(${P.x - R.x - dt.cx * sdk}px, ${P.y - R.y - dt.cy * sdk}px) scale(${sdk})` }}
          />
        </div>
      </div>
    );
  } else if (d && v) {
    // desktop window
    device = (
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
          opacity: 1 - ex * 0.9,
          transform: exitT,
          filter: exitBlur > 0.2 ? `blur(${exitBlur.toFixed(2)}px)` : undefined,
        }}
      >
        <BrowserBar url="zeket.kg/ky" />
        <div style={{ position: 'relative', width: DESK.w, height: DESK.h - DESK.bar, overflow: 'hidden', background: '#F4F8F6' }}>
          <Img
            src={staticFile(d.image)}
            style={{ position: 'absolute', left: 0, top: 0, width: d.imageWidth, height: d.imageHeight, transformOrigin: '0 0', transform: `scale(${sd}) translate(${-v.x}px, ${-v.y}px)` }}
          />
        </div>
      </div>
    );
  }

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill
        style={{
          backdropFilter: bg > 0.01 ? `blur(${(22 * bg).toFixed(1)}px)` : undefined,
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
      {device}
    </AbsoluteFill>
  );
};
