import React, { useEffect, useState } from 'react';
import {
  AbsoluteFill,
  Audio,
  continueRender,
  delayRender,
  OffthreadVideo,
  Sequence,
  staticFile,
} from 'remotion';
import type { SubVariant, Timeline } from './types';
import { useCamera } from './camera';
import { SiteCard } from './SiteCard';
import { TitleBlock } from './TitleBlock';
import { PhoneShotView } from './PhoneShot';
import { Subtitles } from './Subtitles';
import { EndCard } from './EndCard';
import { WhatsAppBadge } from './WhatsAppBadge';

// Block rendering until the local fonts (incl. Kyrgyz ө ү ң) are really loaded.
const useFonts = () => {
  const [handle] = useState(() => delayRender('fonts'));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const sample = 'ӨөҮүҢң Сайт';
    Promise.all([
      document.fonts.load(`700 80px Oswald`, sample),
      document.fonts.load(`600 40px Montserrat`, sample),
      document.fonts.load(`700 40px Montserrat`, sample),
      document.fonts.load(`800 40px Montserrat`, sample),
      document.fonts.load(`italic 700 40px Montserrat`, sample),
    ])
      .then(() => document.fonts.ready)
      .then(() => setReady(true))
      .catch((e) => {
        console.error(e);
        setReady(true);
      });
  }, [handle]);
  // release the frame only after the text layout has been re-measured with the real fonts
  useEffect(() => {
    if (ready) continueRender(handle);
  }, [ready, handle]);
  return ready;
};

const Presenter: React.FC<{ timeline: Timeline; blur?: boolean }> = ({ timeline }) => {
  const cam = useCamera(timeline.camera);
  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#140504' }}>
      <AbsoluteFill
        style={{
          transformOrigin: '0 0',
          transform: `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.s})`,
        }}
      >
        {timeline.clips.map((c) => (
          <Sequence key={c.id} from={c.startFrame} durationInFrames={c.durationFrames} layout="none">
            <AbsoluteFill>
              <OffthreadVideo
                src={staticFile(timeline.video)}
                startFrom={c.srcInFrame}
                muted
                style={{ width: '100%', height: '100%' }}
              />
            </AbsoluteFill>
          </Sequence>
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Subtitle concept used in the finished film (chosen after the A–E comparison, see docs/v3-report.md).
export const SUB_VARIANT: SubVariant = 'D';

export const BelesReel: React.FC<{ timeline: Timeline; subVariant?: SubVariant; styleLabel?: string }> = ({
  timeline,
  subVariant = SUB_VARIANT,
  styleLabel,
}) => {
  const fontsReady = useFonts();
  return (
    <AbsoluteFill style={{ backgroundColor: '#140504' }}>
      <Presenter timeline={timeline} />
      {/* soft top vignette so cards/titles separate from the curtain */}
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(10,2,2,0.45) 0%, rgba(10,2,2,0.0) 38%, rgba(10,2,2,0) 70%, rgba(10,2,2,0.28) 100%)',
        }}
      />
      {timeline.titles.map((t) => (
        <Sequence key={t.id} from={t.startFrame} durationInFrames={t.endFrame - t.startFrame} layout="none">
          <TitleBlock title={t} />
        </Sequence>
      ))}
      {timeline.cards.map((c) => (
        <Sequence key={c.id} from={c.startFrame} durationInFrames={c.endFrame - c.startFrame} layout="none">
          <SiteCard card={c} />
        </Sequence>
      ))}
      {timeline.phones.map((p) => (
        <Sequence key={p.id} from={p.startFrame} durationInFrames={p.endFrame - p.startFrame} layout="none">
          <PhoneShotView shot={p} />
        </Sequence>
      ))}
      {timeline.endCard ? (
        <Sequence
          from={timeline.endCard.startFrame}
          durationInFrames={timeline.endCard.endFrame - timeline.endCard.startFrame}
          layout="none"
        >
          <EndCard accent={timeline.endCard.accent} main={timeline.endCard.main} />
        </Sequence>
      ) : null}
      {timeline.badge ? (
        <Sequence
          from={timeline.badge.startFrame}
          durationInFrames={timeline.badge.endFrame - timeline.badge.startFrame}
          layout="none"
        >
          <WhatsAppBadge badge={timeline.badge} />
        </Sequence>
      ) : null}
      {fontsReady ? <Subtitles subtitles={timeline.subtitles} variant={subVariant} /> : null}
      {styleLabel ? (
        <div
          style={{
            position: 'absolute',
            left: 40,
            right: 40,
            bottom: 70,
            padding: '18px 24px',
            borderRadius: 18,
            background: 'rgba(0,0,0,0.78)',
            color: '#fff',
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 700,
            fontSize: 38,
            textAlign: 'center',
          }}
        >
          {styleLabel}
        </div>
      ) : null}
      <Audio src={staticFile(timeline.audio)} />
    </AbsoluteFill>
  );
};
