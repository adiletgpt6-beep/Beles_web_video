import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONTS, TITLE_TOP } from './layout';

// Final call to action, worded from the presenter's own closing line.
export const EndCard: React.FC<{ accent: string; main: string }> = ({ accent, main }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame: f, fps, config: { damping: 16, stiffness: 130 } });
  const b = spring({ frame: f - 5, fps, config: { damping: 16, stiffness: 130 } });
  const pulse = 1 + 0.02 * Math.sin(Math.max(0, f - 20) / 9);
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', top: TITLE_TOP + 10, left: 90, right: 90, textAlign: 'center' }}>
        <div
          style={{
            fontFamily: FONTS.body,
            fontStyle: 'italic',
            fontWeight: 700,
            fontSize: 48,
            color: COLORS.gold,
            textShadow: '0 3px 14px rgba(0,0,0,0.45)',
            opacity: a,
            transform: `translateY(${(1 - a) * 16}px)`,
          }}
        >
          {accent}
        </div>
        <div
          style={{
            marginTop: 18,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 22,
            padding: '20px 40px 22px',
            borderRadius: 30,
            background: 'linear-gradient(180deg, #FFCB6B 0%, #F29A2E 100%)',
            boxShadow: '0 18px 44px rgba(0,0,0,0.45)',
            opacity: b,
            transform: `translateY(${(1 - b) * 26}px) scale(${(0.9 + 0.1 * b) * pulse})`,
          }}
        >
          {/* neutral chat-bubble icon (no third-party logo) */}
          <svg width={64} height={64} viewBox="0 0 24 24">
            <path
              d="M12 2.5C6.75 2.5 2.5 6.3 2.5 11c0 2.4 1.1 4.6 2.9 6.1L4.6 21l4.1-2.1c1 .3 2.1.5 3.3.5 5.25 0 9.5-3.8 9.5-8.5S17.25 2.5 12 2.5z"
              fill={COLORS.ink}
            />
            <circle cx="8" cy="11" r="1.4" fill="#FFC25C" />
            <circle cx="12" cy="11" r="1.4" fill="#FFC25C" />
            <circle cx="16" cy="11" r="1.4" fill="#FFC25C" />
          </svg>
          <span
            style={{
              fontFamily: FONTS.head,
              fontWeight: 700,
              fontSize: 82,
              lineHeight: '90px',
              textTransform: 'uppercase',
              color: COLORS.ink,
            }}
          >
            {main}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
