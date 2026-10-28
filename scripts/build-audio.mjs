// Assembles the soundtrack from data/audio-plan.json with FFmpeg.
//   in : public/media/source48k.wav (from prepare-media.sh), assets/sfx/*.wav,
//        music bed synthesised by scripts/make-music.py (deterministic, original)
//   out: public/media/voice.wav  (48 kHz stereo mix, target −15 LUFS integrated, true peak ≤ −1.5 dBTP)
// Voice: each cut gets a 12 ms fade on both sides (no clicks); clips butt-join, so lip sync stays frame exact.
// Music: kept ~20 dB under the voice and side-chain ducked further while he speaks.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const plan = JSON.parse(fs.readFileSync(path.join(root, 'data/audio-plan.json'), 'utf8'));
const FPS = plan.fps;
const src = path.join(root, 'public/media/source48k.wav');
const out = path.join(root, 'public/media/voice.wav');
const tmp = path.join(root, 'public/media/mix_raw.wav');
const FADE = 0.012;
const total = plan.durationInFrames / FPS;

const inputs = ['-i', src];
const parts = [];
plan.clips.forEach((c, i) => {
  const a = c.srcInFrame / FPS;
  const b = c.srcOutFrame / FPS;
  const d = b - a;
  parts.push(`[0:a]atrim=start=${a.toFixed(6)}:end=${b.toFixed(6)},asetpts=PTS-STARTPTS,afade=t=in:d=${FADE},afade=t=out:st=${(d - FADE).toFixed(6)}:d=${FADE}[c${i}]`);
});
parts.push(plan.clips.map((_, i) => `[c${i}]`).join('') + `concat=n=${plan.clips.length}:v=0:a=1[cat]`);
// Gentle voice chain: rumble cut, light broadband denoise, soft compression; split for the music side-chain.
parts.push(`[cat]highpass=f=75,afftdn=nr=7:nf=-44:tn=1,acompressor=threshold=-21dB:ratio=2.3:attack=8:release=140:makeup=1.5,asplit=2[v][vkey]`);

const mixIn = ['[v]'];
let next = 1;
if (plan.music) {
  const bed = path.join(root, 'public/media/music_bed.wav');
  const accentArgs = plan.music.accentFrame != null ? [(plan.music.accentFrame / FPS).toFixed(3)] : [];
  execFileSync('python3', [path.join(root, 'scripts/make-music.py'), total.toFixed(3), bed, ...accentArgs], { stdio: 'inherit' });
  inputs.push('-i', bed);
  const g = plan.music.gainDb ?? -24;
  // Keep the speech band clear, then duck under the voice (≈ −3 dB extra while speaking).
  parts.push(
    `[${next}:a]highpass=f=60,equalizer=f=2500:t=q:w=1.2:g=-4,equalizer=f=450:t=q:w=1:g=-2,volume=${g}dB[mus]`,
    `[vkey]aformat=channel_layouts=stereo[key]`,
    `[mus][key]sidechaincompress=threshold=0.03:ratio=2:attack=40:release=450:makeup=1[duck]`,
  );
  mixIn.push('[duck]');
  next++;
} else {
  parts.push('[vkey]anullsink');
}
plan.sfx.forEach((s, i) => {
  inputs.push('-i', path.join(root, `assets/sfx/${s.type}.wav`));
  const delay = Math.round((s.frame / FPS) * 1000);
  const base = { whoosh_in: -17, swish: -19, tick: -18, pop: -19, chime: -21 }[s.type] ?? -18; // well under the voice
  parts.push(`[${next}:a]adelay=${delay}:all=1,volume=${base + (s.gainDb ?? 0)}dB[s${i}]`);
  mixIn.push(`[s${i}]`);
  next++;
});
parts.push(`${mixIn.join('')}amix=inputs=${mixIn.length}:normalize=0:duration=first[m]`);

execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...inputs, '-filter_complex', parts.join(';'), '-map', '[m]', '-t', total.toFixed(6), '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s24le', tmp], { stdio: 'inherit' });

// Two-pass loudness normalisation of the full mix.
const target = 'I=-15:TP=-1.5:LRA=9';
const res = execFileSync('bash', ['-c', `ffmpeg -hide_banner -i "${tmp}" -af loudnorm=${target}:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p'`], { encoding: 'utf8' });
const j = JSON.parse(res);
const second = `loudnorm=${target}:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true,alimiter=limit=0.83:attack=3:release=60:level=false`;
execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', tmp, '-af', second, '-ar', '48000', '-c:a', 'pcm_s24le', out], { stdio: 'inherit' });
fs.unlinkSync(tmp);
if (process.env.STEMS) {
  // Diagnostic: music stem through the same ducking and the same final gain as the mix.
  const gain = -15 - Number(j.input_i);
  const stemGraph = parts.filter((p) => !p.includes('amix')).join(';') + `;[v]anullsink;[duck]volume=${gain.toFixed(2)}dB[mo]`;
  const sfxCount = plan.sfx.length;
  const ins = inputs.slice(0, inputs.length - 2 * sfxCount);
  const graph = stemGraph.split(';').filter((p) => !/^\[\d+:a\]adelay/.test(p)).join(';');
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...ins, '-filter_complex', graph, '-map', '[mo]', '-t', total.toFixed(6), '-c:a', 'pcm_s24le', path.join(root, 'public/media/stem_music.wav')], { stdio: 'inherit' });
  console.log('music stem written (gain', gain.toFixed(2), 'dB)');
}
console.log('mix:', out, 'measured input', j.input_i, 'LUFS', j.input_tp, 'dBTP');
