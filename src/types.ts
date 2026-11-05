// All *Frame values are in FINAL-timeline frames at timeline.fps (30).
// Source positions (srcInFrame) are frames of public/media/source.mp4 (30 fps CFR).

// 'right': presenter pushed to the right 55% of the frame so a device demo can stand on the left (BW-002 v2).
export type CameraMode = 'wide' | 'medium' | 'close' | 'card' | 'card2' | 'right';

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
  hold?: boolean; // no exit animation: the next shot continues this card
  // card → large demo of the same page (card-local frames, target rect in final px)
  expand?: { fromFrame: number; toFrame: number; x: number; y: number; w: number; h: number };
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
    // match cut anchor: the same element in both screenshots (centre + width, screenshot px)
    match?: { mobile: { cx: number; cy: number; w: number }; desktop: { cx: number; cy: number; w: number } };
  };
};

export type SubWord = { text: string; key: boolean; startFrame: number };
// place: 'chest' (default, beside the hands/chest), 'low' (lower, below a site plan), 'top' (above the head,
// used in the finale where the contact block owns the lower third). scene: drawn by a TypeScene instead.
export type Subtitle = { startFrame: number; endFrame: number; words: SubWord[]; place?: 'chest' | 'low' | 'top'; scene?: boolean };

// Full-screen typographic scene (dark grid background); frames are scene-local.
export type TypeSceneData = {
  id: string;
  startFrame: number;
  endFrame: number;
  small: { text: string; frame: number };
  big: { text: string; frame: number }[];
  rise?: { text: string; frame: number };
};

// Call-to-action badge placed where the presenter points (pointing gesture verified on the source).
export type Badge = {
  startFrame: number; // animation start (slightly before the finger settles)
  endFrame: number;
  text: string;
  number: string; // shown exactly as given (0998 08 38 28)
  x: number; // badge centre, final-frame px
  y: number;
  cta?: string; // BW-002 v2: extra line under the number (visual title, not speech)
  button?: string; // BW-002 v2: pulsing WhatsApp button label
};

// BW-002 v2 scenes (frames scene-local unless named startFrame/endFrame)
export type SearchBarData = { startFrame: number; endFrame: number; typed: string; typeFrom: number; typeTo: number; dotsFrom: number; y: number };
export type SideSceneContent =
  | { kind: 'site'; image: string; imageWidth: number; imageHeight: number; scrollFrom: number; scrollTo: number; label?: string }
  | { kind: 'store'; beats: Record<string, number>; label?: string }
  | { kind: 'automation'; beats: Record<string, number>; label?: string };
export type SideSceneData = {
  startFrame: number;
  endFrame: number;
  phone: { x: number; y: number; w: number; h: number };
  contents: { from: number; content: SideSceneContent }[]; // sequential screens on the same phone
  desktop?: { from: number; x: number; y: number; w: number; h: number; url: string; image: string; imageWidth: number; imageHeight: number; views: ViewKey[] };
};

type Rect = { x: number; y: number; w: number; h: number };
type Morph = { s: number; fx: number; fy: number };
// V5 compositions (all frames scene-local unless named startFrame/endFrame; srcStart = source frame at scene start)
export type BehindTextData = {
  startFrame: number;
  endFrame: number;
  srcStart: number;
  matteFrom: number;
  matteTo: number;
  matteDir?: string; // folder inside public/ with <srcFrame>.png cut-outs (default media/matte)
  y: number;
  words: { text: string; from: number; to: number; color: 'white' | 'cyan' }[];
};
export type VideoCardData = {
  startFrame: number;
  endFrame: number;
  srcStart: number;
  rect: Rect;
  target: Morph;
  textTop: number;
  lines: { big: boolean; words: { text: string; frame: number }[] }[];
};
export type SiteStageData = {
  startFrame: number;
  endFrame: number;
  srcStart: number;
  from: Rect;
  window: Rect;
  circle: Rect;
  target: Morph;
  url: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
  views: ViewKey[];
  highlight?: Highlight;
  cursor?: { fromFrame: number; toFrame: number; x0: number; y0: number; x1: number; y1: number };
};
export type IconRowData = {
  startFrame: number;
  endFrame: number;
  y: number;
  items: { icon: 'browser' | 'cart' | 'calendar' | 'layers' | 'phone' | 'laptop'; label: string; frame: number; activeFrom: number; activeTo: number }[];
};

export type Timeline = {
  // optional per-job presenter metrics (see src/camera.ts) and caption 'top' row position
  face?: { cx: number; cy: number; top: number; cardScale?: number; card2Scale?: number };
  captionTopY?: number;
  vignette?: number; // 0..1 cinematic edge darkening (BW-002 v2)
  fadeIn?: number; // frames of a soft fade from dark at the very start (BW-002 v3)
  searchBars?: SearchBarData[];
  sideScenes?: SideSceneData[];
  bulbs?: { startFrame: number; endFrame: number; x: number; y: number }[];
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
  badge?: Badge;
  typeScenes: TypeSceneData[];
  behindText?: BehindTextData;
  videoCards: VideoCardData[];
  siteStages: SiteStageData[];
  iconRows: IconRowData[];
};
