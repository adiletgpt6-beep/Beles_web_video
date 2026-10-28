import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, staticFile, useCurrentFrame } from 'remotion';
import type { BehindTextData, CameraKey, IconRowData, SiteStageData, VideoCardData } from './types';
import { cameraAt } from './camera';
import { COLORS, FONTS } from './layout';
import { viewAt } from './SiteCard';

// V5 compositions: text behind the presenter, presenter in a rounded video card / circle mask,
// a site stage with a moving window, and an icon row tied to the spoken service types.
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const inOut = Easing.bezier(0.65, 0, 0.35, 1);
const out = Easing.bezier(0.16, 1, 0.3, 1);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

let ctx: CanvasRenderingContext2D | null = null;
const measure = (text: string, size: number, weight = 900) => {
  if (!ctx) ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return text.length * size * 0.7;
  ctx.font = `${weight} ${size}px Montserrat`;
  return ctx.measureText(text).width;
};
const fit = (text: string, max: number, maxW: number, weight = 900) => Math.min(max, Math.floor((maxW / Math.max(1, measure(text, 100, weight))) * 100));

// Dark graphic backdrop with a delicate dot pattern and a soft cyan glow; drifts slower than the foreground.
export const PatternBg: React.FC<{ drift?: number }> = ({ drift = 0 }) => (
  <>
    <AbsoluteFill style={{ background: '#0A0E16' }} />
    <AbsoluteFill
      style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.10) 2px, transparent 2.5px)',
        backgroundSize: '36px 36px',
        backgroundPosition: `0 ${-drift}px`,
      }}
    />
    <AbsoluteFill style={{ background: 'radial-gradient(70% 40% at 50% 40%, rgba(56,204,255,0.16), rgba(56,204,255,0) 70%)' }} />
  </>
);

// The raw source video positioned in GLOBAL frame coordinates with p' = s·p + t.
const SourceVideo: React.FC<{ src: string; startFrom: number; s: number; tx: number; ty: number }> = ({ src, startFrom, s, tx, ty }) => (
  <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${s})` }}>
    <OffthreadVideo src={staticFile(src)} startFrom={startFrom} muted style={{ width: 1080, height: 1920 }} />
  </div>
);

// Presenter morphing from the full frame (exact current camera framing) into a rounded card or a circle, and back.
const PresenterMorph: React.FC<{
  video: string;
  srcStart: number;
  sceneStart: number;
  camera: CameraKey[];
  k: number; // 0 = full frame, 1 = shape
  rect: { x: number; y: number; w: number; h: number };
  circle: boolean;
  target: { s: number; fx: number; fy: number }; // source point (fx, fy) → shape centre at scale s
}> = ({ video, srcStart, sceneStart, camera, k, rect, circle, target }) => {
  const f = useCurrentFrame();
  const cam = cameraAt(camera, sceneStart + f);
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const t1 = { s: target.s, tx: cx - target.s * target.fx, ty: cy - target.s * target.fy };
  const s = lerp(cam.s, t1.s, k);
  const tx = lerp(cam.tx, t1.tx, k);
  const ty = lerp(cam.ty, t1.ty, k);
  const R = { x: lerp(0, rect.x, k), y: lerp(0, rect.y, k), w: lerp(1080, rect.w, k), h: lerp(1920, rect.h, k) };
  const radius = circle ? lerp(0, rect.w / 2, k) : lerp(0, 44, k);
  return (
    <div
      style={{
        position: 'absolute',
        left: R.x,
        top: R.y,
        width: R.w,
        height: R.h,
        borderRadius: radius,
        overflow: 'hidden',
        boxShadow: k > 0.02 ? `0 30px 70px rgba(0,0,0,${0.6 * k}), 0 0 0 ${5 * k}px rgba(56,204,255,${0.85 * k})` : undefined,
      }}
    >
      <div style={{ position: 'absolute', left: -R.x, top: -R.y, width: 1080, height: 1920 }}>
        <SourceVideo src={video} startFrom={srcStart} s={s} tx={tx} ty={ty} />
      </div>
    </div>
  );
};

const Word: React.FC<{ text: string; at: number; size: number; color: string; weight: number; stroke?: number; letters?: boolean }> = ({ text, at, size, color, weight, stroke = 0, letters }) => {
  const f = useCurrentFrame();
  const base: React.CSSProperties = {
    display: 'inline-block',
    fontFamily: FONTS.body,
    fontWeight: weight,
    fontSize: size,
    lineHeight: 1,
    color,
    whiteSpace: 'nowrap',
    ...(stroke ? { WebkitTextStroke: `${stroke}px ${COLORS.outline}`, paintOrder: 'stroke fill' } : {}),
  };
  if (!letters) {
    const a = interpolate(f, [at - 2, at + 5], [0, 1], { ...clamp, easing: out });
    return <span style={{ ...base, opacity: a, transform: `translateY(${(1 - a) * size * 0.3}px)` }}>{text}</span>;
  }
  return (
    <span style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
      {Array.from(text).map((ch, i) => {
        const a = interpolate(f, [at - 2 + i, at + 5 + i], [0, 1], { ...clamp, easing: out });
        return (
          <span key={i} style={{ ...base, opacity: a, transform: `translateY(${(1 - a) * size * 0.4}px) scale(${0.75 + 0.25 * a})`, transformOrigin: '50% 80%' }}>
            {ch}
          </span>
        );
      })}
    </span>
  );
};

// ── 1. Very large keyword on the curtain, partly behind the presenter (matte cut-out on top) ──────────────
export const BehindText: React.FC<{ data: BehindTextData; camera: CameraKey[] }> = ({ data, camera }) => {
  const f = useCurrentFrame();
  const g = data.startFrame + f;
  const cam = cameraAt(camera, g);
  const srcFrame = data.srcStart + f;
  const hasMatte = srcFrame >= data.matteFrom && srcFrame < data.matteTo;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {data.words.map((w, i) => {
        if (f < w.from - 2 || f > w.to + 8) return null;
        const size = fit(w.text, 330, 940);
        const inK = interpolate(f, [w.from, w.from + 10], [0, 1], { ...clamp, easing: out });
        const outK = interpolate(f, [w.to - 6, w.to + 2], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
        const drift = interpolate(f, [w.from, w.to], [0, 1], clamp); // slow push, slower than the presenter (depth)
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: data.y - size * 0.55,
              textAlign: 'center',
              opacity: 1 - outK,
              transform: `translateY(${-outK * 80}px) scale(${1 + 0.035 * drift})`,
            }}
          >
            {Array.from(w.text).map((ch, j) => {
              const a = interpolate(f, [w.from + j * 1.4, w.from + j * 1.4 + 8], [0, 1], { ...clamp, easing: out });
              return (
                <span
                  key={j}
                  style={{
                    display: 'inline-block',
                    fontFamily: FONTS.body,
                    fontWeight: 900,
                    fontSize: size,
                    lineHeight: 1,
                    color: w.color === 'cyan' ? COLORS.cyan : 'rgba(255,255,255,0.94)',
                    opacity: a * inK,
                    transform: `translateY(${(1 - a) * size * 0.5}px)`,
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </div>
        );
      })}
      {hasMatte ? (
        <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transformOrigin: '0 0', transform: `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.s})` }}>
          <Img src={staticFile(`media/matte/${srcFrame}.png`)} style={{ width: 1080, height: 1920 }} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ── 2. Frame slides back into a rounded video card, opening space for the phrase ──────────────────────────
export const VideoCard: React.FC<{ data: VideoCardData; camera: CameraKey[]; video: string }> = ({ data, camera, video }) => {
  const f = useCurrentFrame();
  const len = data.endFrame - data.startFrame;
  const k = Math.min(
    interpolate(f, [0, 10], [0, 1], { ...clamp, easing: inOut }),
    interpolate(f, [len - 8, len], [1, 0], { ...clamp, easing: inOut }),
  );
  const textOut = interpolate(f, [len - 9, len - 3], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill style={{ opacity: Math.min(1, k * 1.5) }}>
        <PatternBg drift={f * 0.5} />
      </AbsoluteFill>
      <PresenterMorph video={video} srcStart={data.srcStart} sceneStart={data.startFrame} camera={camera} k={k} rect={data.rect} circle={false} target={data.target} />
      <div style={{ position: 'absolute', left: 90, width: 810, top: data.textTop, opacity: 1 - textOut, transform: `translateY(${-textOut * 30}px)` }}>
        {data.lines.map((l, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'center', gap: 18, marginBottom: l.big ? 10 : 6 }}>
            {l.words.map((w, j) => (
              <Word
                key={j}
                text={w.text}
                at={w.frame}
                size={l.big ? fit(l.words.map((x) => x.text).join(' '), 190, 800) : 66}
                color={l.big ? COLORS.cyan : COLORS.white}
                weight={l.big ? 900 : 800}
                letters={l.big}
              />
            ))}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ── 3. Site stage: the card from the previous shot keeps growing into a large window; presenter in a circle ─
export const SiteStage: React.FC<{ data: SiteStageData; camera: CameraKey[]; video: string }> = ({ data, camera, video }) => {
  const f = useCurrentFrame();
  const len = data.endFrame - data.startFrame;
  const kin = interpolate(f, [0, 11], [0, 1], { ...clamp, easing: inOut });
  const kout = interpolate(f, [len - 10, len], [0, 1], { ...clamp, easing: inOut });
  const k = Math.min(kin, 1 - kout);
  const W0 = data.from; // card rect at the end of the previous shot
  const W1 = data.window;
  const exitY = kout * kout * -1300; // window leaves upwards, accelerating
  const W = { x: lerp(W0.x, W1.x, kin), y: lerp(W0.y, W1.y, kin) + exitY, w: lerp(W0.w, W1.w, kin), h: lerp(W0.h, W1.h, kin) };
  const prevExit = Math.pow(interpolate(f - 1, [len - 10, len], [0, 1], { ...clamp, easing: inOut }), 2) * -1300;
  const blur = Math.min(3, Math.abs(exitY - prevExit) / 40);
  const bar = 40;
  const v = viewAt(data.views, f);
  const s = W.w / v.w;
  const hl = data.highlight;
  const hlA = hl ? Math.min(interpolate(f, [hl.fromFrame, hl.fromFrame + 6], [0, 1], { ...clamp, easing: out }), interpolate(f, [hl.toFrame - 5, hl.toFrame], [1, 0], clamp)) : 0;
  const cu = data.cursor;
  const ck = cu ? interpolate(f, [cu.fromFrame, cu.toFrame], [0, 1], { ...clamp, easing: inOut }) : 0;
  const cOp = cu ? interpolate(f, [cu.fromFrame - 5, cu.fromFrame, cu.toFrame + 10, cu.toFrame + 14], [0, 1, 1, 0], clamp) : 0;
  const press = cu ? interpolate(f, [cu.toFrame, cu.toFrame + 3, cu.toFrame + 8], [0, 1, 0], clamp) : 0;
  const ring = cu ? interpolate(f, [cu.toFrame, cu.toFrame + 12], [0, 1], clamp) : 0;
  const cx = cu ? lerp(cu.x0, cu.x1, ck) : 0;
  const cy = cu ? lerp(cu.y0, cu.y1, ck) : 0;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill style={{ opacity: Math.min(1, k * 1.4) }}>
        <PatternBg drift={f * 0.4} />
      </AbsoluteFill>
      <PresenterMorph video={video} srcStart={data.srcStart} sceneStart={data.startFrame} camera={camera} k={k} rect={data.circle} circle target={data.target} />
      <div
        style={{
          position: 'absolute',
          left: W.x,
          top: W.y,
          width: W.w,
          height: W.h,
          borderRadius: 24,
          overflow: 'hidden',
          background: '#fff',
          boxShadow: '0 34px 80px rgba(0,0,0,0.6), 0 8px 18px rgba(0,0,0,0.35)',
          filter: blur > 0.2 ? `blur(${blur.toFixed(2)}px)` : undefined,
        }}
      >
        <div style={{ height: bar, background: '#2E2E30', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 9 }}>
          {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
            <div key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />
          ))}
          <div style={{ marginLeft: 16, flex: 1, height: 26, borderRadius: 13, background: '#454548', color: '#E8E8E8', fontFamily: FONTS.body, fontWeight: 600, fontSize: 17, display: 'flex', alignItems: 'center', paddingLeft: 16 }}>
            {data.url}
          </div>
        </div>
        <div style={{ position: 'relative', width: W.w, height: W.h - bar, overflow: 'hidden', background: '#F4F8F6' }}>
          <Img src={staticFile(data.image)} style={{ position: 'absolute', left: 0, top: 0, width: data.imageWidth, height: data.imageHeight, transformOrigin: '0 0', transform: `scale(${s}) translate(${-v.x}px, ${-v.y}px)` }} />
          {hl && hlA > 0 ? (
            <div
              style={{
                position: 'absolute',
                left: (hl.x - v.x) * s - 8,
                top: (hl.y - v.y) * s - 8,
                width: hl.w * s + 16,
                height: hl.h * s + 16,
                borderRadius: 18,
                border: `5px solid ${COLORS.cyan}`,
                boxShadow: `0 0 0 4000px rgba(10,14,22,${0.32 * hlA}), 0 0 28px rgba(56,204,255,0.75)`,
                opacity: hlA,
              }}
            />
          ) : null}
          {cu && cOp > 0 ? (
            <div style={{ position: 'absolute', left: (cx - v.x) * s, top: (cy - v.y) * s, opacity: cOp }}>
              {ring > 0 && ring < 1 ? (
                <div style={{ position: 'absolute', left: -30 * ring, top: -30 * ring, width: 60 * ring, height: 60 * ring, borderRadius: '50%', border: `4px solid rgba(56,204,255,${1 - ring})` }} />
              ) : null}
              <svg width={36} height={46} viewBox="0 0 24 32" style={{ position: 'absolute', left: -3, top: -2, transform: `scale(${1 - press * 0.15})`, filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.45))' }}>
                <path d="M2 2 L2 26 L8.5 20 L13 30 L17 28.2 L12.6 18.6 L21 18.6 Z" fill="#fff" stroke="#111" strokeWidth={1.8} strokeLinejoin="round" />
              </svg>
            </div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 4. Service types named in the speech, as simple line icons (not features of zeket.kg) ─────────────────
const ICONS: Record<string, React.ReactNode> = {
  browser: (
    <>
      <rect x="6" y="10" width="52" height="42" rx="6" />
      <line x1="6" y1="20" x2="58" y2="20" />
      <circle cx="13" cy="15" r="1.6" />
      <circle cx="19" cy="15" r="1.6" />
      <rect x="14" y="28" width="22" height="5" rx="2" />
      <line x1="14" y1="40" x2="48" y2="40" />
    </>
  ),
  cart: (
    <>
      <path d="M6 12 h8 l6 26 h28 l6 -18 h-36" />
      <circle cx="24" cy="48" r="4" />
      <circle cx="44" cy="48" r="4" />
    </>
  ),
  calendar: (
    <>
      <rect x="8" y="12" width="48" height="42" rx="6" />
      <line x1="8" y1="24" x2="56" y2="24" />
      <line x1="20" y1="6" x2="20" y2="16" />
      <line x1="44" y1="6" x2="44" y2="16" />
      <path d="M22 38 l7 7 l13 -14" />
    </>
  ),
  layers: (
    <>
      <path d="M32 8 L58 22 L32 36 L6 22 Z" />
      <path d="M6 32 L32 46 L58 32" />
      <path d="M6 42 L32 56 L58 42" />
    </>
  ),
};

export const IconRow: React.FC<{ data: IconRowData }> = ({ data }) => {
  const f = useCurrentFrame();
  const len = data.endFrame - data.startFrame;
  const n = data.items.length;
  const gap = 16;
  const tw = (810 - gap * (n - 1)) / n;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {data.items.map((it, i) => {
        const a = interpolate(f, [it.frame, it.frame + 8], [0, 1], { ...clamp, easing: out });
        const o = interpolate(f, [len - 8 + i, len - 2 + i], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
        const active = f >= it.activeFrom && f < it.activeTo;
        const act = active ? interpolate(f, [it.activeFrom, it.activeFrom + 5], [0, 1], { ...clamp, easing: out }) : 0;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 90 + i * (tw + gap),
              top: data.y,
              width: tw,
              height: 270,
              borderRadius: 26,
              background: `rgba(10,14,22,${0.82})`,
              border: `3px solid ${active ? COLORS.cyan : 'rgba(255,255,255,0.18)'}`,
              boxShadow: active ? `0 0 ${30 * act}px rgba(56,204,255,0.55)` : '0 16px 34px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              opacity: a * (1 - o),
              transform: `translateY(${(1 - a) * 40 - o * 60}px) scale(${(0.9 + 0.1 * a) * (1 + 0.06 * act)})`,
            }}
          >
            <svg width={96} height={96} viewBox="0 0 64 64" fill="none" stroke={active ? COLORS.cyan : '#fff'} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
              {ICONS[it.icon]}
            </svg>
            <div style={{ fontFamily: FONTS.body, fontWeight: 800, fontSize: 33, lineHeight: 1.08, color: active ? COLORS.cyan : '#fff', textAlign: 'center', padding: '0 8px' }}>{it.label}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
