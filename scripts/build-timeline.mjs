// Builds every derived timeline file from the hand-made edit decision list data/edit.json.
//
//   data/edit.json                 (input)  chosen takes in SOURCE seconds + overlays anchored to source time
//   data/timeline.generated.json   (output) frames on the FINAL timeline, read by the Remotion composition
//   data/edl.csv, data/edl.edl     (output) source in/out ↔ record in/out (frames @30 fps + timecode)
//   data/subtitles.srt             (output) subtitles re-timed to the final cut
//   data/audio-plan.json           (output) exact audio cut list + SFX positions for scripts/build-audio.mjs
//
// Anchors: "segId@12.34" = source second 12.34 inside segment segId, mapped to the final timeline.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const edit = JSON.parse(fs.readFileSync(path.join(root, 'data/edit.json'), 'utf8'));
const FPS = edit.fps;

const toF = (sec) => Math.round(sec * FPS);
const tc = (frames) => {
  const h = Math.floor(frames / (3600 * FPS));
  const m = Math.floor(frames / (60 * FPS)) % 60;
  const s = Math.floor(frames / FPS) % 60;
  const f = frames % FPS;
  return [h, m, s, f].map((n) => String(n).padStart(2, '0')).join(':');
};
const srtTime = (frames) => {
  const ms = Math.round((frames / FPS) * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor(ms / 60000) % 60;
  const s = Math.floor(ms / 1000) % 60;
  const r = ms % 1000;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(r).padStart(3, '0')}`;
};

// 1. Lay the chosen takes end to end.
let cursor = 0;
const clips = edit.segments.map((s) => {
  const srcInFrame = toF(s.in);
  const srcOutFrame = toF(s.out);
  if (srcOutFrame <= srcInFrame) throw new Error(`segment ${s.id}: out <= in`);
  const c = { id: s.id, srcInFrame, srcOutFrame, startFrame: cursor, durationFrames: srcOutFrame - srcInFrame };
  cursor += c.durationFrames;
  return c;
});
const durationInFrames = cursor;
const byId = Object.fromEntries(clips.map((c) => [c.id, c]));
const segById = Object.fromEntries(edit.segments.map((s) => [s.id, s]));

const anchor = (a) => {
  const [id, t] = a.split('@');
  const c = byId[id];
  if (!c) throw new Error(`unknown segment in anchor ${a}`);
  const f = c.startFrame + (toF(Number(t)) - c.srcInFrame);
  if (f < c.startFrame - 1 || f > c.startFrame + c.durationFrames + 1) throw new Error(`anchor ${a} outside its segment`);
  return Math.max(0, Math.min(durationInFrames, f));
};

// 2. Camera: each segment starts with its own framing (hard cut), overrides can move smoothly inside a take.
const camera = [];
for (const s of edit.segments) camera.push({ frame: byId[s.id].startFrame, mode: s.camera, smooth: false });
for (const o of edit.camera ?? []) camera.push({ frame: anchor(o.at), mode: o.mode, smooth: o.smooth ?? true });
camera.sort((a, b) => a.frame - b.frame);

// 3. Overlays.
const sec = (x) => Math.round(x * FPS);
const cards = (edit.cards ?? []).map((c) => {
  const startFrame = anchor(c.from);
  const endFrame = anchor(c.to);
  return {
    id: c.id,
    startFrame,
    endFrame,
    image: c.image,
    imageWidth: c.imageWidth,
    imageHeight: c.imageHeight,
    url: c.url,
    label: c.label,
    views: c.views.map((v) => ({ frame: sec(v.t), x: v.x, y: v.y, w: v.w })),
    highlight: c.highlight && { ...c.highlight, fromFrame: sec(c.highlight.from), toFrame: sec(c.highlight.to) },
    cursor: c.cursor && { ...c.cursor, fromFrame: sec(c.cursor.from), toFrame: sec(c.cursor.to) },
    expand: c.expand && { x: c.expand.x, y: c.expand.y, w: c.expand.w, h: c.expand.h, fromFrame: sec(c.expand.from), toFrame: sec(c.expand.to) },
  };
});
const titles = (edit.titles ?? []).map((t) => ({ id: t.id, startFrame: anchor(t.from), endFrame: anchor(t.to), accent: t.accent, main: t.main }));
const phones = (edit.phones ?? []).map((p) => {
  const startFrame = anchor(p.from);
  const endFrame = anchor(p.to);
  const out = { ...p, startFrame, endFrame };
  delete out.from;
  delete out.to;
  if (p.labelUntil) out.labelEndFrame = anchor(p.labelUntil) - startFrame;
  delete out.labelUntil;
  if (p.desktop) {
    const from = anchor(p.desktop.from) - startFrame;
    out.desktop = { ...p.desktop, fromFrame: from, views: p.desktop.views.map((v) => ({ frame: from + sec(v.t), x: v.x, y: v.y, w: v.w })) };
    delete out.desktop.from;
  }
  return out;
});
const typeScenes = (edit.typeScenes ?? []).map((t) => {
  const startFrame = anchor(t.from);
  const rel = (a) => anchor(a) - startFrame;
  return {
    id: t.id,
    startFrame,
    endFrame: anchor(t.to),
    small: { text: t.small.text, frame: rel(t.small.at) },
    big: t.big.map((b) => ({ text: b.text, frame: rel(b.at) })),
    rise: t.rise && { text: t.rise.text, frame: rel(t.rise.at) },
  };
});
const badge = edit.badge && {
  startFrame: anchor(edit.badge.from),
  endFrame: anchor(edit.badge.to),
  text: edit.badge.text,
  number: edit.badge.number,
  x: edit.badge.x,
  y: edit.badge.y,
};
const endCard = edit.endCard && { startFrame: anchor(edit.endCard.from), endFrame: anchor(edit.endCard.to), accent: edit.endCard.accent, main: edit.endCard.main };

// 4. Subtitles: phrase groups authored per segment; every word carries its own start (source seconds,
// from word-level alignment), so groups and the active-word highlight are re-timed to the final cut.
const LEAD = 0.06; // group appears this much before its first word is heard
const subtitles = [];
for (const s of edit.segments) {
  const c = byId[s.id];
  const segEnd = c.startFrame + c.durationFrames;
  let wi = 0;
  const groups = (s.subs ?? []).map((g) => {
    const toks = g.text.split(' ');
    const words = toks.map((tok) => {
      const w = s.words[wi++];
      if (!w || w.w !== tok) throw new Error(`segment ${s.id}: subtitle word "${tok}" does not match aligned word "${w && w.w}"`);
      return w;
    });
    return { g, words };
  });
  if (wi !== s.words.length) throw new Error(`segment ${s.id}: subtitles do not cover all words`);
  groups.forEach(({ g, words }, gi) => {
    const keys = new Set(g.key ?? []);
    const startFrame = Math.max(c.startFrame, anchor(`${s.id}@${Math.max(s.in, words[0].t - LEAD).toFixed(3)}`));
    const next = groups[gi + 1];
    const endFrame = next
      ? anchor(`${s.id}@${Math.max(s.in, next.words[0].t - LEAD).toFixed(3)}`)
      : Math.min(segEnd, anchor(`${s.id}@${Math.min(s.out, s.speechEnd + 0.35).toFixed(3)}`));
    subtitles.push({
      startFrame,
      endFrame,
      words: words.map((w) => ({
        text: w.w,
        key: keys.has(w.w.replace(/[.,!?…]/g, '')),
        startFrame: Math.max(startFrame, anchor(`${s.id}@${w.t.toFixed(3)}`)),
      })),
      ...(g.place ? { place: g.place } : s.subPlace ? { place: s.subPlace } : {}),
      ...(g.scene ? { scene: true } : {}),
    });
  });
}
subtitles.sort((a, b) => a.startFrame - b.startFrame);
for (let i = 0; i < subtitles.length - 1; i++) {
  // no overlaps; close tiny gaps (<6 frames) so text does not flicker between groups
  const a = subtitles[i];
  const b = subtitles[i + 1];
  if (a.endFrame > b.startFrame) a.endFrame = b.startFrame;
  if (b.startFrame - a.endFrame < 6) a.endFrame = b.startFrame;
}

const timeline = {
  fps: FPS,
  width: edit.width,
  height: edit.height,
  durationInFrames,
  video: edit.video,
  audio: edit.audio,
  clips,
  camera,
  cards,
  titles,
  phones,
  subtitles,
  endCard,
  badge,
  typeScenes,
};
fs.writeFileSync(path.join(root, 'data/timeline.generated.json'), JSON.stringify(timeline, null, 1));

// 5. EDL (CSV + CMX3600) — source and record positions kept separately, units stated.
const csv = ['clip_id,source_in_s,source_out_s,source_in_frame,source_out_frame,record_in_frame,record_out_frame,record_in_tc,record_out_tc,duration_frames,camera,text'];
const cmx = ['TITLE: BELES WEB REEL', 'FCM: NON-DROP FRAME', `* FPS ${FPS}, SOURCE 1000218256.mp4`, ''];
clips.forEach((c, i) => {
  const s = segById[c.id];
  csv.push(
    [c.id, (c.srcInFrame / FPS).toFixed(3), (c.srcOutFrame / FPS).toFixed(3), c.srcInFrame, c.srcOutFrame, c.startFrame, c.startFrame + c.durationFrames, tc(c.startFrame), tc(c.startFrame + c.durationFrames), c.durationFrames, s.camera, `"${s.text.replace(/"/g, '""')}"`].join(','),
  );
  cmx.push(`${String(i + 1).padStart(3, '0')}  SRC      AA/V  C        ${tc(c.srcInFrame)} ${tc(c.srcOutFrame)} ${tc(c.startFrame)} ${tc(c.startFrame + c.durationFrames)}`);
  cmx.push(`* FROM CLIP NAME: 1000218256.mp4  (${c.id})`);
});
fs.writeFileSync(path.join(root, 'data/edl.csv'), csv.join('\n') + '\n');
fs.writeFileSync(path.join(root, 'data/edl.edl'), cmx.join('\n') + '\n');

// 6. SRT
const srt = subtitles.map((s, i) => `${i + 1}\n${srtTime(s.startFrame)} --> ${srtTime(s.endFrame)}\n${s.words.map((w) => w.text).join(' ')}\n`);
fs.writeFileSync(path.join(root, 'data/subtitles.srt'), srt.join('\n'));

// 7. Audio plan: exact same frame-accurate cuts + sound effects at overlay entrances.
// Sound accents are listed explicitly in edit.json (only on meaningful appearances).
// "lands" anchors give the moment a move ends; the sound is shifted so its peak falls exactly there.
const PEAK = { whoosh_in: 0.36, swish: 0.16, tick: 0, pop: 0, chime: 0 };
const sfx = (edit.sfx ?? []).map((x) => ({
  type: x.type,
  frame: Math.max(0, anchor(x.lands) - Math.round((PEAK[x.type] ?? 0) * FPS)),
  gainDb: x.gainDb ?? 0,
}));
fs.writeFileSync(
  path.join(root, 'data/audio-plan.json'),
  JSON.stringify({ fps: FPS, durationInFrames, music: edit.music ? { ...edit.music, accentFrame: edit.music.accentAt ? anchor(edit.music.accentAt) : null } : null, clips: clips.map((c) => ({ id: c.id, srcInFrame: c.srcInFrame, srcOutFrame: c.srcOutFrame, startFrame: c.startFrame })), sfx }, null, 1),
);

console.log(`final duration: ${durationInFrames} frames = ${(durationInFrames / FPS).toFixed(2)} s, ${clips.length} clips, ${subtitles.length} subtitle groups`);
