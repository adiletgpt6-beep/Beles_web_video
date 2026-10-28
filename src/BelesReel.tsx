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
import type { Timeline } from './types';
import { useCamera } from './camera';
import { SiteCard } from './SiteCard';
import { TitleBlock } from './TitleBlock';
import { PhoneShotView } from './PhoneShot';
import { Captions } from './Captions';
import { TypeScene } from './TypeScene';
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
      document.fonts.load(`900 40px Montserrat`, sample),
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

export const BelesReel: React.FC<{ timeline: Timeline }> = ({ timeline }) => {
  const fontsReady = useFonts();
  return (
    <AbsoluteFill style={{ backgroundColor: '#140504' }}>
      <Presenter timeline={timeline} />
      {/* soft top vignette so cards/titles separate from the curtain */}
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(10,2,2,0.45) 0%, rgba(10,2,2,0) 38%)',
        }}
      />
      {(timeline.typeScenes ?? []).map((t) => (
        <Sequence key={t.id} from={t.startFrame} durationInFrames={t.endFrame - t.startFrame} layout="none">
          <TypeScene scene={t} />
        </Sequence>
      ))}
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
      {timeline.badge ? (
        <Sequence
          from={timeline.badge.startFrame}
          durationInFrames={timeline.badge.endFrame - timeline.badge.startFrame}
          layout="none"
        >
          <WhatsAppBadge badge={timeline.badge} />
        </Sequence>
      ) : null}
      {fontsReady ? <Captions subtitles={timeline.subtitles} /> : null}
      <Audio src={staticFile(timeline.audio)} />
    </AbsoluteFill>
  );
};
