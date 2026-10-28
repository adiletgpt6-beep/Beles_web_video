import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import type { TypeSceneData } from './types';
import { COLORS, FONTS } from './layout';

// Short full-screen typographic scene: dark background, thin grid, soft cyan glow, big animated type
// and a rising line for "көтөрүүгө". It is revealed from below (continuing the upward exit of the site plan)
// and leaves with an upward wipe that uncovers the presenter close-up. All words are the presenter's own,
// each entering when it is spoken.
const REVEAL = 10;
const EXIT = 7;
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const out = Easing.bezier(0.16, 1, 0.3, 1);
const inOut = Easing.bezier(0.65, 0, 0.35, 1);

let ctx: CanvasRenderingContext2D | null = null;
const measure = (text: string, size: number) => {
  if (!ctx) ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return text.length * size * 0.7;
  ctx.font = `900 ${size}px Montserrat`;
  return ctx.measureText(text).width;
};

const BigWord: React.FC<{ text: string; start: number; maxW: number }> = ({ text, start, maxW }) => {
  const f = useCurrentFrame();
  const upper = text.toLocaleUpperCase('ky');
  const size = Math.min(190, Math.floor((maxW / measure(upper, 100)) * 100));
  return (
    <div style={{ display: 'flex', justifyContent: 'center', height: size * 1.02, alignItems: 'flex-end' }}>
      {Array.from(upper).map((ch, i) => {
        const a = interpolate(f, [start + i * 1.1, start + i * 1.1 + 7], [0, 1], { ...clamp, easing: out });
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              fontFamily: FONTS.body,
              fontWeight: 900,
              fontSize: size,
              lineHeight: 1,
              color: COLORS.cyan,
              opacity: a,
              transform: `translateY(${(1 - a) * size * 0.45}px)`,
              filter: a < 0.98 ? `blur(${((1 - a) * 6).toFixed(2)}px)` : undefined,
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};

export const TypeScene: React.FC<{ scene: TypeSceneData }> = ({ scene }) => {
  const f = useCurrentFrame();
  const len = scene.endFrame - scene.startFrame;
  const reveal = interpolate(f, [0, REVEAL], [0, 1], { ...clamp, easing: inOut }); // bottom → top
  const exit = interpolate(f, [len - EXIT, len], [0, 1], { ...clamp, easing: inOut }); // bottom edge moves up
  const clip = `inset(${((1 - reveal) * 100).toFixed(2)}% 0 ${(exit * 100).toFixed(2)}% 0)`;
  const drift = f * 0.6;
  const smallA = interpolate(f, [scene.small.frame - 2, scene.small.frame + 5], [0, 1], { ...clamp, easing: out });
  const rise = scene.rise;
  const lineK = rise ? interpolate(f, [rise.frame - 8, rise.frame + 10], [0, 1], { ...clamp, easing: inOut }) : 0;
  const riseA = rise ? interpolate(f, [rise.frame - 2, rise.frame + 5], [0, 1], { ...clamp, easing: out }) : 0;
  // rising line (polyline drawn progressively)
  const pts: [number, number][] = [
    [150, 1560],
    [330, 1500],
    [470, 1530],
    [640, 1400],
    [780, 1420],
    [930, 1250],
  ];
  const segLens = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = segLens.reduce((a, b) => a + b, 0);
  const head = (() => {
    let d = lineK * total;
    for (let i = 0; i < segLens.length; i++) {
      if (d <= segLens[i]) {
        const k = d / segLens[i];
        return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
      }
      d -= segLens[i];
    }
    return pts[pts.length - 1];
  })();

  return (
    <AbsoluteFill style={{ clipPath: clip, pointerEvents: 'none' }}>
      <AbsoluteFill style={{ background: '#0A0E16' }} />
      {/* thin grid, drifting slowly upwards */}
      <AbsoluteFill
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          backgroundPosition: `0 ${-drift}px`,
        }}
      />
      <AbsoluteFill style={{ background: 'radial-gradient(60% 38% at 50% 46%, rgba(56,204,255,0.22), rgba(56,204,255,0) 70%)' }} />
      <div style={{ position: 'absolute', left: 90, width: 810, top: 560, textAlign: 'center' }}>
        <div
          style={{
            fontFamily: FONTS.body,
            fontWeight: 800,
            fontSize: 70,
            color: COLORS.white,
            opacity: smallA,
            transform: `translateY(${(1 - smallA) * 24}px)`,
            marginBottom: 22,
          }}
        >
          {scene.small.text}
        </div>
        {scene.big.map((b, i) => (
          <BigWord key={i} text={b.text} start={b.frame - 2} maxW={810} />
        ))}
      </div>
      {rise ? (
        <>
          <svg width={1080} height={1920} style={{ position: 'absolute', left: 0, top: 0 }}>
            <defs>
              <linearGradient id="rise" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor={COLORS.cyan} stopOpacity={0.2} />
                <stop offset="1" stopColor={COLORS.cyan} stopOpacity={1} />
              </linearGradient>
            </defs>
            <polyline
              points={pts.map((p) => p.join(',')).join(' ')}
              fill="none"
              stroke="url(#rise)"
              strokeWidth={9}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={total}
              strokeDashoffset={total * (1 - lineK)}
            />
            {lineK > 0.02 ? <circle cx={head[0]} cy={head[1]} r={16} fill={COLORS.cyan} /> : null}
          </svg>
          <div
            style={{
              position: 'absolute',
              left: 120,
              top: 1250,
              fontFamily: FONTS.body,
              fontWeight: 800,
              fontSize: 66,
              color: COLORS.white,
              opacity: riseA,
              transform: `translateY(${(1 - riseA) * 24}px)`,
            }}
          >
            {rise.text}
          </div>
        </>
      ) : null}
    </AbsoluteFill>
  );
};
