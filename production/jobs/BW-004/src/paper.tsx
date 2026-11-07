import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import type { Overlay } from './types';

// «Үч ката» — mode-B scenes on a warm paper "audit sheet". Original vector graphics only; every phone screen
// is an explicitly labelled demo layout (WEBSITE_SHOWCASE_RULES §4), no real site is shown or imitated.
//
// Timing contract of every B scene (scene-local frames, dur = endFrame − startFrame):
//   [0, IN)            empty paper dissolves in over the presenter        (no scene element yet)
//   [IN, dur − OUT)    paper fully opaque, scene elements live            (presenter fully covered)
//   [dur − OUT, dur)   empty paper dissolves out to the presenter         (elements already gone)
// Elements fade out during the last EXIT frames before dur − OUT, i.e. still on fully opaque paper.
export const IN = 10;
export const OUT = 10;
const EXIT = 8;

export const P = {
  paper: '#F2EEE5',
  grid: 'rgba(16,35,63,0.065)',
  ink: '#10233F',
  soft: '#5B6577',
  red: '#E0473F',
  green: '#16A36A',
  blue: '#1E6FE0',
  line: '#D9D2C3',
};
const HEAD = 'Oswald, sans-serif';
const BODY = 'Montserrat, sans-serif';
const CX = 495; // centre of the Reels-safe band (90…900 px)
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const ramp = (f: number, a: number, len = 12) => interpolate(f, [a, a + len], [0, 1], { ...clamp, easing: ease });

export const overlayActive = (overlays: Overlay[], frame: number) => overlays.some((o) => frame >= o.startFrame && frame < o.endFrame);

// Paper opacity of a scene at scene-local frame f (exported for the A/B audit).
export const paperOpacity = (f: number, dur: number, hold?: boolean) => {
  const a = interpolate(f, [0, IN], [0, 1], { ...clamp, easing: Easing.inOut(Easing.sin) });
  const b = hold ? 1 : interpolate(f, [dur - OUT, dur], [1, 0], { ...clamp, easing: Easing.inOut(Easing.sin) });
  return Math.min(a, b);
};

const Paper: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill style={{ background: P.paper, overflow: 'hidden' }}>
    <AbsoluteFill
      style={{
        top: -60,
        bottom: -60,
        backgroundImage: `linear-gradient(${P.grid} 2px, transparent 2px), linear-gradient(90deg, ${P.grid} 2px, transparent 2px)`,
        backgroundSize: '60px 60px',
        transform: `translateY(${-(f * 0.5) % 60}px)`,
      }}
    />
    <AbsoluteFill style={{ background: 'radial-gradient(90% 70% at 50% 42%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 60%, rgba(120,100,70,0.10) 100%)' }} />
  </AbsoluteFill>
);

const Tag: React.FC<{ text: string; t: number; color?: string; y?: number }> = ({ text, t, color = P.red, y = 196 }) => {
  const a = ramp(t, 0, 12);
  return (
    <div style={{ position: 'absolute', left: 0, width: CX * 2, top: y, display: 'flex', justifyContent: 'center', opacity: a, transform: `translateY(${(1 - a) * 20}px)` }}>
      <div style={{ background: color, color: '#fff', fontFamily: BODY, fontWeight: 900, fontSize: 40, letterSpacing: 4, padding: '12px 30px 10px', borderRadius: 40 }}>{text}</div>
    </div>
  );
};

// Headline that can swap to a second wording at frame `swap` (old line slides up and out, new one in).
const Headline: React.FC<{ a: string; b?: string; swap?: number; t: number; y?: number; size?: number; colorB?: string }> = ({ a, b, swap = 1e9, t, y = 282, size = 70, colorB = P.green }) => {
  const enter = ramp(t, 3, 14);
  const k = b ? ramp(t, swap, 12) : 0;
  const line = (text: string, op: number, dy: number, color: string) => (
    <div style={{ position: 'absolute', left: 90, width: 810, top: y + dy, textAlign: 'center', fontFamily: BODY, fontWeight: 900, fontSize: size, lineHeight: 1.08, color, opacity: op }}>{text}</div>
  );
  return (
    <>
      {line(a, enter * (1 - k), (1 - enter) * 24 - k * 30, P.ink)}
      {b ? line(b, k, (1 - k) * 30, colorB) : null}
    </>
  );
};

const Phone: React.FC<{ children: React.ReactNode; t: number; top?: number; w?: number; h?: number }> = ({ children, t, top = 470, w = 600, h = 1090 }) => {
  const a = ramp(t, 4, 16);
  return (
    <div
      style={{
        position: 'absolute',
        left: CX - w / 2,
        top,
        width: w,
        height: h,
        borderRadius: 74,
        background: P.ink,
        padding: 18,
        boxSizing: 'border-box',
        boxShadow: '0 40px 80px rgba(16,35,63,0.22), 0 8px 18px rgba(16,35,63,0.18)',
        opacity: a,
        transform: `translateY(${(1 - a) * 70}px)`,
      }}
    >
      <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 58, overflow: 'hidden', background: '#fff' }}>
        {children}
        <div style={{ position: 'absolute', top: 16, left: '50%', marginLeft: -60, width: 120, height: 30, borderRadius: 20, background: P.ink }} />
      </div>
    </div>
  );
};

const Check: React.FC<{ size: number; progress: number; color?: string; stroke?: number }> = ({ size, progress, color = P.green, stroke = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <path d="M22 54 L42 72 L80 30" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - progress} />
  </svg>
);
const Cross: React.FC<{ size: number; progress: number; color?: string; stroke?: number }> = ({ size, progress, color = P.red, stroke = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <path d="M28 28 L72 72" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.min(1, progress * 2)} />
    <path d="M72 28 L28 72" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.max(0, progress * 2 - 1)} />
  </svg>
);

const Badge: React.FC<{ x: number; y: number; t: number; at: number; ok: boolean; size?: number }> = ({ x, y, t, at, ok, size = 130 }) => {
  const a = ramp(t, at, 10);
  if (a <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: size, background: ok ? P.green : P.red, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${0.6 + 0.4 * a})`, opacity: a, boxShadow: '0 12px 30px rgba(16,35,63,0.25)' }}>
      {ok ? <Check size={size * 0.8} progress={ramp(t, at + 4, 12)} color="#fff" /> : <Cross size={size * 0.8} progress={ramp(t, at + 4, 12)} color="#fff" />}
    </div>
  );
};

const DemoLabel: React.FC<{ t: number; y?: number }> = ({ t, y = 1586 }) => (
  <div style={{ position: 'absolute', left: 90, width: 810, top: y, textAlign: 'center', fontFamily: BODY, fontWeight: 700, fontSize: 26, letterSpacing: 3, color: P.soft, opacity: 0.8 * ramp(t, 10, 12) }}>ДЕМО-МАКЕТ</div>
);

// ---------- scene: "3 ката" ----------
const Three: React.FC<{ t: number; beats: Record<string, number> }> = ({ t, beats }) => {
  const k = ramp(t, Math.max(0, beats.three - IN - 2), 16);
  const kata = beats.kata - IN;
  const no = beats.no - IN;
  return (
    <>
      <div style={{ position: 'absolute', left: 90, width: 810, top: 236, textAlign: 'center', fontFamily: BODY, fontWeight: 800, fontSize: 54, color: P.soft, opacity: ramp(t, 0, 12) }}>Сайт жасатканда</div>
      <div style={{ position: 'absolute', left: 90, width: 810, top: 300, textAlign: 'center', fontFamily: HEAD, fontWeight: 700, fontSize: 660, lineHeight: 1, color: P.ink, opacity: k, transform: `scale(${0.9 + 0.1 * k})`, transformOrigin: '50% 60%' }}>3</div>
      <div style={{ position: 'absolute', left: 90, width: 810, top: 990, display: 'flex', justifyContent: 'center', gap: 6 }}>
        {Array.from('КАТА').map((ch, i) => {
          const a = ramp(t, kata + i * 2, 10);
          return (
            <span key={i} style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 190, lineHeight: 1, letterSpacing: 10, color: P.red, opacity: a, transform: `translateY(${(1 - a) * 40}px)`, display: 'inline-block' }}>
              {ch}
            </span>
          );
        })}
      </div>
      <div style={{ position: 'absolute', left: 90, width: 810, top: 1270, display: 'flex', justifyContent: 'center', gap: 46 }}>
        {[1, 2, 3].map((n, i) => {
          const a = ramp(t, kata + 6 + i * 4, 12);
          return (
            <div key={n} style={{ position: 'relative', width: 180, height: 180, borderRadius: 30, border: `8px solid ${P.ink}`, boxSizing: 'border-box', background: '#fff', opacity: a, transform: `translateY(${(1 - a) * 30}px)` }}>
              <div style={{ position: 'absolute', left: -22, top: -22, width: 56, height: 56, borderRadius: 56, background: P.ink, color: '#fff', fontFamily: HEAD, fontSize: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</div>
              <div style={{ position: 'absolute', left: 18, top: 18 }}>
                <Cross size={130} progress={ramp(t, no + i * 5, 12)} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

// ---------- scene: beauty vs convenience (1-ката) ----------
const PrettyScreen: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill style={{ background: 'linear-gradient(160deg, #3B1C5A 0%, #8C3B7A 55%, #E7A47A 100%)', overflow: 'hidden' }}>
    {[0, 1, 2].map((i) => (
      <div key={i} style={{ position: 'absolute', width: 380 - i * 90, height: 380 - i * 90, borderRadius: 400, border: '2px solid rgba(255,255,255,0.35)', left: 120 + i * 40 + Math.sin((t + i * 20) / 22) * 20, top: 160 + i * 70 + Math.cos((t + i * 15) / 25) * 16 }} />
    ))}
    <div style={{ position: 'absolute', left: 40, top: 520, fontFamily: BODY, fontStyle: 'italic', fontWeight: 700, fontSize: 70, lineHeight: 1, color: 'rgba(255,255,255,0.92)', letterSpacing: 2 }}>Сулуулук</div>
    {[0, 1, 2, 3, 4].map((i) => (
      <div key={i} style={{ position: 'absolute', left: 40, top: 630 + i * 22, width: 300 + ((i * 53) % 120), height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.28)' }} />
    ))}
    <div style={{ position: 'absolute', left: 400, top: 900, width: 110, height: 34, borderRadius: 17, background: 'rgba(255,255,255,0.16)', color: 'rgba(255,255,255,0.45)', fontFamily: BODY, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>заказ</div>
  </AbsoluteFill>
);

const ClearScreen: React.FC<{ t: number; btn: number }> = ({ t, btn }) => (
  <AbsoluteFill style={{ background: '#fff', overflow: 'hidden', fontFamily: BODY }}>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 150, background: '#F5F7FA', display: 'flex', alignItems: 'flex-end', padding: '0 34px 24px', boxSizing: 'border-box', gap: 18 }}>
      <div style={{ width: 44, display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 8 }}>
        {[0, 1, 2].map((i) => <div key={i} style={{ height: 6, borderRadius: 3, background: P.ink }} />)}
      </div>
      <div style={{ fontWeight: 900, fontSize: 38, color: P.ink }}>Менин дүкөнүм</div>
    </div>
    <div style={{ position: 'absolute', left: 34, right: 34, top: 190, fontWeight: 900, fontSize: 60, lineHeight: 1.05, color: P.ink }}>Тез жана жөнөкөй</div>
    {[0, 1].map((i) => (
      <div key={i} style={{ position: 'absolute', left: 34, right: 34, top: 370 + i * 190, height: 160, borderRadius: 26, background: '#F2F4F8', display: 'flex', alignItems: 'center', gap: 24, padding: '0 24px', boxSizing: 'border-box' }}>
        <div style={{ width: 112, height: 112, borderRadius: 20, background: i ? '#FFD9A8' : '#BFE3FF' }} />
        <div>
          <div style={{ fontWeight: 800, fontSize: 34, color: P.ink }}>{i ? 'Товар 2' : 'Товар 1'}</div>
          <div style={{ fontWeight: 700, fontSize: 30, color: P.soft, marginTop: 8 }}>Баасы, сүрөт</div>
        </div>
      </div>
    ))}
    <div style={{ position: 'absolute', left: 34, right: 34, top: 790, height: 130, borderRadius: 30, background: P.green, color: '#fff', fontWeight: 900, fontSize: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + 0.03 * Math.sin(Math.max(0, t - btn) / 5) * (t > btn ? 1 : 0)})` }}>Заказ берүү</div>
  </AbsoluteFill>
);

const Beauty: React.FC<{ t: number; beats: Record<string, number> }> = ({ t, beats }) => {
  const bad = beats.bad - IN;
  const good = beats.good - IN;
  const wipe = interpolate(t, [good, good + 16], [100, 0], { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) });
  const ring = ramp(t, bad, 10) * (1 - ramp(t, good - 4, 8));
  return (
    <>
      <Tag text="1-КАТА" t={t} />
      <Headline a="Кооз, бирок ыңгайсыз" b="Кардарга ыңгайлуу" swap={good} t={t} />
      <Phone t={t}>
        <PrettyScreen t={t} />
        <div style={{ position: 'absolute', inset: 0, clipPath: `inset(${wipe}% 0 0 0)` }}>
          <ClearScreen t={t} btn={good + 10} />
        </div>
        {ring > 0 ? (
          <div style={{ position: 'absolute', left: 372, top: 868, width: 166, height: 98, borderRadius: 60, border: `6px dashed ${P.red}`, opacity: ring, transform: `scale(${1.25 - 0.25 * ring})` }} />
        ) : null}
      </Phone>
      {ring > 0 ? (
        <div style={{ position: 'absolute', left: 300, top: 1236, opacity: ring, background: P.red, color: '#fff', fontFamily: BODY, fontWeight: 900, fontSize: 40, padding: '12px 26px', borderRadius: 18 }}>Баскыч кайда?</div>
      ) : null}
      <Badge x={CX + 290} y={500} t={t} at={bad} ok={false} />
      {t >= good ? <Badge x={CX + 290} y={500} t={t} at={good + 6} ok /> : null}
      <DemoLabel t={t} />
    </>
  );
};

// ---------- scene: not checked on a phone (2-ката) ----------
const DesktopSqueezed: React.FC<{ t: number }> = ({ t }) => {
  // a 1300-px desktop layout shown at phone width without adaptation: tiny, cut off on the right
  const s = 0.5;
  return (
    <AbsoluteFill style={{ background: '#fff', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: -Math.min(40, t * 0.6), top: 70, width: 1300, transform: `scale(${s})`, transformOrigin: '0 0', fontFamily: BODY }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 34, height: 90, padding: '0 30px', background: '#F2F4F8' }}>
          <div style={{ fontWeight: 900, fontSize: 34, color: P.ink }}>Менин дүкөнүм</div>
          {['Башкы', 'Каталог', 'Акциялар', 'Жеткирүү', 'Төлөм', 'Байланыш', 'Биз жөнүндө'].map((x) => (
            <div key={x} style={{ fontSize: 24, fontWeight: 700, color: P.soft }}>{x}</div>
          ))}
        </div>
        <div style={{ margin: '30px 30px 0', height: 380, borderRadius: 24, background: 'linear-gradient(120deg, #1E3A64, #2E5E9A)', padding: 40, boxSizing: 'border-box', color: '#fff' }}>
          <div style={{ fontWeight: 900, fontSize: 64 }}>Жаңы коллекция</div>
          {[0, 1, 2].map((j) => <div key={j} style={{ marginTop: 18, height: 12, width: 520 - j * 90, borderRadius: 6, background: 'rgba(255,255,255,0.35)' }} />)}
          <div style={{ marginTop: 40, width: 200, height: 54, borderRadius: 12, background: '#fff', color: P.ink, fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Көрүү</div>
        </div>
        {[0, 1].map((row) => (
        <div key={row} style={{ display: 'flex', gap: 30, padding: '30px 30px 0' }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ flex: 1, height: 420, borderRadius: 20, background: ['#BFE3FF', '#FFD9A8', '#D7F2DF'][(i + row) % 3], padding: 24, boxSizing: 'border-box' }}>
              <div style={{ fontWeight: 900, fontSize: 32, color: P.ink }}>Товар {row * 3 + i + 1}</div>
              {[0, 1, 2, 3].map((j) => <div key={j} style={{ marginTop: 14, height: 10, width: 260 - j * 30, borderRadius: 5, background: 'rgba(16,35,63,0.25)' }} />)}
              <div style={{ marginTop: 160, width: 120, height: 40, borderRadius: 10, background: P.ink, color: '#fff', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Сатып алуу</div>
            </div>
          ))}
        </div>
        ))}
        {[0, 1, 2, 3, 4, 5].map((j) => <div key={j} style={{ margin: j ? '0 30px 16px' : '30px 30px 16px', height: 12, width: 1100 - j * 90, borderRadius: 6, background: 'rgba(16,35,63,0.18)' }} />)}
      </div>
      <div style={{ position: 'absolute', left: 20, right: 20, bottom: 26, height: 10, borderRadius: 5, background: 'rgba(16,35,63,0.12)' }}>
        <div style={{ width: '42%', height: '100%', borderRadius: 5, background: 'rgba(16,35,63,0.45)' }} />
      </div>
    </AbsoluteFill>
  );
};

const MobileScreen: React.FC = () => (
  <AbsoluteFill style={{ background: '#fff', fontFamily: BODY, overflow: 'hidden' }}>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 150, background: '#F5F7FA', display: 'flex', alignItems: 'flex-end', padding: '0 34px 24px', boxSizing: 'border-box', gap: 18 }}>
      <div style={{ width: 44, display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 8 }}>
        {[0, 1, 2].map((i) => <div key={i} style={{ height: 6, borderRadius: 3, background: P.ink }} />)}
      </div>
      <div style={{ fontWeight: 900, fontSize: 38, color: P.ink }}>Менин дүкөнүм</div>
    </div>
    {[0, 1, 2].map((i) => (
      <div key={i} style={{ position: 'absolute', left: 34, right: 34, top: 180 + i * 270, height: 240, borderRadius: 28, background: ['#BFE3FF', '#FFD9A8', '#D7F2DF'][i], padding: 26, boxSizing: 'border-box' }}>
        <div style={{ fontWeight: 900, fontSize: 44, color: P.ink }}>Товар {i + 1}</div>
        <div style={{ marginTop: 14, height: 14, width: 300, borderRadius: 7, background: 'rgba(16,35,63,0.25)' }} />
        <div style={{ position: 'absolute', left: 26, right: 26, bottom: 24, height: 76, borderRadius: 20, background: P.ink, color: '#fff', fontWeight: 900, fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Сатып алуу</div>
      </div>
    ))}
  </AbsoluteFill>
);

const Mobile: React.FC<{ t: number; beats: Record<string, number> }> = ({ t, beats }) => {
  const fix = beats.fix - IN;
  const k = interpolate(t, [fix, fix + 16], [0, 1], { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) });
  const warn = (i: number) => ramp(t, 14 + i * 8, 10) * (1 - ramp(t, fix - 4, 8));
  return (
    <>
      <Tag text="2-КАТА" t={t} />
      <Headline a="Телефондо текшерилген эмес" b="Телефонго ылайыкталган" swap={fix} t={t} />
      <Phone t={t}>
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - k, transform: `scale(${1 + 0.06 * k})` }}>
          <DesktopSqueezed t={t} />
        </div>
        <div style={{ position: 'absolute', inset: 0, opacity: k, transform: `translateY(${(1 - k) * 60}px)` }}>
          <MobileScreen />
        </div>
      </Phone>
      {[
        { text: 'Майда текст', x: 108, y: 760 },
        { text: 'Кесилип калды', x: 520, y: 1010 },
      ].map((w, i) =>
        warn(i) > 0 ? (
          <div key={i} style={{ position: 'absolute', left: w.x, top: w.y, opacity: warn(i), transform: `translateY(${(1 - warn(i)) * 16}px)`, background: P.red, color: '#fff', fontFamily: BODY, fontWeight: 900, fontSize: 38, padding: '12px 24px', borderRadius: 18, boxShadow: '0 10px 24px rgba(16,35,63,0.2)' }}>
            {w.text}
          </div>
        ) : null,
      )}
      <Badge x={CX + 290} y={500} t={t} at={14} ok={false} />
      {t >= fix ? <Badge x={CX + 290} y={500} t={t} at={fix + 6} ok /> : null}
      <DemoLabel t={t} />
    </>
  );
};

// ---------- scene: everything taken into account (payoff of the three crosses) ----------
const Checklist: React.FC<{ t: number; beats: Record<string, number> }> = ({ t, beats }) => {
  const rows = ['Ыңгайлуулук', 'Телефондогу көрүнүш', 'Өнүктүрүү'];
  const at = [beats.r1, beats.r2, beats.r3].map((b) => b - IN);
  return (
    <>
      <Headline a="Баарын эске алабыз" t={t} y={300} size={78} />
      {rows.map((r, i) => {
        const a = ramp(t, 4 + i * 4, 12);
        const g = ramp(t, at[i], 12);
        const y = 560 + i * 290;
        return (
          <div key={i} style={{ position: 'absolute', left: 90, width: 810, top: y, height: 220, opacity: a, transform: `translateX(${(1 - a) * -40}px)` }}>
            <div style={{ position: 'absolute', left: 0, top: 20, width: 180, height: 180, borderRadius: 30, border: `8px solid ${g > 0.5 ? P.green : P.ink}`, boxSizing: 'border-box', background: '#fff' }}>
              <div style={{ position: 'absolute', left: -22, top: -22, width: 56, height: 56, borderRadius: 56, background: P.ink, color: '#fff', fontFamily: HEAD, fontSize: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div>
              <div style={{ position: 'absolute', left: 18, top: 18, opacity: 1 - g }}>
                <Cross size={130} progress={1} />
              </div>
              <div style={{ position: 'absolute', left: 18, top: 18 }}>
                <Check size={130} progress={g} />
              </div>
            </div>
            <div style={{ position: 'absolute', left: 220, top: 0, height: 220, width: 590, display: 'flex', alignItems: 'center', fontFamily: BODY, fontWeight: 900, fontSize: r.length > 14 ? 54 : 64, lineHeight: 1.05, color: g > 0.5 ? P.ink : P.soft }}>{r}</div>
            <div style={{ position: 'absolute', left: 220, top: 168, height: 8, borderRadius: 4, width: 560 * g, background: P.green }} />
          </div>
        );
      })}
    </>
  );
};

// ---------- scene: WhatsApp CTA (final, holds to the end) ----------
const Cta: React.FC<{ t: number; beats: Record<string, number> }> = ({ t, beats }) => {
  const num = beats.num - IN;
  const btn = beats.btn - IN;
  const icon = ramp(t, 4, 14);
  const digits = '0998 08 38 28';
  const pulse = t > btn + 12 ? 1 + 0.025 * Math.sin((t - btn - 12) / 7) : 1;
  return (
    <>
      <Headline a="Сапаттуу сайт керекпи?" t={t} y={250} size={66} />
      <div style={{ position: 'absolute', left: CX - 120, top: 470, width: 240, height: 240, borderRadius: 240, background: '#25D366', opacity: icon, transform: `scale(${0.7 + 0.3 * icon})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 24px 50px rgba(37,211,102,0.35)' }}>
        <svg width={150} height={150} viewBox="0 0 100 100">
          <path d="M50 12 C29 12 13 27 13 46 C13 54 16 61 21 67 L17 86 L36 79 C40 80 45 81 50 81 C71 81 87 65 87 46 C87 27 71 12 50 12 Z" fill="none" stroke="#fff" strokeWidth={7} strokeLinejoin="round" />
          <path d="M38 33 C36 33 34 35 34 38 C34 50 47 63 59 63 C62 63 64 61 64 59 L64 55 L57 52 L54 56 C49 54 45 50 43 45 L47 42 L44 35 Z" fill="#fff" />
        </svg>
      </div>
      <div style={{ position: 'absolute', left: 90, width: 810, top: 760, textAlign: 'center', fontFamily: BODY, fontWeight: 900, fontSize: 58, color: '#128C4A', opacity: ramp(t, 8, 12) }}>WhatsApp</div>
      <div style={{ position: 'absolute', left: 60, width: 870, top: 870, display: 'flex', justifyContent: 'center' }}>
        {Array.from(digits).map((ch, i) => {
          const a = ramp(t, num + i * 1.2, 9);
          return (
            <span key={i} style={{ display: 'inline-block', width: ch === ' ' ? 30 : undefined, fontFamily: HEAD, fontWeight: 700, fontSize: 136, lineHeight: 1, color: P.ink, opacity: a, transform: `translateY(${(1 - a) * 30}px)` }}>
              {ch === ' ' ? '' : ch}
            </span>
          );
        })}
      </div>
      <div style={{ position: 'absolute', left: CX - 330, top: 1120, width: 660, height: 140, borderRadius: 70, background: P.green, color: '#fff', fontFamily: BODY, fontWeight: 900, fontSize: 58, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: ramp(t, btn, 12), transform: `scale(${(0.85 + 0.15 * ramp(t, btn, 12)) * pulse})`, boxShadow: '0 18px 40px rgba(22,163,106,0.35)' }}>
        Бизге жазыңыз
      </div>
    </>
  );
};

export const PaperScene: React.FC<{ o: Overlay }> = ({ o }) => {
  const f = useCurrentFrame();
  const dur = o.endFrame - o.startFrame;
  const paper = paperOpacity(f, dur, o.hold);
  const liveEnd = o.hold ? dur + 1 : dur - OUT;
  const live = f >= IN && f < liveEnd;
  const t = f - IN;
  const exit = o.hold ? 0 : interpolate(f, [liveEnd - EXIT, liveEnd], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const Scene = { three: Three, beauty: Beauty, mobile: Mobile, checklist: Checklist, cta: Cta }[o.kind];
  return (
    <AbsoluteFill style={{ opacity: paper }}>
      <Paper f={f} />
      {live ? (
        <AbsoluteFill style={{ opacity: 1 - exit, transform: `translateY(${-exit * 26}px)` }}>
          <Scene t={t} beats={o.beats} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
