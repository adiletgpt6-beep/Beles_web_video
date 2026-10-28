import React from 'react';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { SubVariant, Subtitle } from './types';
import { COLORS, FONTS } from './layout';

// Five subtitle concepts (A–E) share one measured layout, so the block never jumps when the active word changes.
// A  active-word highlight      B  kinetic typography      C  clean expressive type
// D  moving accent pill         E  phrase build-up + final accent
// The finished film uses one of them (see SUB_VARIANT in BelesReel); the others are rendered for the comparison preview.

const CENTER_X = 495; // block centre of the Reels-safe band 90…900 px (right column of Reels buttons)
const MAX_W = 810; // outer width limit
const BOTTOM_Y = 1596; // lower third: block bottom stays above the 300 px Reels zone (+24 px)
const TOP_Y = 380; // finale: above the presenter's head
const PAD_X = 30;
const PAD_Y = 14;

let ctx: CanvasRenderingContext2D | null = null;
const measure = (text: string, size: number, weight = 800) => {
  if (!ctx) ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return text.length * size * 0.6;
  ctx.font = `${weight} ${size}px Montserrat`;
  return ctx.measureText(text).width;
};

type Placed = { i: number; x: number; w: number; line: number };
type Layout = { size: number; lineH: number; lines: number; innerW: number; words: Placed[] };

// Greedy wrap, at most two lines; the font shrinks only if a long word or a 3rd line would be needed.
const layoutWords = (texts: string[], base: number): Layout => {
  for (let size = base; size >= 46; size -= 2) {
    const maxInner = MAX_W - PAD_X * 2;
    const space = measure(' ', size) * 1.15 + 4;
    const lines: { items: { i: number; w: number }[]; w: number }[] = [{ items: [], w: 0 }];
    let ok = true;
    texts.forEach((t, i) => {
      const w = measure(t, size);
      if (w > maxInner) ok = false;
      const cur = lines[lines.length - 1];
      const add = cur.items.length ? space + w : w;
      if (cur.w + add > maxInner && cur.items.length) lines.push({ items: [{ i, w }], w });
      else {
        cur.items.push({ i, w });
        cur.w += add;
      }
    });
    if (!ok || lines.length > 2) continue;
    if (lines.length === 2) {
      // balanced two-line break: choose the split with the narrowest widest line
      const ws = texts.map((t) => measure(t, size));
      const width = (a: number, b: number) => ws.slice(a, b).reduce((x, y) => x + y, 0) + space * Math.max(0, b - a - 1);
      let best = -1;
      let bestW = Infinity;
      for (let k = 1; k < texts.length; k++) {
        const w = Math.max(width(0, k), width(k, texts.length));
        if (w <= maxInner && w < bestW) {
          bestW = w;
          best = k;
        }
      }
      if (best > 0) {
        lines.length = 0;
        lines.push({ items: ws.slice(0, best).map((w, i) => ({ i, w })), w: width(0, best) });
        lines.push({ items: ws.slice(best).map((w, j) => ({ i: best + j, w })), w: width(best, texts.length) });
      }
    }
    const innerW = Math.max(...lines.map((l) => l.w));
    const words: Placed[] = [];
    lines.forEach((l, li) => {
      let x = (innerW - l.w) / 2;
      l.items.forEach((it) => {
        words.push({ i: it.i, x, w: it.w, line: li });
        x += it.w + space;
      });
    });
    words.sort((a, b) => a.i - b.i);
    return { size, lineH: Math.round(size * 1.2), lines: lines.length, innerW, words };
  }
  const size = 46;
  return { size, lineH: 55, lines: 1, innerW: MAX_W - PAD_X * 2, words: texts.map((_, i) => ({ i, x: 0, w: 0, line: 0 })) };
};

const ease = Easing.bezier(0.22, 1, 0.36, 1);
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export const Subtitles: React.FC<{ subtitles: Subtitle[]; variant: SubVariant }> = ({ subtitles, variant }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cur = subtitles.find((s) => f >= s.startFrame && f < s.endFrame);
  if (!cur) return null;
  const local = f - cur.startFrame;
  const len = cur.endFrame - cur.startFrame;
  const texts = cur.words.map((w) => w.text);
  // active word = last word whose start has been reached
  let active = 0;
  cur.words.forEach((w, i) => {
    if (f >= w.startFrame) active = i;
  });

  const base = variant === 'C' ? 74 : variant === 'B' ? 62 : 70;
  const L = layoutWords(texts, base);
  const boxW = L.innerW + PAD_X * 2;
  const boxH = L.lines * L.lineH + PAD_Y * 2;
  const top = cur.place === 'top' ? TOP_Y : BOTTOM_Y - boxH;
  const left = CENTER_X - boxW / 2;

  const inK = interpolate(local, [0, 5], [0, 1], { ...clamp, easing: ease });
  const outK = interpolate(local, [len - 4, len], [0, 1], clamp);

  const wordStyle = (i: number): React.CSSProperties => {
    const p = L.words[i];
    return {
      position: 'absolute',
      left: PAD_X + p.x,
      top: PAD_Y + p.line * L.lineH,
      width: p.w,
      height: L.lineH,
      lineHeight: `${L.lineH}px`,
      fontFamily: FONTS.body,
      fontWeight: 800,
      fontSize: L.size,
      whiteSpace: 'nowrap',
      textAlign: 'center',
    };
  };
  const shadow = '0 2px 3px rgba(0,0,0,0.45), 0 6px 22px rgba(0,0,0,0.55)';

  let body: React.ReactNode;
  let pill = true;

  if (variant === 'A') {
    body = cur.words.map((w, i) => {
      const on = i === active && f >= cur.words[0].startFrame;
      const k = on ? interpolate(f - w.startFrame, [0, 3], [0, 1], { ...clamp, easing: ease }) : 0;
      return (
        <div key={i} style={{ ...wordStyle(i), color: on ? COLORS.gold : COLORS.white, transform: `scale(${1 + 0.07 * k})`, transformOrigin: '50% 60%' }}>
          {w.text}
        </div>
      );
    });
  } else if (variant === 'B') {
    pill = false;
    // kinetic: words rise in as they are spoken; the key word lands larger on its own line.
    const keyIdx = cur.words.findIndex((w) => w.key);
    const rest = cur.words.map((w, i) => i).filter((i) => i !== keyIdx);
    const restL = layoutWords(rest.map((i) => texts[i]), 62);
    const keySize = Math.min(104, Math.floor((MAX_W - 40) / Math.max(1, measure(keyIdx >= 0 ? texts[keyIdx] : '', 100) / 100)));
    const keyW = keyIdx >= 0 ? measure(texts[keyIdx], keySize) : 0;
    const restH = rest.length ? restL.lines * restL.lineH : 0;
    const keyH = keyIdx >= 0 ? Math.round(keySize * 1.1) : 0;
    const totalH = restH + keyH;
    const baseTop = cur.place === 'top' ? TOP_Y : BOTTOM_Y - totalH;
    const appear = (i: number) => spring({ frame: f - cur.words[i].startFrame + 2, fps, config: { damping: 14, stiffness: 170, mass: 0.7 } });
    body = (
      <>
        {rest.map((wi, j) => {
          const p = restL.words[j];
          const a = appear(wi);
          return (
            <div
              key={wi}
              style={{
                position: 'absolute',
                left: CENTER_X - restL.innerW / 2 + p.x,
                top: baseTop + p.line * restL.lineH,
                width: p.w,
                fontFamily: FONTS.body,
                fontWeight: 800,
                fontSize: restL.size,
                lineHeight: `${restL.lineH}px`,
                whiteSpace: 'nowrap',
                color: COLORS.white,
                textShadow: shadow,
                WebkitTextStroke: '1.5px rgba(20,8,6,0.55)',
                paintOrder: 'stroke fill',
                opacity: Math.min(1, a) * (1 - outK),
                transform: `translateY(${(1 - Math.min(1, a)) * 26 - outK * 14}px)`,
              }}
            >
              {texts[wi]}
            </div>
          );
        })}
        {keyIdx >= 0
          ? (() => {
              const a = appear(keyIdx);
              return (
                <div
                  style={{
                    position: 'absolute',
                    left: CENTER_X - keyW / 2,
                    top: baseTop + restH,
                    width: keyW,
                    fontFamily: FONTS.body,
                    fontWeight: 800,
                    fontSize: keySize,
                    lineHeight: `${keyH}px`,
                    whiteSpace: 'nowrap',
                    color: COLORS.gold,
                    textShadow: shadow,
                    WebkitTextStroke: '2px rgba(20,8,6,0.55)',
                    paintOrder: 'stroke fill',
                    opacity: Math.min(1, a * 1.6) * (1 - outK),
                    transform: `scale(${0.72 + 0.28 * a}) translateY(${-outK * 14}px)`,
                    transformOrigin: '50% 70%',
                  }}
                >
                  {texts[keyIdx]}
                </div>
              );
            })()
          : null}
      </>
    );
    return <AbsoluteFill style={{ pointerEvents: 'none' }}>{body}</AbsoluteFill>;
  } else if (variant === 'C') {
    pill = false;
    body = cur.words.map((w, i) => (
      <div key={i} style={{ ...wordStyle(i), color: w.key ? COLORS.gold : COLORS.white, textShadow: shadow }}>
        {w.text}
      </div>
    ));
  } else if (variant === 'D') {
    // a gold pill glides under the word being spoken; the phrase itself never moves
    const prev = Math.max(0, active - 1);
    const t = interpolate(f - cur.words[active].startFrame, [0, 4], [0, 1], { ...clamp, easing: Easing.bezier(0.45, 0, 0.2, 1) });
    const A = L.words[active === 0 ? 0 : prev];
    const B = L.words[active];
    const lineJump = A.line !== B.line;
    const k = lineJump ? 1 : t;
    const hx = A.x + (B.x - A.x) * k;
    const hw = A.w + (B.w - A.w) * k;
    const hy = B.line * L.lineH;
    const started = f >= cur.words[0].startFrame;
    const hOp = started ? (lineJump ? t : 1) : 0;
    const pill = { left: PAD_X + hx - 12, top: PAD_Y + hy + L.lineH * 0.08, width: hw + 24, height: L.lineH * 0.86 };
    // white text everywhere; an ink copy of the text is clipped to the moving pill, so letters change colour
    // exactly at the pill edge (no dark-on-dark letters while it glides).
    body = (
      <>
        <div style={{ position: 'absolute', ...pill, borderRadius: 14, background: COLORS.gold, boxShadow: '0 4px 14px rgba(0,0,0,0.25)', opacity: hOp }} />
        {cur.words.map((w, i) => (
          <div key={i} style={{ ...wordStyle(i), color: w.key ? COLORS.gold : COLORS.white }}>
            {w.text}
          </div>
        ))}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: hOp,
            clipPath: `inset(${pill.top}px ${boxW - pill.left - pill.width}px ${boxH - pill.top - pill.height}px ${pill.left}px round 14px)`,
          }}
        >
          {cur.words.map((w, i) => (
            <div key={i} style={{ ...wordStyle(i), color: COLORS.ink }}>
              {w.text}
            </div>
          ))}
        </div>
      </>
    );
  } else {
    // E: words build up in a fixed composition, then the key word gets an underline sweep; the block leaves as one
    const lastStart = cur.words[cur.words.length - 1].startFrame;
    const sweep = interpolate(f, [lastStart + 3, lastStart + 10], [0, 1], { ...clamp, easing: ease });
    body = cur.words.map((w, i) => {
      const a = interpolate(f, [w.startFrame - 1, w.startFrame + 3], [0, 1], { ...clamp, easing: ease });
      const p = L.words[i];
      return (
        <div key={i} style={{ ...wordStyle(i), color: w.key && sweep > 0 ? COLORS.gold : COLORS.white, opacity: a, transform: `translateY(${(1 - a) * 12}px)` }}>
          {w.text}
          {w.key ? (
            <div style={{ position: 'absolute', left: 0, bottom: L.lineH * 0.1, height: 6, width: p.w * sweep, borderRadius: 3, background: COLORS.gold }} />
          ) : null}
        </div>
      );
    });
  }

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          left,
          top,
          width: boxW,
          height: boxH,
          opacity: inK * (1 - outK),
          transform: `translateY(${(1 - inK) * 12 - outK * (variant === 'E' ? 12 : 0)}px)`,
        }}
      >
        {pill ? <div style={{ position: 'absolute', inset: 0, borderRadius: 24, background: COLORS.pill }} /> : null}
        {body}
      </div>
    </AbsoluteFill>
  );
};
