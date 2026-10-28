// Reels-safe layout for 1080x1920 (px). Safe insets: left 90, right 180, top 160, bottom 300.
export const SAFE = { left: 90, right: 180, top: 160, bottom: 300 };

export const COLORS = {
  white: '#FFFFFF',
  gold: '#FFC25C', // warm gold-orange accent, readable on the red curtain
  goldDeep: '#F29A2E',
  ink: '#1A0B08',
  cyan: '#38CCFF', // V4 key-word accent (bright blue, reads on the red curtain and on the white shirt with a thin outline)
  outline: '#14070A',
};

export const FONTS = {
  head: 'Oswald, sans-serif',
  body: 'Montserrat, sans-serif',
};

// Title + card block above the presenter (camera mode "card" pushes the head to y≈730).
export const TITLE_TOP = 168;
export const CARD = { x: 90, y: 322, w: 900, h: 384, bar: 40, radius: 26 };

// Subtitles sit in the lower third, bottom edge above the 300px Reels UI zone.
export const SUB = { bottom: 1920 - 300 - 24, left: SAFE.left, right: SAFE.right };

// Rough fit for one-line uppercase Oswald headings (avg uppercase glyph ≈ 0.56em incl. Cyrillic).
export const fitSize = (text: string, base: number, maxWidth: number) =>
  Math.min(base, Math.floor(maxWidth / (Math.max(1, text.length) * 0.56)));
