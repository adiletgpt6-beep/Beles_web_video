import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import type { Badge } from './types';
import { COLORS, FONTS } from './layout';

// WhatsApp glyph: simple-icons (CC0-1.0), https://simpleicons.org
const WA_PATH =
  'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z';

const WA_GREEN = '#25D366';
const IN_FRAMES = 8; // ≈0.27 s: short rise + gentle scale-up, no overshoot

// Sequence-local frames. Sits below the pointing hand, in the direction of the gesture.
export const WhatsAppBadge: React.FC<{ badge: Badge }> = ({ badge }) => {
  const f = useCurrentFrame();
  const k = interpolate(f, [0, IN_FRAMES], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  // one soft glow pass once the badge has landed
  const glow = interpolate(f, [IN_FRAMES, IN_FRAMES + 10, IN_FRAMES + 24], [0, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const [line1, ...rest] = badge.text.split(' ');
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          left: badge.x,
          top: badge.y,
          transform: `translate(-50%, -50%) translateY(${(1 - k) * 34}px) scale(${0.9 + 0.1 * k})`,
          opacity: k,
          display: 'flex',
          alignItems: 'center',
          gap: 22,
          padding: '18px 34px 18px 20px',
          borderRadius: 34,
          background: 'rgba(255,255,255,0.97)',
          boxShadow: `0 18px 40px rgba(0,0,0,0.45), 0 0 0 ${3 + glow * 5}px rgba(37,211,102,${0.55 + glow * 0.35})`,
          whiteSpace: 'nowrap',
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            background: WA_GREEN,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width={60} height={60} viewBox="0 0 24 24">
            <path d={WA_PATH} fill="#fff" />
          </svg>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{ fontFamily: FONTS.head, fontWeight: 700, fontSize: 64, color: COLORS.ink, letterSpacing: 0.5 }}>{line1}</span>
          <span style={{ marginTop: 8, fontFamily: FONTS.body, fontWeight: 800, fontSize: 38, color: '#128C4A' }}>{rest.join(' ')}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
