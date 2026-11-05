import React, { useEffect, useState } from 'react';
import { AbsoluteFill, Audio, continueRender, delayRender, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { useCamera } from '../../../../src/camera';
import { Captions } from '../../../../src/Captions';
import type { TimelineBW003 } from './types';
import { NightOverlay, NightSky } from './night';

// BW-003 composition: the same presenter pipeline (clips, camera presets, kinetic captions) with the
// job's own "night shift" overlays. Nothing from the V5 / BW-002 scene set is drawn here.
const useFonts = () => {
  const [handle] = useState(() => delayRender('fonts'));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const sample = 'ӨөҮүҢң Сайт 02:00';
    Promise.all([
      document.fonts.load(`700 80px Oswald`, sample),
      document.fonts.load(`600 40px Montserrat`, sample),
      document.fonts.load(`700 40px Montserrat`, sample),
      document.fonts.load(`800 40px Montserrat`, sample),
      document.fonts.load(`900 40px Montserrat`, sample),
    ])
      .then(() => document.fonts.ready)
      .then(() => setReady(true))
      .catch((e) => {
        console.error(e);
        setReady(true);
      });
  }, [handle]);
  useEffect(() => {
    if (ready) continueRender(handle);
  }, [ready, handle]);
  return ready;
};

const FadeIn: React.FC<{ frames: number }> = ({ frames }) => {
  const f = useCurrentFrame();
  const o = Math.max(0, 1 - f / frames);
  return o > 0 ? <AbsoluteFill style={{ background: '#070A18', opacity: o }} /> : null;
};

const Presenter: React.FC<{ timeline: TimelineBW003 }> = ({ timeline }) => {
  const cam = useCamera(timeline.camera, timeline.face);
  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#140504' }}>
      <AbsoluteFill style={{ transformOrigin: '0 0', transform: `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.s})` }}>
        {timeline.clips.map((c) => (
          <Sequence key={c.id} from={c.startFrame} durationInFrames={c.durationFrames} layout="none">
            <AbsoluteFill>
              <OffthreadVideo src={staticFile(timeline.video)} startFrom={c.srcInFrame} muted style={{ width: '100%', height: '100%' }} />
            </AbsoluteFill>
          </Sequence>
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const BelesReelBW003: React.FC<{ timeline: TimelineBW003 }> = ({ timeline }) => {
  const fontsReady = useFonts();
  return (
    <AbsoluteFill style={{ backgroundColor: '#140504' }}>
      <Presenter timeline={timeline} />
      <NightSky strength={timeline.nightTint ?? 1} />
      {timeline.vignette ? <AbsoluteFill style={{ background: `radial-gradient(78% 60% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,${timeline.vignette}) 100%)` }} /> : null}
      {(timeline.overlays ?? []).map((o, i) => (
        <Sequence key={`ov${i}`} from={o.startFrame} durationInFrames={o.endFrame - o.startFrame} layout="none">
          <NightOverlay o={o} />
        </Sequence>
      ))}
      {timeline.fadeIn ? <FadeIn frames={timeline.fadeIn} /> : null}
      {fontsReady ? <Captions subtitles={timeline.subtitles} topY={timeline.captionTopY} bottom={timeline.captionBottom} /> : null}
      <Audio src={staticFile(timeline.audio)} />
    </AbsoluteFill>
  );
};
