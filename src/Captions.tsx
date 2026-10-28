import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import type { Subtitle } from './types';
import { COLORS, FONTS } from './layout';

// V4 kinetic captions — text sits directly on the picture: no plate, no blur, no glow, no gradient.
// Only a very thin dark outline on the letters keeps white readable over the white shirt.
// Layout per phrase: small white words before the key word on one line, the key word(s) big and cyan
// on their own line (letters enter one after another), following words small after it.
// Every word enters at the moment it is spoken; the finished phrase leaves as one movement.

const CENTER_X = 495; // centre of the Reels-safe band 90…900 px
const MAX_W = 800;
const PLACE_BOTTOM: Record<string, number> = { chest: 1560, low: 1600 }; // block bottom (px)
const TOP_Y = 330; // 'top': block top, above the head
const SMALL = 62;
const BIG = 124;
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const out = Easing.bezier(0.16, 1, 0.3, 1);

let ctx: CanvasRenderingContext2D | null = null;
const measure = (text: string, size: number, weight: number) => {
  if (!ctx) ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return text.length * size * 0.62;
  ctx.font = `${weight} ${size}px Montserrat`;
  return ctx.measureText(text).width;
};

const outline = (px: number): React.CSSProperties => ({
  WebkitTextStroke: `${px}px ${COLORS.outline}`,
  paintOrder: 'stroke fill',
});

type Row = { idx: number[]; big: boolean };

// Split a phrase into rows: [pre-key small] [key run big] [post-key small] (rows that fit are merged).
const rowsFor = (s: Subtitle): Row[] => {
  const k0 = s.words.findIndex((w) => w.key);
  if (k0 < 0) {
    const all = s.words.map((_, i) => i);
    const w = measure(s.words.map((x) => x.text).join(' '), SMALL + 10, 800);
    if (w <= MAX_W) return [{ idx: all, big: false }];
    const h = Math.ceil(all.length / 2);
    return [
      { idx: all.slice(0, h), big: false },
      { idx: all.slice(h), big: false },
    ];
  }
  let k1 = k0;
  while (k1 + 1 < s.words.length && s.words[k1 + 1].key) k1++;
  const rows: Row[] = [];
  const pre = s.words.map((_, i) => i).filter((i) => i < k0);
  const post = s.words.map((_, i) => i).filter((i) => i > k1);
  if (pre.length) rows.push({ idx: pre, big: false });
  rows.push({ idx: s.words.map((_, i) => i).filter((i) => i >= k0 && i <= k1), big: true });
  if (post.length) rows.push({ idx: post, big: false });
  return rows;
};

const Letters: React.FC<{ text: string; start: number; size: number; color: string; stroke: number }> = ({ text, start, size, color, stroke }) => {
  const f = useCurrentFrame();
  const chars = Array.from(text);
  return (
    <span style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
      {chars.map((ch, i) => {
        const a = interpolate(f, [start + i * 0.9, start + i * 0.9 + 6], [0, 1], { ...clamp, easing: out });
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              color,
              fontFamily: FONTS.body,
              fontWeight: 900,
              fontSize: size,
              lineHeight: 1,
              ...outline(stroke),
              opacity: a,
              transform: `translateY(${(1 - a) * size * 0.35}px) scale(${0.7 + 0.3 * a})`,
              transformOrigin: '50% 80%',
            }}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
};

export const Captions: React.FC<{ subtitles: Subtitle[] }> = ({ subtitles }) => {
  const f = useCurrentFrame();
  const cur = subtitles.find((s) => f >= s.startFrame && f < s.endFrame);
  if (!cur || cur.scene) return null;
  const len = cur.endFrame - cur.startFrame;
  const local = f - cur.startFrame;
  const rows = rowsFor(cur);
  // big size: fit the key run into the band
  const bigText = rows.find((r) => r.big)?.idx.map((i) => cur.words[i].text).join(' ') ?? '';
  const bigSize = bigText ? Math.min(BIG, Math.floor((MAX_W / Math.max(1, measure(bigText, 100, 900))) * 100)) : BIG;
  const rowH = (r: Row) => (r.big ? bigSize * 1.04 : SMALL * 1.18);
  const totalH = rows.reduce((h, r) => h + rowH(r), 0);
  const place = cur.place ?? 'chest';
  const top = place === 'top' ? TOP_Y : PLACE_BOTTOM[place] - totalH;
  // leave: the whole phrase lifts and fades in the last 5 frames
  const leave = interpolate(local, [len - 5, len], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });

  let y = top;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 1 - leave, transform: `translateY(${-leave * 22}px)` }}>
        {rows.map((r, ri) => {
          const h = rowH(r);
          const rowTop = y;
          y += h;
          return (
            <div
              key={ri}
              style={{
                position: 'absolute',
                left: CENTER_X - MAX_W / 2,
                width: MAX_W,
                top: rowTop,
                height: h,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-end',
                gap: r.big ? bigSize * 0.22 : SMALL * 0.28,
              }}
            >
              {r.idx.map((i) => {
                const w = cur.words[i];
                const start = Math.max(cur.startFrame, w.startFrame - 2);
                if (r.big) return <Letters key={i} text={w.text} start={start} size={bigSize} color={COLORS.cyan} stroke={Math.max(6, bigSize * 0.06)} />;
                const a = interpolate(f, [start, start + 5], [0, 1], { ...clamp, easing: out });
                return (
                  <span
                    key={i}
                    style={{
                      display: 'inline-block',
                      whiteSpace: 'nowrap',
                      fontFamily: FONTS.body,
                      fontWeight: 800,
                      fontSize: SMALL,
                      lineHeight: 1.1,
                      color: w.key ? COLORS.cyan : COLORS.white,
                      ...outline(7),
                      opacity: a,
                      transform: `translateY(${(1 - a) * 18}px)`,
                    }}
                  >
                    {w.text}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
