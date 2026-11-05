import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { FONTS } from '../../../../src/layout';
import type { Overlay } from './types';

// BW-003 "Түнкү смена" (night shift) motion scenes. The presenter's words are about a customer who wants to
// buy at 2 a.m., Instagram DMs that wait for a reply, a site that takes the order itself and works day and
// night. Every scene is an original mock-up (labelled ДЕМО where it imitates an app screen): no real brand
// screens, no invented statistics — only the moments the presenter names.
//
// Look: deep-night glass panels (indigo), warm amber accent for the "night" elements, white for text.
// Captions stay white + cyan (shared Captions component). Headings use Oswald uppercase, body Montserrat.
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const out = Easing.bezier(0.16, 1, 0.3, 1);
const inOut = Easing.bezier(0.65, 0, 0.35, 1);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export const NIGHT = {
  amber: '#FFB547',
  amberDeep: '#F28C1E',
  panel: 'rgba(8,12,30,0.86)',
  panelLine: 'rgba(255,181,71,0.45)',
  ink: '#0B1230',
  white: '#FFFFFF',
  dim: 'rgba(255,255,255,0.62)',
  green: '#25D366',
};

const K = (f: number, from: number, d = 8, easing = out) => interpolate(f, [from, from + d], [0, 1], { ...clamp, easing });
const leaveK = (f: number, len: number, d = 7) => interpolate(f, [len - d, len], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });

// Glass panel used by every scene (enter: rise + fade; leave: lift + fade).
const Panel: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  enter: number;
  leave: number;
  radius?: number;
  children?: React.ReactNode;
  label?: string;
  style?: React.CSSProperties;
}> = ({ x, y, w, h, enter, leave, radius = 36, children, label, style }) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: radius,
      background: NIGHT.panel,
      border: `2px solid ${NIGHT.panelLine}`,
      boxShadow: '0 24px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04) inset',
      opacity: enter * (1 - leave),
      transform: `translateY(${(1 - enter) * 46 - leave * 40}px) scale(${0.96 + 0.04 * enter})`,
      overflow: 'hidden',
      ...style,
    }}
  >
    {children}
    {label ? (
      <div
        style={{
          position: 'absolute',
          top: 14,
          right: 18,
          padding: '5px 12px',
          borderRadius: 14,
          background: 'rgba(255,181,71,0.18)',
          border: `1.5px solid ${NIGHT.panelLine}`,
          color: NIGHT.amber,
          fontFamily: FONTS.body,
          fontWeight: 800,
          fontSize: 18,
          letterSpacing: 1,
        }}
      >
        {label}
      </div>
    ) : null}
  </div>
);

const Head: React.FC<{ text: string; size?: number; color?: string; k: number; style?: React.CSSProperties }> = ({ text, size = 64, color = NIGHT.white, k, style }) => (
  <div
    style={{
      fontFamily: FONTS.head,
      fontWeight: 700,
      fontSize: size,
      lineHeight: 1,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      color,
      opacity: k,
      transform: `translateY(${(1 - k) * 22}px)`,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {text}
  </div>
);

const Body: React.FC<{ text: string; size?: number; color?: string; weight?: number; k: number; style?: React.CSSProperties }> = ({ text, size = 30, color = NIGHT.white, weight = 700, k, style }) => (
  <div style={{ fontFamily: FONTS.body, fontWeight: weight, fontSize: size, lineHeight: 1.2, color, opacity: k, transform: `translateY(${(1 - k) * 14}px)`, ...style }}>{text}</div>
);

const Svg: React.FC<{ d: React.ReactNode; size?: number; color?: string; stroke?: number; box?: number; style?: React.CSSProperties }> = ({ d, size = 32, color = NIGHT.white, stroke = 2.4, box = 24, style }) => (
  <svg width={size} height={size} viewBox={`0 0 ${box} ${box}`} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {d}
  </svg>
);
const I = {
  cart: (
    <>
      <path d="M3 4h2.5l2.2 10.5h10.6L21 7H7" />
      <circle cx="9.5" cy="19" r="1.4" />
      <circle cx="17" cy="19" r="1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  bell: (
    <>
      <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>
  ),
  send: <path d="M3 11.5L21 3l-6.5 18-3-8z" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" />
    </>
  ),
  bag: (
    <>
      <path d="M5 8h14l-1 13H6z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </>
  ),
};

// WhatsApp glyph: simple-icons (CC0-1.0), https://simpleicons.org
const WA_PATH =
  'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z';

// ── 1. Hook: a big night clock at 02:00 and a customer who wants to buy right now ───────────────────────────
// beats: clock (clock appears), ticks (colon starts blinking / minutes advance), cart (product card drops in)
const ClockHook: React.FC<{ o: Overlay }> = ({ o }) => {
  const f = useCurrentFrame();
  const len = o.endFrame - o.startFrame;
  const B = o.beats;
  const enter = K(f, B.clock ?? 0, 10);
  const leave = leaveK(f, len);
  const minutes = f >= (B.ticks ?? 1e9) ? Math.min(59, Math.floor((f - B.ticks) / 18)) : 0;
  const colon = Math.floor(f / 15) % 2 === 0 ? 1 : 0.25;
  const moon = K(f, (B.clock ?? 0) + 4, 12);
  const cartK = K(f, B.cart ?? 1e9, 9);
  const y = (o.y as number) ?? 190;
  const stars = [
    [150, 60, 3],
    [310, 120, 2],
    [520, 40, 2.5],
    [700, 110, 2],
    [930, 70, 3],
    [840, 170, 2],
    [240, 200, 2],
  ];
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {/* night sky above the presenter: stars + moon */}
      {stars.map(([sx, sy, r], i) => (
        <div key={i} style={{ position: 'absolute', left: sx, top: sy, width: r * 2, height: r * 2, borderRadius: r, background: '#fff', opacity: enter * (1 - leave) * (0.45 + 0.4 * Math.abs(Math.sin((f + i * 9) / 11))) }} />
      ))}
      <div style={{ position: 'absolute', left: 820, top: 130, opacity: moon * (1 - leave), transform: `translateY(${(1 - moon) * 30}px)`, filter: 'drop-shadow(0 0 26px rgba(255,181,71,0.55))' }}>
        <Svg d={I.moon} size={118} color={NIGHT.amber} stroke={1.6} />
      </div>
      {/* the clock */}
      <div
        style={{
          position: 'absolute',
          left: 90,
          top: y,
          width: 640,
          opacity: enter * (1 - leave),
          transform: `translateY(${(1 - enter) * 40 - leave * 40}px)`,
        }}
      >
        <div style={{ fontFamily: FONTS.head, fontWeight: 700, fontSize: 250, lineHeight: 1, letterSpacing: 4, color: NIGHT.white, fontVariantNumeric: 'tabular-nums', textShadow: '0 10px 40px rgba(0,0,0,0.55)' }}>
          02<span style={{ color: NIGHT.amber, opacity: colon }}>:</span>
          {String(minutes).padStart(2, '0')}
        </div>
        <div style={{ marginTop: 6, fontFamily: FONTS.body, fontWeight: 800, fontSize: 36, letterSpacing: 2, color: NIGHT.amber, opacity: K(f, (B.clock ?? 0) + 6, 10) }}>{(o.caption as string) ?? 'ТҮНКҮ САА 02:00'}</div>
      </div>
      {/* the product the customer wants, dropping in as an order card */}
      <Panel x={90} y={y + 330} w={900} h={150} enter={cartK} leave={leave} radius={30} label="ДЕМО">
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '0 28px', height: '100%' }}>
          <div style={{ width: 92, height: 92, borderRadius: 24, background: 'rgba(255,181,71,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Svg d={I.cart} size={54} color={NIGHT.amber} />
          </div>
          <div style={{ flex: 1 }}>
            <Body text={(o.cardTitle as string) ?? 'Кардар товар тандады'} size={34} weight={800} k={cartK} />
            <Body text={(o.cardLine as string) ?? 'Сатып алгысы келет — азыр'} size={26} color={NIGHT.dim} weight={600} k={K(f, (B.cart ?? 0) + 4, 9)} />
          </div>
          <div style={{ width: 16, height: 16, borderRadius: 8, background: NIGHT.amber, boxShadow: `0 0 ${14 + 10 * Math.abs(Math.sin(f / 6))}px ${NIGHT.amber}` }} />
        </div>
      </Panel>
    </AbsoluteFill>
  );
};

// ── 2. DM thread that waits for a reply (generic chat UI, no brand marks) ──────────────────────────────────
// beats: panel, msg1, msg2, seen, wait (the "waiting" line + clock starts), sleep (the owner's phone shows Zzz)
const ChatWait: React.FC<{ o: Overlay }> = ({ o }) => {
  const f = useCurrentFrame();
  const len = o.endFrame - o.startFrame;
  const B = o.beats;
  const enter = K(f, B.panel ?? 0, 10);
  const leave = leaveK(f, len);
  const x = (o.x as number) ?? 90;
  const y = (o.y as number) ?? 180;
  const w = (o.w as number) ?? 640;
  const h = (o.h as number) ?? 560;
  const m1 = K(f, B.msg1 ?? 1e9, 8);
  const m2 = K(f, B.msg2 ?? 1e9, 8);
  const seen = K(f, B.seen ?? 1e9, 6);
  const waitK = K(f, B.wait ?? 1e9, 8);
  const waitFrames = Math.max(0, f - (B.wait ?? 1e9));
  // the clock on the thread runs fast: 02:03 → hours pass while nobody answers
  const minutesPassed = Math.floor(waitFrames * 3.2);
  const hh = (2 + Math.floor((3 + minutesPassed) / 60)) % 24;
  const mm = (3 + minutesPassed) % 60;
  const dots = Math.floor(f / 8) % 3;
  const Bubble: React.FC<{ k: number; text: string; time: string; mine?: boolean }> = ({ k, text, time, mine }) => (
    <div style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: 10, opacity: k, transform: `translateY(${(1 - k) * 18}px) scale(${0.94 + 0.06 * k})`, transformOrigin: mine ? '100% 100%' : '0 100%' }}>
      <div style={{ maxWidth: '84%', padding: '12px 20px', borderRadius: 24, borderBottomLeftRadius: mine ? 24 : 8, borderBottomRightRadius: mine ? 8 : 24, background: mine ? NIGHT.amber : 'rgba(255,255,255,0.12)', color: mine ? NIGHT.ink : NIGHT.white, fontFamily: FONTS.body, fontWeight: 700, fontSize: 28, lineHeight: 1.2 }}>
        {text}
        <div style={{ fontSize: 18, fontWeight: 600, opacity: 0.65, marginTop: 2, textAlign: 'right' }}>{time}</div>
      </div>
    </div>
  );
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <Panel x={x} y={y} w={w} h={h} enter={enter} leave={leave} label="ДЕМО">
        {/* thread header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 22px 10px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ width: 46, height: 46, borderRadius: 23, background: 'linear-gradient(135deg, #FFB547, #F2587A)' }} />
          <div>
            <Body text={(o.contact as string) ?? 'Кардар'} size={27} weight={800} k={enter} />
            <Body text={(o.status as string) ?? 'онлайн · 02:03'} size={19} color={NIGHT.dim} weight={600} k={enter} />
          </div>
        </div>
        <div style={{ padding: '14px 22px 0' }}>
          <Bubble k={m1} text={(o.msg1 as string) ?? 'Саламатсызбы! Бул товар барбы?'} time="02:03" />
          <Bubble k={m2} text={(o.msg2 as string) ?? 'Баасы канча? Заказ кылайын'} time="02:04" />
          {/* "seen" + typing dots that never become an answer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: seen, marginTop: 2 }}>
            <Svg d={I.check} size={24} color={NIGHT.dim} />
            <Body text={(o.seen as string) ?? 'Жооп жок…'} size={23} color={NIGHT.dim} weight={600} k={seen} />
            <span style={{ display: 'inline-flex', gap: 6, marginLeft: 4 }}>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{ width: 10, height: 10, borderRadius: 5, background: NIGHT.dim, opacity: dots === i ? 1 : 0.3 }} />
              ))}
            </span>
          </div>
        </div>
        {/* waiting clock */}
        <div style={{ position: 'absolute', left: 22, right: 22, bottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: waitK, transform: `translateY(${(1 - waitK) * 16}px)` }}>
          <Body text={(o.waitLabel as string) ?? 'Кардар күтүп жатат'} size={26} color={NIGHT.amber} weight={800} k={waitK} />
          <div style={{ fontFamily: FONTS.head, fontWeight: 700, fontSize: 54, color: NIGHT.white, fontVariantNumeric: 'tabular-nums', letterSpacing: 2 }}>
            {String(hh).padStart(2, '0')}
            <span style={{ color: NIGHT.amber, opacity: Math.floor(f / 10) % 2 ? 1 : 0.3 }}>:</span>
            {String(mm).padStart(2, '0')}
          </div>
        </div>
      </Panel>
      {/* the owner's phone, face down and asleep */}
      {B.sleep != null ? <Zzz x={x + w + 40} y={y + 60} k={K(f, B.sleep, 10) * (1 - leave)} f={f} /> : null}
    </AbsoluteFill>
  );
};

const Zzz: React.FC<{ x: number; y: number; k: number; f: number }> = ({ x, y, k, f }) => (
  <div style={{ position: 'absolute', left: x, top: y, opacity: k }}>
    {[0, 1, 2].map((i) => {
      const p = ((f / 40 + i * 0.33) % 1 + 1) % 1;
      return (
        <div key={i} style={{ position: 'absolute', left: i * 26 + p * 30, top: -p * 90, fontFamily: FONTS.head, fontWeight: 700, fontSize: 44 + i * 14, color: NIGHT.amber, opacity: (1 - p) * 0.95, transform: `rotate(${-12 + i * 6}deg)` }}>
          z
        </div>
      );
    })}
  </div>
);

// ── 3. The site takes the order itself: a receipt prints out of the top band ────────────────────────────────
// beats: ticket (paper starts sliding down), line1, line2, line3 (rows print), paid (stamp), done
const OrderTicket: React.FC<{ o: Overlay }> = ({ o }) => {
  const f = useCurrentFrame();
  const len = o.endFrame - o.startFrame;
  const B = o.beats;
  const leave = leaveK(f, len);
  const x = (o.x as number) ?? 250;
  const y = (o.y as number) ?? 150;
  const w = (o.w as number) ?? 580;
  const slide = K(f, B.ticket ?? 0, 22, inOut);
  const rows = (o.rows as { label: string; value: string }[]) ?? [
    { label: 'Заказ', value: '№ 2041' },
    { label: 'Убакыт', value: '02:04' },
    { label: 'Төлөм', value: 'кабыл алынды' },
  ];
  const paid = K(f, B.paid ?? 1e9, 7, Easing.bezier(0.2, 1.4, 0.4, 1));
  const h = 150 + rows.length * 66 + 120;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {/* printer slot */}
      <div style={{ position: 'absolute', left: x - 24, top: y - 10, width: w + 48, height: 26, borderRadius: 13, background: 'rgba(8,12,30,0.95)', border: `2px solid ${NIGHT.panelLine}`, opacity: K(f, (B.ticket ?? 0) - 4, 6) * (1 - leave), boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} />
      <div style={{ position: 'absolute', left: x, top: y + 4, width: w, height: h, overflow: 'hidden', opacity: 1 - leave, transform: `translateY(${-leave * 60}px)` }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: w,
            height: h,
            background: '#FFF9EE',
            borderRadius: '0 0 18px 18px',
            boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
            transform: `translateY(${(slide - 1) * h}px)`,
            clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 14px), 96% 100%, 92% calc(100% - 14px), 88% 100%, 84% calc(100% - 14px), 80% 100%, 76% calc(100% - 14px), 72% 100%, 68% calc(100% - 14px), 64% 100%, 60% calc(100% - 14px), 56% 100%, 52% calc(100% - 14px), 48% 100%, 44% calc(100% - 14px), 40% 100%, 36% calc(100% - 14px), 32% 100%, 28% calc(100% - 14px), 24% 100%, 20% calc(100% - 14px), 16% 100%, 12% calc(100% - 14px), 8% 100%, 4% calc(100% - 14px), 0 100%)',
          }}
        >
          <div style={{ padding: '30px 36px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Svg d={I.globe} size={40} color={NIGHT.amberDeep} />
              <Head text={(o.title as string) ?? 'Сайт заказ кабыл алды'} size={44} color={NIGHT.ink} k={1} style={{ letterSpacing: 0.5 }} />
            </div>
            <div style={{ height: 2, background: 'repeating-linear-gradient(90deg, #C9B99A 0 14px, transparent 14px 24px)', margin: '20px 0 14px' }} />
            {rows.map((r, i) => {
              const k = K(f, B[`line${i + 1}`] ?? 1e9, 7);
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', height: 66, opacity: k, transform: `translateX(${(1 - k) * -16}px)` }}>
                  <span style={{ fontFamily: FONTS.body, fontWeight: 700, fontSize: 30, color: '#5B5443' }}>{r.label}</span>
                  <span style={{ fontFamily: FONTS.head, fontWeight: 700, fontSize: 40, color: NIGHT.ink, letterSpacing: 1 }}>{r.value}</span>
                </div>
              );
            })}
          </div>
          {/* "PAID / ACCEPTED" stamp */}
          <div style={{ position: 'absolute', right: 34, bottom: 34, padding: '10px 22px', border: `5px solid ${NIGHT.green}`, borderRadius: 16, color: NIGHT.green, fontFamily: FONTS.head, fontWeight: 700, fontSize: 48, letterSpacing: 2, textTransform: 'uppercase', opacity: paid, transform: `rotate(-9deg) scale(${0.6 + 0.4 * paid})`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Svg d={I.check} size={44} color={NIGHT.green} stroke={3.2} />
            {(o.stamp as string) ?? 'Кабыл алынды'}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 4. Day-and-night dial: the sun and the moon travel over the site that never closes ─────────────────────
// beats: dial, run (sun starts moving), moon (moon reaches the top), text (heading), text2
const DayNightDial: React.FC<{ o: Overlay }> = ({ o }) => {
  const f = useCurrentFrame();
  const len = o.endFrame - o.startFrame;
  const B = o.beats;
  const enter = K(f, B.dial ?? 0, 10);
  const leave = leaveK(f, len);
  const cx = (o.cx as number) ?? 540;
  const cy = (o.cy as number) ?? 560;
  const R = (o.r as number) ?? 390;
  // one full day over the scene: sun on the first half of the arc, moon on the second
  const run = interpolate(f, [B.run ?? 0, (B.moon ?? len) + 20], [0, 1], { ...clamp, easing: inOut });
  const ang = Math.PI - run * Math.PI * 2; // start left, over the top, down right, back under
  const px = cx + R * Math.cos(ang);
  const py = cy - R * Math.sin(ang);
  const isSun = Math.sin(ang) >= 0 ? 1 : 0;
  const ang2 = ang + Math.PI;
  const mx = cx + R * Math.cos(ang2);
  const my = cy - R * Math.sin(ang2);
  const t1 = K(f, B.text ?? 1e9, 9);
  const t2 = K(f, B.text2 ?? 1e9, 9);
  const o1 = enter * (1 - leave);
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <svg width={1080} height={1920} style={{ position: 'absolute', left: 0, top: 0, opacity: o1 }}>
        <defs>
          <linearGradient id="dialGrad" x1="0" x2="1">
            <stop offset="0" stopColor={NIGHT.amber} stopOpacity="0.9" />
            <stop offset="1" stopColor="#7FB8FF" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <path d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`} stroke="url(#dialGrad)" strokeWidth={5} fill="none" strokeDasharray="10 14" />
        <line x1={cx - R - 20} y1={cy} x2={cx + R + 20} y2={cy} stroke="rgba(255,255,255,0.25)" strokeWidth={3} />
        {/* sun */}
        {isSun ? (
          <g transform={`translate(${px - 36} ${py - 36})`} style={{ filter: 'drop-shadow(0 0 22px rgba(255,181,71,0.7))' }}>
            <svg width={72} height={72} viewBox="0 0 24 24" fill="none" stroke={NIGHT.amber} strokeWidth={2.2} strokeLinecap="round">
              {I.sun}
            </svg>
          </g>
        ) : (
          <g transform={`translate(${mx - 36} ${my - 36})`} style={{ filter: 'drop-shadow(0 0 22px rgba(127,184,255,0.7))' }}>
            <svg width={72} height={72} viewBox="0 0 24 24" fill="none" stroke="#CFE4FF" strokeWidth={2} strokeLinecap="round">
              {I.moon}
            </svg>
          </g>
        )}
      </svg>
      {/* the site, lit under the arc */}
      <div style={{ position: 'absolute', left: cx - 170, top: cy - 230, width: 340, opacity: o1, textAlign: 'center' }}>
        <div style={{ margin: '0 auto', width: 150, height: 150, borderRadius: 40, background: NIGHT.panel, border: `2px solid ${NIGHT.panelLine}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 ${30 + 14 * Math.abs(Math.sin(f / 9))}px rgba(255,181,71,0.45)` }}>
          <Svg d={I.globe} size={84} color={NIGHT.amber} stroke={1.8} />
        </div>
        <Head text={(o.title as string) ?? 'Күнү-түнү'} size={74} color={NIGHT.white} k={t1} style={{ marginTop: 18, textShadow: '0 6px 24px rgba(0,0,0,0.6)' }} />
        <Body text={(o.sub as string) ?? 'онлайн жардамчыңыз'} size={32} color={NIGHT.amber} weight={800} k={t2} style={{ marginTop: 6 }} />
      </div>
    </AbsoluteFill>
  );
};

// ── 5. Services: three wireframe panels for landing / online store / web system ────────────────────────────
// beats: s1, s2, s3 (each panel slides in), a1..a3 (highlight while the word is spoken)
const Wire: React.FC<{ kind: 'landing' | 'store' | 'system'; f: number; a: number }> = ({ kind, f, a }) => {
  const c = `rgba(255,255,255,${0.22 + 0.5 * a})`;
  const acc = NIGHT.amber;
  const bar = (x: number, y: number, w: number, h: number, col = c, r = 4) => <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} rx={r} fill={col} />;
  if (kind === 'landing')
    return (
      <svg width={220} height={150} viewBox="0 0 220 150">
        {bar(12, 12, 60, 10)}
        {bar(120, 12, 30, 8)}
        {bar(160, 12, 30, 8)}
        {bar(12, 44, 150, 18, acc, 6)}
        {bar(12, 70, 110, 10)}
        {bar(12, 86, 90, 10)}
        <rect x={12} y={110} width={92} height={26} rx={13} fill={acc} opacity={0.5 + 0.5 * a} />
        {bar(150, 44, 58, 92, 'rgba(255,255,255,0.1)', 10)}
      </svg>
    );
  if (kind === 'store')
    return (
      <svg width={220} height={150} viewBox="0 0 220 150">
        {bar(12, 12, 90, 12)}
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${12 + i * 68} 36)`}>
            <rect width={60} height={56} rx={8} fill="rgba(255,255,255,0.12)" />
            <rect y={62} width={44} height={8} rx={4} fill={c} />
            <rect y={76} width={30} height={8} rx={4} fill={acc} />
          </g>
        ))}
        <g transform="translate(150 112)">
          <rect width={58} height={26} rx={13} fill={acc} opacity={0.5 + 0.5 * a} />
          <svg x={6} y={3} width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={NIGHT.ink} strokeWidth={2.4}>
            {I.cart}
          </svg>
        </g>
        <rect x={12} y={118} width={120} height={10} rx={4} fill={c} />
      </svg>
    );
  const bars = [40, 70, 55, 90, 65, 100, 80];
  return (
    <svg width={220} height={150} viewBox="0 0 220 150">
      {bar(12, 12, 46, 126, 'rgba(255,255,255,0.08)', 10)}
      {[0, 1, 2, 3].map((i) => bar(22, 24 + i * 22, 26, 8))}
      {bar(70, 12, 138, 10)}
      {bars.map((h, i) => (
        <rect key={i} x={70 + i * 20} y={128 - h * (0.6 + 0.4 * Math.min(1, a + Math.abs(Math.sin((f + i * 7) / 14)) * 0.3))} width={12} height={h * (0.6 + 0.4 * Math.min(1, a + Math.abs(Math.sin((f + i * 7) / 14)) * 0.3))} rx={3} fill={i === 5 ? acc : c} />
      ))}
      <path d={`M 70 ${60 - 20 * a} L 110 ${50 - 10 * a} L 150 ${40 - 14 * a} L 205 ${22 - 8 * a}`} stroke={acc} strokeWidth={3} fill="none" strokeLinecap="round" />
    </svg>
  );
};

const Services: React.FC<{ o: Overlay }> = ({ o }) => {
  const f = useCurrentFrame();
  const len = o.endFrame - o.startFrame;
  const B = o.beats;
  const leave = leaveK(f, len);
  const items = (o.items as { kind: 'landing' | 'store' | 'system'; label: string; sub?: string }[]) ?? [
    { kind: 'landing', label: 'Лендинг' },
    { kind: 'store', label: 'Интернет-дүкөн' },
    { kind: 'system', label: 'Веб-система' },
  ];
  const y0 = (o.y as number) ?? 170;
  const H = 158;
  const gap = 18;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {items.map((it, i) => {
        const k = K(f, B[`s${i + 1}`] ?? 1e9, 10);
        const from = B[`a${i + 1}`] ?? 1e9;
        const to = B[`a${i + 2}`] ?? len;
        const active = f >= from && f < to ? 1 : 0;
        const a = active ? K(f, from, 5) : 0;
        const side = i % 2 === 0 ? -1 : 1;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 90,
              top: y0 + i * (H + gap),
              width: 900,
              height: H,
              borderRadius: 30,
              background: NIGHT.panel,
              border: `2px solid ${active ? NIGHT.amber : NIGHT.panelLine}`,
              boxShadow: active ? `0 0 ${26 * a}px rgba(255,181,71,0.5), 0 24px 60px rgba(0,0,0,0.5)` : '0 24px 60px rgba(0,0,0,0.5)',
              opacity: k * (1 - leave),
              transform: `translateX(${(1 - k) * side * 140}px) translateY(${-leave * 50}px) scale(${1 + 0.03 * a})`,
              display: 'flex',
              alignItems: 'center',
              gap: 26,
              padding: '0 26px',
            }}
          >
            <div style={{ width: 220, height: 150, borderRadius: 18, background: 'rgba(255,255,255,0.05)', flexShrink: 0, overflow: 'hidden' }}>
              <Wire kind={it.kind} f={f} a={a} />
            </div>
            <div style={{ flex: 1 }}>
              <Head text={it.label} size={56} color={active ? NIGHT.amber : NIGHT.white} k={k} />
              {it.sub ? <Body text={it.sub} size={24} color={NIGHT.dim} weight={600} k={k} style={{ marginTop: 8 }} /> : null}
            </div>
            <div style={{ width: 54, height: 54, borderRadius: 27, border: `3px solid ${active ? NIGHT.amber : 'rgba(255,255,255,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: k }}>
              <Svg d={I.check} size={30} color={active ? NIGHT.amber : 'rgba(255,255,255,0.35)'} stroke={3} />
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ── 6. While you sleep: a lock screen on the nightstand collects order notifications ──────────────────────
// beats: phone, n1, n2, n3 (notifications), zzz
const SleepPhone: React.FC<{ o: Overlay }> = ({ o }) => {
  const f = useCurrentFrame();
  const len = o.endFrame - o.startFrame;
  const B = o.beats;
  const leave = leaveK(f, len);
  const enter = K(f, B.phone ?? 0, 12);
  const x = (o.x as number) ?? 300;
  const y = (o.y as number) ?? 150;
  const w = (o.w as number) ?? 480;
  const h = (o.h as number) ?? 640;
  const notes = (o.notes as { title: string; line: string; time: string }[]) ?? [
    { title: 'Жаңы заказ', line: 'Сайт аркылуу', time: '02:48' },
    { title: 'Жаңы заказ', line: 'Сайт аркылуу', time: '03:12' },
    { title: 'Жаңы заявка', line: 'Байланыш формасы', time: '05:36' },
  ];
  const glow = notes.reduce((g, _, i) => Math.max(g, 1 - Math.min(1, Math.max(0, f - (B[`n${i + 1}`] ?? 1e9)) / 18)), 0);
  // the lock-screen clock runs through the night (≈2.2 min per frame from 02:40); each notification is
  // stamped with the clock value at the moment it lands, so times on screen are consistent by construction
  const clockAt = (fr: number) => 160 + Math.floor(Math.max(0, fr - (B.phone ?? 0)) * 2.2);
  const hhmm = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
  const clockMin = clockAt(f);
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {/* phone lying on a dark surface, slight perspective */}
      <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, opacity: enter * (1 - leave), transform: `perspective(1400px) rotateX(${8 - 8 * enter}deg) translateY(${(1 - enter) * 60 - leave * 50}px)`, transformOrigin: '50% 100%' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 54, background: '#0D0F16', boxShadow: `0 50px 100px rgba(0,0,0,0.65), inset 0 0 0 3px #2E3140, 0 0 ${50 * glow}px rgba(255,181,71,${0.55 * glow})` }} />
        <div style={{ position: 'absolute', left: 14, top: 14, right: 14, bottom: 14, borderRadius: 42, overflow: 'hidden', background: 'linear-gradient(180deg, #0B1230 0%, #141B3C 100%)' }}>
          <div style={{ position: 'absolute', top: 20, left: 0, right: 0, textAlign: 'center', fontFamily: FONTS.body, fontWeight: 600, fontSize: 22, color: NIGHT.dim }}>{(o.date as string) ?? 'Түн'}</div>
          <div style={{ position: 'absolute', top: 48, left: 0, right: 0, textAlign: 'center', fontFamily: FONTS.head, fontWeight: 700, fontSize: 118, color: NIGHT.white, letterSpacing: 2, fontVariantNumeric: 'tabular-nums', opacity: 0.55 + 0.45 * glow }}>
            {hhmm(clockMin)}
          </div>
          <div style={{ position: 'absolute', top: 200, left: 18, right: 18 }}>
            {notes.map((n, i) => {
              const k = K(f, B[`n${i + 1}`] ?? 1e9, 9, Easing.bezier(0.2, 1.2, 0.4, 1));
              return (
                <div key={i} style={{ marginBottom: 14, padding: '16px 18px', borderRadius: 24, background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', gap: 14, opacity: k, transform: `translateY(${(1 - k) * -30}px) scale(${0.9 + 0.1 * k})` }}>
                  <div style={{ width: 54, height: 54, borderRadius: 14, background: NIGHT.amber, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Svg d={I.bag} size={32} color={NIGHT.ink} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: FONTS.body, fontWeight: 800, fontSize: 25, color: NIGHT.white }}>
                      <span>{n.title}</span>
                      <span style={{ fontWeight: 600, color: NIGHT.dim, fontSize: 20 }}>{hhmm(clockAt(B[`n${i + 1}`] ?? 0))}</span>
                    </div>
                    <div style={{ fontFamily: FONTS.body, fontWeight: 600, fontSize: 21, color: NIGHT.dim, marginTop: 2 }}>{n.line}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ position: 'absolute', bottom: 16, right: 18, padding: '4px 10px', borderRadius: 10, background: 'rgba(255,181,71,0.18)', color: NIGHT.amber, fontFamily: FONTS.body, fontWeight: 800, fontSize: 16, letterSpacing: 1 }}>ДЕМО</div>
        </div>
        <div style={{ position: 'absolute', top: 24, left: w / 2 - 50, width: 100, height: 28, borderRadius: 14, background: '#0D0F16' }} />
      </div>
      {B.zzz != null ? <Zzz x={x + w + 30} y={y + 140} k={K(f, B.zzz, 10) * (1 - leave)} f={f} /> : null}
    </AbsoluteFill>
  );
};

// ── 7. CTA: a WhatsApp-style chat — the viewer's message "Сайт керек" is sent, Beles answers with the number ─
// beats: panel, typed (message typing), send, reply (number bubble), shine
const ChatCta: React.FC<{ o: Overlay }> = ({ o }) => {
  const f = useCurrentFrame();
  const len = o.endFrame - o.startFrame;
  const B = o.beats;
  const enter = K(f, B.panel ?? 0, 10);
  const x = (o.x as number) ?? 90;
  const y = (o.y as number) ?? 1040;
  const w = (o.w as number) ?? 900;
  const typed = (o.typed as string) ?? 'Сайт керек';
  const n = Math.round(interpolate(f, [B.typed ?? 0, (B.typed ?? 0) + 14], [0, typed.length], clamp));
  const sendK = K(f, B.send ?? 1e9, 8, Easing.bezier(0.2, 1.2, 0.4, 1));
  const replyK = K(f, B.reply ?? 1e9, 9, Easing.bezier(0.2, 1.15, 0.4, 1));
  const numK = K(f, (B.reply ?? 1e9) + 4, 10);
  const shine = interpolate(f, [B.shine ?? 1e9, (B.shine ?? 1e9) + 26], [-0.4, 1.4], clamp);
  const pulse = 1 + 0.02 * Math.sin(f / 6);
  const number = (o.number as string) ?? '0998 08 38 28';
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', left: x, top: y, width: w, opacity: enter, transform: `translateY(${(1 - enter) * 50}px)` }}>
        {/* outgoing bubble (the viewer) */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 18, opacity: Math.max(0.001, K(f, B.typed ?? 0, 6)) }}>
          <div style={{ padding: '18px 26px', borderRadius: 30, borderBottomRightRadius: 8, background: sendK > 0 ? '#DCF8C6' : 'rgba(255,255,255,0.96)', color: '#0F1A12', fontFamily: FONTS.body, fontWeight: 800, fontSize: 40, boxShadow: '0 14px 34px rgba(0,0,0,0.4)', transform: `scale(${0.96 + 0.04 * sendK})`, display: 'flex', alignItems: 'center', gap: 14 }}>
            <span>{typed.slice(0, n)}</span>
            {sendK <= 0 ? <span style={{ display: 'inline-block', width: 4, height: 42, background: NIGHT.green, opacity: Math.floor(f / 8) % 2 ? 1 : 0.2 }} /> : <Svg d={I.check} size={30} color="#34B7F1" stroke={3} />}
          </div>
        </div>
        {/* reply bubble with the number */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', opacity: replyK, transform: `translateY(${(1 - replyK) * 26}px) scale(${(0.94 + 0.06 * replyK) * pulse})`, transformOrigin: '0 100%' }}>
          <div style={{ width: w, padding: '22px 30px 24px', borderRadius: 36, borderBottomLeftRadius: 10, background: 'rgba(255,255,255,0.98)', boxShadow: `0 24px 56px rgba(0,0,0,0.5), 0 0 0 4px rgba(37,211,102,${0.55 + 0.3 * Math.abs(Math.sin(f / 8))})`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 66, height: 66, borderRadius: 33, background: NIGHT.green, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width={42} height={42} viewBox="0 0 24 24">
                  <path d={WA_PATH} fill="#fff" />
                </svg>
              </div>
              <div style={{ fontFamily: FONTS.body, fontWeight: 800, fontSize: 36, color: '#128C4A' }}>{(o.title as string) ?? 'WhatsApp · Beles'}</div>
            </div>
            <div style={{ marginTop: 10, position: 'relative' }}>
              {shine > -0.4 && shine < 1.4 ? <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${shine * 100}%`, width: '22%', background: 'linear-gradient(100deg, rgba(37,211,102,0) 0%, rgba(37,211,102,0.3) 50%, rgba(37,211,102,0) 100%)' }} /> : null}
              <div style={{ fontFamily: FONTS.head, fontWeight: 700, fontSize: 112, lineHeight: '118px', letterSpacing: 3, color: '#0B1230', textAlign: 'center', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                {Array.from(number).map((ch, i) => {
                  const da = interpolate(f, [(B.reply ?? 0) + 6 + i * 1.5, (B.reply ?? 0) + 12 + i * 1.5], [0, 1], { ...clamp, easing: out });
                  return (
                    <span key={i} style={{ display: 'inline-block', opacity: da * numK, transform: `translateY(${(1 - da) * 18}px)` }}>
                      {ch === ' ' ? ' ' : ch}
                    </span>
                  );
                })}
              </div>
            </div>
            <div style={{ marginTop: 6, fontFamily: FONTS.body, fontWeight: 700, fontSize: 30, color: '#2B2B2E', textAlign: 'center', opacity: K(f, (B.reply ?? 0) + 14, 8) }}>{(o.line as string) ?? 'Азыр жазыңыз'}</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 8. Free-floating heading (amber Oswald) for a spoken key phrase ────────────────────────────────────────
// beats: in, (optional) out
const TitleCard: React.FC<{ o: Overlay }> = ({ o }) => {
  const f = useCurrentFrame();
  const len = o.endFrame - o.startFrame;
  const B = o.beats;
  const k = K(f, B.in ?? 0, 9);
  const leave = leaveK(f, len);
  const lines = (o.lines as { text: string; accent?: boolean; size?: number }[]) ?? [];
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', left: 90, width: 900, top: (o.y as number) ?? 200, textAlign: (o.align as 'left' | 'center') ?? 'center', opacity: k * (1 - leave), transform: `translateY(${(1 - k) * 30 - leave * 40}px)` }}>
        {lines.map((l, i) => (
          <Head key={i} text={l.text} size={l.size ?? 96} color={l.accent ? NIGHT.amber : NIGHT.white} k={K(f, (B.in ?? 0) + i * 4, 9)} style={{ textShadow: '0 8px 30px rgba(0,0,0,0.6)', whiteSpace: 'normal' }} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const NightOverlay: React.FC<{ o: Overlay }> = ({ o }) => {
  switch (o.kind) {
    case 'clock':
      return <ClockHook o={o} />;
    case 'chat':
      return <ChatWait o={o} />;
    case 'ticket':
      return <OrderTicket o={o} />;
    case 'dial':
      return <DayNightDial o={o} />;
    case 'services':
      return <Services o={o} />;
    case 'sleep':
      return <SleepPhone o={o} />;
    case 'cta':
      return <ChatCta o={o} />;
    case 'title':
      return <TitleCard o={o} />;
    default:
      return null;
  }
};

// Cool night tint over the top of the frame (keeps the presenter natural, lets amber/white UI read on the curtain).
export const NightSky: React.FC<{ strength: number }> = ({ strength }) => (
  <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(8,12,34,${0.62 * strength}) 0%, rgba(8,12,34,${0.3 * strength}) 30%, rgba(8,12,34,0) 52%)` }} />
);
