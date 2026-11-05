import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { SearchBarData, SideSceneContent, SideSceneData } from './types';
import { COLORS, FONTS } from './layout';
import { viewAt } from './SiteCard';

// BW-002 v2 motion-graphics scenes: a search-bar hook, a phone standing beside the presenter with
// (a) a real site scrolling, (b) a demo online store (catalog → product → cart → checkout → new-order toast),
// (c) a demo business automation flow (request → manager notification → CRM), plus a desktop window.
// Demo screens are mock-ups (labelled "ДЕМО"); the real site carries its own label.
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const out = Easing.bezier(0.16, 1, 0.3, 1);
const inOut = Easing.bezier(0.65, 0, 0.35, 1);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const DARK = 'rgba(10,14,22,0.84)';
const INK = '#141A24';

const Icon: React.FC<{ d: React.ReactNode; size?: number; color?: string; stroke?: number; box?: number }> = ({ d, size = 28, color = '#fff', stroke = 2.4, box = 24 }) => (
  <svg width={size} height={size} viewBox={`0 0 ${box} ${box}`} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);
const I = {
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <line x1="15.5" y1="15.5" x2="21" y2="21" />
    </>
  ),
  cart: (
    <>
      <path d="M3 4h2.5l2.2 10.5h10.6L21 7H7" />
      <circle cx="9.5" cy="19" r="1.4" />
      <circle cx="17" cy="19" r="1.4" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  form: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <line x1="8.5" y1="8" x2="15.5" y2="8" />
      <line x1="8.5" y1="12" x2="15.5" y2="12" />
      <line x1="8.5" y1="16" x2="12.5" y2="16" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  bulb: (
    <>
      <path d="M12 3a7 7 0 0 0-4 12.7V18h8v-2.3A7 7 0 0 0 12 3z" />
      <line x1="10" y1="21" x2="14" y2="21" />
      <line x1="12" y1="0.5" x2="12" y2="0.5" />
    </>
  ),
  back: <path d="M15 5l-7 7 7 7" />,
  truck: (
    <>
      <rect x="2" y="7" width="12" height="9" rx="1.5" />
      <path d="M14 10h4l3 3v3h-7z" />
      <circle cx="6" cy="18" r="1.6" />
      <circle cx="18" cy="18" r="1.6" />
    </>
  ),
  card: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <line x1="2.5" y1="10" x2="21.5" y2="10" />
    </>
  ),
};

// ── Hook: search bar typing "your business" and waiting for an answer ───────────────────────────
export const SearchBar: React.FC<{ data: SearchBarData }> = ({ data }) => {
  const f = useCurrentFrame();
  const len = data.endFrame - data.startFrame;
  const a = interpolate(f, [0, 9], [0, 1], { ...clamp, easing: out });
  const o = interpolate(f, [len - 7, len], [1, 0], clamp);
  const n = Math.round(interpolate(f, [data.typeFrom, data.typeTo], [0, data.typed.length], clamp));
  const text = data.typed.slice(0, n);
  const caret = Math.floor(f / 9) % 2 === 0 || f < data.typeTo ? 1 : 0;
  const dots = f >= data.dotsFrom;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          left: 120,
          width: 840,
          top: data.y,
          height: 92,
          borderRadius: 46,
          background: DARK,
          border: '2px solid rgba(56,204,255,0.55)',
          boxShadow: '0 18px 40px rgba(0,0,0,0.45), 0 0 34px rgba(56,204,255,0.25)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 28px',
          gap: 18,
          opacity: a * o,
          transform: `translateY(${(1 - a) * -30}px) scale(${0.96 + 0.04 * a})`,
        }}
      >
        <Icon d={I.search} size={38} color={COLORS.cyan} />
        <span style={{ fontFamily: FONTS.body, fontWeight: 600, fontSize: 38, color: '#fff', whiteSpace: 'nowrap' }}>
          {text}
          <span style={{ display: 'inline-block', width: 3, height: 40, background: COLORS.cyan, marginLeft: 3, verticalAlign: 'middle', opacity: caret }} />
        </span>
        <span style={{ flex: 1 }} />
        {dots ? (
          <span style={{ display: 'flex', gap: 8 }}>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ width: 12, height: 12, borderRadius: 6, background: COLORS.cyan, opacity: 0.35 + 0.65 * Math.max(0, Math.sin(((f - data.dotsFrom - i * 4) / 12) * Math.PI)) }} />
            ))}
          </span>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

// ── Product art for the demo store (simple flat illustrations, no real brands) ─────────────────
const PRODUCTS = [
  { name: 'Кулакчын', price: '2 490 сом', bg: 'linear-gradient(135deg,#E8F4FF,#C9E6FF)', art: (
    <>
      <path d="M12 36 V26 a20 20 0 0 1 40 0 V36" stroke="#1D4ED8" strokeWidth="4" fill="none" strokeLinecap="round" />
      <rect x="8" y="32" width="12" height="18" rx="5" fill="#1D4ED8" />
      <rect x="44" y="32" width="12" height="18" rx="5" fill="#1D4ED8" />
    </>
  ) },
  { name: 'Кроссовка', price: '4 900 сом', bg: 'linear-gradient(135deg,#FFF1E6,#FFD9BF)', art: (
    <>
      <path d="M8 42 C 14 34, 22 34, 28 30 L 34 24 C 40 30, 48 32, 56 36 L 58 44 H 8 Z" fill="#F97316" />
      <path d="M8 44 H58 v4 H8 z" fill="#7C2D12" />
      <path d="M30 30 l6 6 M36 27 l6 6" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </>
  ) },
  { name: 'Акылдуу саат', price: '6 200 сом', bg: 'linear-gradient(135deg,#ECFDF5,#BBF7D0)', art: (
    <>
      <rect x="22" y="6" width="20" height="12" rx="4" fill="#065F46" />
      <rect x="22" y="46" width="20" height="12" rx="4" fill="#065F46" />
      <rect x="16" y="16" width="32" height="32" rx="9" fill="#10B981" />
      <rect x="21" y="21" width="22" height="22" rx="6" fill="#064E3B" />
      <path d="M26 34 l5 -6 l4 4 l5 -7" stroke="#6EE7B7" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </>
  ) },
  { name: 'Рюкзак', price: '3 350 сом', bg: 'linear-gradient(135deg,#F3E8FF,#DDD6FE)', art: (
    <>
      <rect x="14" y="16" width="36" height="40" rx="10" fill="#7C3AED" />
      <path d="M24 16 a8 8 0 0 1 16 0" stroke="#4C1D95" strokeWidth="4" fill="none" />
      <rect x="20" y="34" width="24" height="14" rx="4" fill="#C4B5FD" />
    </>
  ) },
];

const Phone: React.FC<{ rect: { x: number; y: number; w: number; h: number }; enter: number; exit: number; children: React.ReactNode; label?: string }> = ({ rect, enter, exit, children, label }) => {
  const bezel = 12;
  const radius = rect.w * 0.13;
  return (
    <div
      style={{
        position: 'absolute',
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        borderRadius: radius,
        background: '#0D0D0F',
        boxShadow: '0 40px 90px rgba(0,0,0,0.62), inset 0 0 0 3px #3A3A3E, 0 0 50px rgba(56,204,255,0.12)',
        opacity: enter * (1 - exit),
        transform: `translateX(${(1 - enter) * -80 - exit * 120}px) scale(${0.94 + 0.06 * enter})`,
      }}
    >
      <div style={{ position: 'absolute', left: bezel, top: bezel, width: rect.w - bezel * 2, height: rect.h - bezel * 2, borderRadius: radius - bezel, overflow: 'hidden', background: '#F6F8FB' }}>
        {children}
      </div>
      <div style={{ position: 'absolute', top: 22, left: rect.w / 2 - 46, width: 92, height: 26, borderRadius: 13, background: '#0D0D0F' }} />
      {label ? (
        <div style={{ position: 'absolute', top: -22, right: 18, padding: '6px 16px', borderRadius: 18, background: label === 'ДЕМО' ? 'rgba(56,204,255,0.95)' : 'rgba(255,255,255,0.96)', color: INK, fontFamily: FONTS.body, fontWeight: 800, fontSize: 22, letterSpacing: 1, boxShadow: '0 6px 16px rgba(0,0,0,0.35)' }}>
          {label}
        </div>
      ) : null}
    </div>
  );
};

// ── Demo store on the phone ───────────────────────────────────────────────────────────────────
const StoreDemo: React.FC<{ f: number; beats: Record<string, number>; w: number; h: number }> = ({ f, beats, w, h }) => {
  const B = (k: string) => beats[k] ?? 1e9;
  const k = (from: number, d = 8) => interpolate(f, [from, from + d], [0, 1], { ...clamp, easing: out });
  const pad = 22;
  const cardW = (w - pad * 3) / 2;
  const sheet = k(B('tap') + 6, 10); // product sheet rises
  const checkout = k(B('checkout'), 10);
  const success = k(B('success'), 10);
  const added = f >= B('add') + 4;
  const toast = k(B('toast'), 12);
  const press = (at: number) => interpolate(f, [at, at + 3, at + 8], [0, 1, 0], clamp);
  const fly = interpolate(f, [B('add') + 2, B('add') + 14], [0, 1], { ...clamp, easing: inOut });
  const cartCount = f >= B('add') + 14 ? 1 : 0;
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: FONTS.body }}>
      {/* header */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 118, background: '#fff', borderBottom: '1px solid #E6EAF0', display: 'flex', alignItems: 'flex-end', padding: `0 ${pad}px 16px` }}>
        <div style={{ fontWeight: 900, fontSize: 36, color: INK }}>Дүкөн</div>
        <span style={{ flex: 1 }} />
        <div style={{ position: 'relative', transform: `scale(${1 + 0.25 * press(B('add') + 14)})` }}>
          <Icon d={I.cart} size={40} color={INK} />
          {cartCount ? (
            <div style={{ position: 'absolute', top: -10, right: -12, minWidth: 28, height: 28, borderRadius: 14, background: COLORS.cyan, color: INK, fontWeight: 900, fontSize: 19, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cartCount}</div>
          ) : null}
        </div>
      </div>
      {/* catalog */}
      {PRODUCTS.map((p, i) => {
        const a = k(B('catalog') + i * 4, 10);
        const col = i % 2;
        const row = Math.floor(i / 2);
        const tapped = i === 0 ? press(B('tap')) : 0;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: pad + col * (cardW + pad),
              top: 140 + row * (cardW + 92),
              width: cardW,
              height: cardW + 70,
              borderRadius: 22,
              background: '#fff',
              boxShadow: tapped ? `0 0 0 4px ${COLORS.cyan}, 0 14px 30px rgba(0,0,0,0.14)` : '0 10px 24px rgba(16,24,40,0.08)',
              opacity: a,
              transform: `translateY(${(1 - a) * 40}px) scale(${(0.9 + 0.1 * a) * (1 - 0.04 * tapped)})`,
              overflow: 'hidden',
            }}
          >
            <div style={{ height: cardW - 24, margin: 10, borderRadius: 16, background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={cardW * 0.55} height={cardW * 0.55} viewBox="0 0 64 64">{p.art}</svg>
            </div>
            <div style={{ padding: '0 14px', fontWeight: 700, fontSize: 21, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
            <div style={{ padding: '2px 14px 0', fontWeight: 900, fontSize: 22, color: '#1D4ED8' }}>{p.price}</div>
          </div>
        );
      })}
      {/* tap ring */}
      {f >= B('tap') - 2 && f < B('tap') + 14 ? (
        <div style={{ position: 'absolute', left: pad + cardW / 2 - 28, top: 140 + cardW / 2 - 28, width: 56, height: 56, borderRadius: 28, border: `4px solid ${COLORS.cyan}`, opacity: 1 - press(B('tap')) * 0.5, transform: `scale(${0.6 + 0.8 * interpolate(f, [B('tap') - 2, B('tap') + 12], [0, 1], clamp)})` }} />
      ) : null}
      {/* product sheet → checkout → success */}
      {sheet > 0 ? (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: h * 0.62, borderRadius: '30px 30px 0 0', background: '#fff', boxShadow: '0 -16px 40px rgba(16,24,40,0.18)', transform: `translateY(${(1 - sheet) * h * 0.62}px)`, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 12, left: '50%', width: 56, height: 6, borderRadius: 3, background: '#D5DAE3', transform: 'translateX(-50%)' }} />
          {/* product view */}
          <div style={{ position: 'absolute', inset: 0, opacity: 1 - checkout, transform: `translateX(${-checkout * 60}px)` }}>
            <div style={{ margin: '34px 22px 0', height: 190, borderRadius: 20, background: PRODUCTS[0].bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={140} height={140} viewBox="0 0 64 64">{PRODUCTS[0].art}</svg>
            </div>
            <div style={{ margin: '18px 22px 0', fontWeight: 900, fontSize: 30, color: INK }}>{PRODUCTS[0].name}</div>
            <div style={{ margin: '4px 22px 0', fontWeight: 800, fontSize: 28, color: '#1D4ED8' }}>{PRODUCTS[0].price}</div>
            <div style={{ margin: '6px 22px 0', fontWeight: 600, fontSize: 19, color: '#6B7280' }}>Бардык кардарларга ачык каталог</div>
            <div style={{ position: 'absolute', left: 22, right: 22, bottom: 26, height: 70, borderRadius: 20, background: added ? '#10B981' : INK, color: '#fff', fontWeight: 800, fontSize: 25, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transform: `scale(${1 - 0.05 * press(B('add'))})` }}>
              {added ? <Icon d={I.check} size={28} /> : <Icon d={I.cart} size={28} />}
              {added ? 'Себетке кошулду' : 'Себетке кошуу'}
            </div>
          </div>
          {/* checkout */}
          <div style={{ position: 'absolute', inset: 0, opacity: checkout * (1 - success), transform: `translateX(${(1 - checkout) * 60}px)` }}>
            <div style={{ margin: '36px 22px 0', fontWeight: 900, fontSize: 30, color: INK }}>Заказды тастыктоо</div>
            {[
              { icon: I.cart, t: `${PRODUCTS[0].name} × 1`, r: PRODUCTS[0].price },
              { icon: I.truck, t: 'Жеткирүү: Бишкек', r: '0 сом' },
              { icon: I.card, t: 'Төлөө: карта', r: '' },
            ].map((row, i) => (
              <div key={i} style={{ margin: '14px 22px 0', height: 62, borderRadius: 16, background: '#F3F5F9', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 14, opacity: k(B('checkout') + 4 + i * 3, 8) }}>
                <Icon d={row.icon} size={28} color={INK} />
                <span style={{ fontWeight: 700, fontSize: 21, color: INK, flex: 1 }}>{row.t}</span>
                <span style={{ fontWeight: 800, fontSize: 21, color: '#1D4ED8' }}>{row.r}</span>
              </div>
            ))}
            <div style={{ margin: '18px 22px 0', display: 'flex', fontWeight: 900, fontSize: 26, color: INK }}>
              <span>Жалпы</span>
              <span style={{ flex: 1 }} />
              <span>{PRODUCTS[0].price}</span>
            </div>
            <div style={{ position: 'absolute', left: 22, right: 22, bottom: 26, height: 70, borderRadius: 20, background: '#1D4ED8', color: '#fff', fontWeight: 800, fontSize: 25, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 - 0.05 * press(B('pay'))})` }}>
              Заказды жөнөтүү
            </div>
          </div>
          {/* success */}
          {success > 0 ? (
            <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: success, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
              <div style={{ width: 120, height: 120, borderRadius: 60, background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${0.6 + 0.4 * success})`, boxShadow: `0 0 ${40 * success}px rgba(16,185,129,0.55)` }}>
                <Icon d={I.check} size={70} stroke={3} />
              </div>
              <div style={{ fontWeight: 900, fontSize: 30, color: INK, textAlign: 'center', padding: '0 20px' }}>Заказ кабыл алынды</div>
              <div style={{ fontWeight: 600, fontSize: 20, color: '#6B7280' }}>№ 1024 · {PRODUCTS[0].price}</div>
            </div>
          ) : null}
        </div>
      ) : null}
      {/* flying dot to cart */}
      {fly > 0 && fly < 1 ? (
        <div style={{ position: 'absolute', left: lerp(w / 2, w - pad - 22, fly), top: lerp(h * 0.9, 70, fly) - Math.sin(fly * Math.PI) * 120, width: 22, height: 22, borderRadius: 11, background: COLORS.cyan, boxShadow: '0 0 16px rgba(56,204,255,0.9)' }} />
      ) : null}
      {/* new-order toast for the owner */}
      {toast > 0 ? (
        <div style={{ position: 'absolute', left: 14, right: 14, top: 60, height: 96, borderRadius: 24, background: 'rgba(20,26,36,0.96)', boxShadow: '0 18px 40px rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 14, opacity: toast, transform: `translateY(${(1 - toast) * -120}px)` }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon d={I.bell} size={32} />
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 22 }}>Жаңы заказ № 1024</div>
            <div style={{ color: COLORS.cyan, fontWeight: 700, fontSize: 19 }}>{PRODUCTS[0].name} · {PRODUCTS[0].price}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

// ── Demo automation flow on the phone ─────────────────────────────────────────────────────────
const AutomationDemo: React.FC<{ f: number; beats: Record<string, number>; w: number; h: number }> = ({ f, beats, w, h }) => {
  const B = (k: string) => beats[k] ?? 1e9;
  const k = (from: number, d = 10) => interpolate(f, [from, from + d], [0, 1], { ...clamp, easing: out });
  const steps = [
    { at: B('request'), icon: I.form, title: 'Жаңы заявка', sub: 'Сайттан · Айгүл', color: '#1D4ED8' },
    { at: B('notify'), icon: I.bell, title: 'Менеджерге билдирме', sub: 'WhatsApp · автоматтык', color: '#25D366' },
    { at: B('crm'), icon: I.user, title: 'CRM: кардар катталды', sub: 'Статус: иштетилүүдө', color: '#7C3AED' },
  ];
  const cardH = 128;
  const gap = 54;
  const top = 150;
  const line = k(B('request') + 8, (B('crm') - B('request')) || 30);
  const done = k(B('done'), 10);
  void w;
  void h;
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: FONTS.body, background: 'linear-gradient(180deg,#F6F8FB,#EEF3FA)' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 118, background: '#fff', borderBottom: '1px solid #E6EAF0', display: 'flex', alignItems: 'flex-end', padding: '0 22px 16px' }}>
        <div style={{ fontWeight: 900, fontSize: 32, color: INK }}>Автоматташтыруу</div>
      </div>
      {/* connector */}
      <div style={{ position: 'absolute', left: 60, top: top + cardH / 2, width: 6, height: (cardH + gap) * 2 * line, borderRadius: 3, background: `linear-gradient(180deg, ${COLORS.cyan}, #1D4ED8)` }} />
      {steps.map((s, i) => {
        const a = k(s.at, 10);
        return (
          <div key={i} style={{ position: 'absolute', left: 22, right: 22, top: top + i * (cardH + gap), height: cardH, borderRadius: 22, background: '#fff', boxShadow: '0 12px 28px rgba(16,24,40,0.10)', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 12, opacity: a, transform: `translateX(${(1 - a) * -40}px) scale(${0.94 + 0.06 * a})` }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 0 ${18 * interpolate(f, [s.at, s.at + 8, s.at + 20], [0, 1, 0], clamp)}px ${s.color}` }}>
              <Icon d={s.icon} size={34} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 18, lineHeight: 1.1, color: INK }}>{s.title}</div>
              <div style={{ fontWeight: 600, fontSize: 16, color: '#6B7280', whiteSpace: 'nowrap' }}>{s.sub}</div>
            </div>
            <div style={{ width: 26, height: 26, borderRadius: 13, background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: k(s.at + 12, 6), transform: `scale(${k(s.at + 12, 6)})` }}>
              <Icon d={I.check} size={16} stroke={3} />
            </div>
          </div>
        );
      })}
      {done > 0 ? (
        <div style={{ position: 'absolute', left: 22, right: 22, top: top + 3 * (cardH + gap) - 10, height: 76, borderRadius: 20, background: INK, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontWeight: 800, fontSize: 23, opacity: done, transform: `translateY(${(1 - done) * 30}px)` }}>
          <Icon d={I.check} size={26} color={COLORS.cyan} stroke={3} />
          Автоматтык процесс
        </div>
      ) : null}
    </div>
  );
};

const SiteScroll: React.FC<{ f: number; from: number; to: number; c: Extract<SideSceneContent, { kind: 'site' }>; w: number }> = ({ f, from, to, c, w }) => {
  const sm = w / c.imageWidth;
  const scroll = interpolate(f, [from + 8, to - 6], [c.scrollFrom, c.scrollTo], { ...clamp, easing: Easing.bezier(0.45, 0, 0.25, 1) });
  return <Img src={staticFile(c.image)} style={{ position: 'absolute', left: 0, top: 0, width: c.imageWidth, height: c.imageHeight, transformOrigin: '0 0', transform: `scale(${sm}) translateY(${-scroll}px)` }} />;
};

export const SideScene: React.FC<{ data: SideSceneData }> = ({ data }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const len = data.endFrame - data.startFrame;
  const enter = spring({ frame: f, fps, config: { damping: 20, stiffness: 110 } });
  const exit = interpolate(f, [len - 8, len], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const bezel = 12;
  const sw = data.phone.w - bezel * 2;
  const sh = data.phone.h - bezel * 2;
  const idx = Math.max(0, data.contents.findIndex((c, i) => f >= c.from && (i === data.contents.length - 1 || f < data.contents[i + 1].from)));
  const cur = data.contents[idx];
  const next = data.contents[idx + 1];
  const curEnd = next ? next.from : len;
  const xf = interpolate(f, [cur.from, cur.from + 7], [0, 1], { ...clamp, easing: inOut });
  const render = (c: SideSceneContent, from: number, to: number) => {
    if (c.kind === 'site') return <SiteScroll f={f} from={from} to={to} c={c} w={sw} />;
    if (c.kind === 'store') return <StoreDemo f={f} beats={c.beats} w={sw} h={sh} />;
    return <AutomationDemo f={f} beats={c.beats} w={sw} h={sh} />;
  };
  const prev = idx > 0 ? data.contents[idx - 1] : null;
  const d = data.desktop;
  const dk = d ? interpolate(f, [d.from, d.from + 12], [0, 1], { ...clamp, easing: out }) : 0;
  const v = d ? viewAt(d.views, f - d.from) : null;
  const sd = d && v ? d.w / v.w : 1;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <Phone rect={data.phone} enter={enter} exit={exit} label={cur.content.label}>
        {prev && xf < 1 ? <div style={{ position: 'absolute', inset: 0, opacity: 1 - xf }}>{render(prev.content, prev.from, cur.from)}</div> : null}
        <div style={{ position: 'absolute', inset: 0, opacity: idx > 0 ? xf : 1, transform: idx > 0 ? `translateX(${(1 - xf) * 50}px)` : undefined }}>{render(cur.content, cur.from, curEnd)}</div>
      </Phone>
      {d && v && dk > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: d.x,
            top: d.y,
            width: d.w,
            height: d.h,
            borderRadius: 20,
            overflow: 'hidden',
            background: '#fff',
            boxShadow: '0 30px 70px rgba(0,0,0,0.6), 0 0 40px rgba(56,204,255,0.14)',
            opacity: dk * (1 - exit),
            transform: `translateY(${(1 - dk) * 60 + exit * 120}px) scale(${0.94 + 0.06 * dk})`,
          }}
        >
          <div style={{ height: 38, background: '#2E2E30', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8 }}>
            {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
              <div key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />
            ))}
            <div style={{ marginLeft: 12, flex: 1, height: 24, borderRadius: 12, background: '#454548', color: '#E8E8E8', fontFamily: FONTS.body, fontWeight: 600, fontSize: 16, display: 'flex', alignItems: 'center', paddingLeft: 14 }}>{d.url}</div>
          </div>
          <div style={{ position: 'relative', width: d.w, height: d.h - 38, overflow: 'hidden', background: '#F4F8F6' }}>
            <Img src={staticFile(d.image)} style={{ position: 'absolute', left: 0, top: 0, width: d.imageWidth, height: d.imageHeight, transformOrigin: '0 0', transform: `scale(${sd}) translate(${-v.x}px, ${-v.y}px)` }} />
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ── small glowing idea bulb beside the head ───────────────────────────────────────────────────
export const Bulb: React.FC<{ x: number; y: number; len: number }> = ({ x, y, len }) => {
  const f = useCurrentFrame();
  const a = interpolate(f, [0, 10], [0, 1], { ...clamp, easing: out });
  const o = interpolate(f, [len - 8, len], [1, 0], clamp);
  const glow = 0.6 + 0.4 * Math.sin((f / 18) * Math.PI);
  return (
    <div style={{ position: 'absolute', left: x - 60, top: y - 60, width: 120, height: 120, borderRadius: 60, background: 'rgba(10,14,22,0.7)', border: '3px solid rgba(56,204,255,0.7)', boxShadow: `0 0 ${40 * glow}px rgba(56,204,255,${0.5 * glow})`, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: a * o, transform: `scale(${0.6 + 0.4 * a}) rotate(${(1 - a) * -12}deg)` }}>
      <Icon d={I.bulb} size={72} color={COLORS.cyan} stroke={2.2} />
    </div>
  );
};
