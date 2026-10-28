// All *Frame values are in FINAL-timeline frames at timeline.fps (30).
// Source positions (srcInFrame) are frames of public/media/source.mp4 (30 fps CFR).

export type CameraMode = 'wide' | 'medium' | 'close' | 'card' | 'card2';

export type Clip = {
  id: string;
  srcInFrame: number;
  srcOutFrame: number;
  startFrame: number;
  durationFrames: number;
};

export type CameraKey = { frame: number; mode: CameraMode; smooth: boolean };

// A viewport keyframe on the screenshot: x/y = top-left of the visible window
// in screenshot pixels, w = visible width in screenshot pixels.
export type ViewKey = { frame: number; x: number; y: number; w: number };

export type Highlight = {
  fromFrame: number;
  toFrame: number;
  // rectangle in screenshot pixels
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Card = {
  id: string;
  startFrame: number;
  endFrame: number;
  image: string; // path inside public/
  imageWidth: number;
  imageHeight: number;
  url: string;
  views: ViewKey[];
  highlight?: Highlight;
  cursor?: { fromFrame: number; toFrame: number; x0: number; y0: number; x1: number; y1: number };
  label?: string;
};

export type Title = {
  id: string;
  startFrame: number;
  endFrame: number;
  accent?: string;
  main: string;
};

export type PhoneShot = {
  id: string;
  startFrame: number;
  endFrame: number;
  image: string;
  imageWidth: number;
  imageHeight: number;
  scrollFrom: number; // screenshot px (top of viewport)
  scrollTo: number;
  label?: string;
  labelEndFrame?: number; // label fades out here (shot-local frame)
  // optional second half: the phone slides away and a desktop browser takes over
  desktop?: {
    fromFrame: number; // shot-local
    image: string;
    imageWidth: number;
    imageHeight: number;
    views: ViewKey[]; // shot-local frames
  };
};

export type SubWord = { text: string; key: boolean };
export type Subtitle = { startFrame: number; endFrame: number; words: SubWord[]; bottom?: number };

// Call-to-action badge placed where the presenter points (pointing gesture verified on the source).
export type Badge = {
  startFrame: number; // animation start (slightly before the finger settles)
  endFrame: number;
  text: string;
  x: number; // badge centre, final-frame px
  y: number;
};

export type Timeline = {
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
  video: string;
  audio: string;
  clips: Clip[];
  camera: CameraKey[];
  cards: Card[];
  titles: Title[];
  phones: PhoneShot[];
  subtitles: Subtitle[];
  endCard?: { startFrame: number; endFrame: number; accent: string; main: string };
  badge?: Badge;
};
