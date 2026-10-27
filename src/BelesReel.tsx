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
import { Subtitles } from './Subtitles';
import { EndCard } from './EndCard';

// Block rendering until the local fonts (incl. Kyrgyz ө ү ң) are really loaded.
const useFonts = () => {
  const [handle] = useState(() => delayRender('fonts'));
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
      .then(() => continueRender(handle))
      .catch((e) => {
        console.error(e);
        continueRender(handle);
      });
  }, [handle]);
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
  useFonts();
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
      <Subtitles subtitles={timeline.subtitles} />
      <Audio src={staticFile(timeline.audio)} />
    </AbsoluteFill>
  );
};
