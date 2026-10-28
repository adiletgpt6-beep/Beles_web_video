import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Card, ViewKey } from './types';
import { CARD, COLORS, FONTS } from './layout';

const smooth = Easing.bezier(0.45, 0, 0.2, 1);
const inOut = Easing.bezier(0.65, 0, 0.35, 1);
const EXPAND_FRAMES = 12;

// Interpolates the visible window over the screenshot between keyframes (frames are card-local).
export const viewAt = (views: ViewKey[], f: number) => {
  if (f <= views[0].frame) return views[0];
  for (let i = 0; i < views.length - 1; i++) {
    const a = views[i];
    const b = views[i + 1];
    if (f <= b.frame) {
      const k = interpolate(f, [a.frame, b.frame], [0, 1], { easing: smooth });
      return { frame: f, x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, w: a.w + (b.w - a.w) * k };
    }
  }
  return views[views.length - 1];
};

const Cursor: React.FC<{ x: number; y: number; press: number }> = ({ x, y, press }) => (
  <svg
    width={34}
    height={44}
    viewBox="0 0 24 32"
    style={{ position: 'absolute', left: x - 3, top: y - 2, transform: `scale(${1 - press * 0.12})`, filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.45))' }}
  >
    <path d="M2 2 L2 26 L8.5 20 L13 30 L17 28.2 L12.6 18.6 L21 18.6 Z" fill="#fff" stroke="#111" strokeWidth={1.8} strokeLinejoin="round" />
  </svg>
);

export const SiteCard: React.FC<{ card: Card }> = ({ card }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const len = card.endFrame - card.startFrame;
  const enter = spring({ frame: f, fps, config: { damping: 18, stiffness: 140, mass: 0.8 } });
  const exit = interpolate(f, [len - 8, len], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic) });
  // Optional "card → large demo of the same page": the card rect grows (same top edge, same page,
  // continuous scale) and later shrinks back. k = 0 small card, 1 = expanded.
  const ex = card.expand;
  const k = ex
    ? Math.min(
        interpolate(f, [ex.fromFrame, ex.fromFrame + EXPAND_FRAMES], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: inOut }),
        interpolate(f, [ex.toFrame - EXPAND_FRAMES, ex.toFrame], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: inOut }),
      )
    : 0;
  const R = ex
    ? { x: CARD.x + (ex.x - CARD.x) * k, y: CARD.y + (ex.y - CARD.y) * k, w: CARD.w + (ex.w - CARD.w) * k, h: CARD.h + (ex.h - CARD.h) * k }
    : { x: CARD.x, y: CARD.y, w: CARD.w, h: CARD.h };
  // gentle motion blur proportional to the rect speed (only while it moves)
  const kPrev = ex ? Math.min(
    interpolate(f - 1, [ex.fromFrame, ex.fromFrame + EXPAND_FRAMES], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: inOut }),
    interpolate(f - 1, [ex.toFrame - EXPAND_FRAMES, ex.toFrame], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: inOut }),
  ) : 0;
  const blurPx = ex ? Math.min(2.5, Math.abs(k - kPrev) * 18) : 0;
  const contentH = R.h - CARD.bar;
  const v = viewAt(card.views, f);
  const s = R.w / v.w;

  let hl: React.ReactNode = null;
  if (card.highlight) {
    const h = card.highlight;
    const a = interpolate(f, [h.fromFrame, h.fromFrame + 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
    const o = interpolate(f, [h.toFrame - 6, h.toFrame], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    if (a > 0 && o > 0) {
      const pad = 10 * (1 - a);
      hl = (
        <div
          style={{
            position: 'absolute',
            left: (h.x - v.x) * s - pad,
            top: (h.y - v.y) * s - pad,
            width: h.w * s + pad * 2,
            height: h.h * s + pad * 2,
            border: `5px solid ${COLORS.cyan}`,
            borderRadius: 16,
            boxShadow: `0 0 0 4000px rgba(10,4,3,${0.28 * a * o}), 0 0 26px rgba(56,204,255,0.7)`,
            opacity: a * o,
          }}
        />
      );
    }
  }

  let cursor: React.ReactNode = null;
  if (card.cursor && f >= card.cursor.fromFrame - 6 && f <= card.cursor.toFrame + 12) {
    const c = card.cursor;
    const k = interpolate(f, [c.fromFrame, c.toFrame], [0, 1], { easing: smooth, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const press = interpolate(f, [c.toFrame, c.toFrame + 4, c.toFrame + 9], [0, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const op = interpolate(f, [c.fromFrame - 6, c.fromFrame, c.toFrame + 8, c.toFrame + 12], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const sx = c.x0 + (c.x1 - c.x0) * k;
    const sy = c.y0 + (c.y1 - c.y0) * k;
    cursor = (
      <div style={{ opacity: op }}>
        <Cursor x={(sx - v.x) * s} y={(sy - v.y) * s} press={press} />
      </div>
    );
  }

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {ex ? <AbsoluteFill style={{ background: `rgba(14,4,3,${0.55 * k})`, backdropFilter: k > 0.01 ? `blur(${(10 * k).toFixed(1)}px)` : undefined }} /> : null}
      <div
        style={{
          position: 'absolute',
          left: R.x,
          top: R.y,
          width: R.w,
          height: R.h,
          filter: blurPx > 0.2 ? `blur(${blurPx.toFixed(2)}px)` : undefined,
          borderRadius: CARD.radius,
          overflow: 'hidden',
          background: '#fff',
          boxShadow: '0 26px 60px rgba(0,0,0,0.55), 0 6px 16px rgba(0,0,0,0.35)',
          opacity: enter * (1 - exit),
          transform: `translateY(${(1 - enter) * -36 + exit * -20}px) scale(${0.9 + 0.1 * enter - exit * 0.04})`,
          transformOrigin: '50% 0%',
        }}
      >
        {/* browser chrome */}
        <div
          style={{
            height: CARD.bar,
            background: '#2E2E30',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: 9,
          }}
        >
          {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
            <div key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />
          ))}
          <div
            style={{
              marginLeft: 16,
              flex: 1,
              height: 26,
              borderRadius: 13,
              background: '#454548',
              color: '#E8E8E8',
              fontFamily: FONTS.body,
              fontWeight: 600,
              fontSize: 17,
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 16,
            }}
          >
            {card.url}
          </div>
        </div>
        <div style={{ position: 'relative', width: R.w, height: contentH, overflow: 'hidden', background: '#F4F8F6' }}>
          <Img
            src={staticFile(card.image)}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: card.imageWidth,
              height: card.imageHeight,
              transformOrigin: '0 0',
              transform: `scale(${s}) translate(${-v.x}px, ${-v.y}px)`,
            }}
          />
          {hl}
          {cursor}
        </div>
      </div>
      {card.label ? (
        <div
          style={{
            position: 'absolute',
            left: CARD.x + 22,
            top: CARD.y + CARD.h - 20,
            padding: '8px 18px',
            borderRadius: 14,
            background: COLORS.cyan,
            color: COLORS.ink,
            fontFamily: FONTS.body,
            fontWeight: 800,
            fontSize: 26,
            opacity: interpolate(f, [8, 16, len - 8, len], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
            transform: `translateY(${interpolate(f, [8, 16], [10, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px)`,
            boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
          }}
        >
          {card.label}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
