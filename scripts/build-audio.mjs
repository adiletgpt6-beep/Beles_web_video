// Assembles the voice track from data/audio-plan.json with FFmpeg.
//   in : public/media/source48k.wav (from prepare-media.sh), assets/sfx/*.wav
//   out: public/media/voice.wav  (48 kHz, target −15 LUFS integrated, true peak ≤ −1.5 dBTP)
// Each cut gets a 12 ms fade on both sides (no clicks); clips butt-join, so lip sync stays frame exact.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const plan = JSON.parse(fs.readFileSync(path.join(root, 'data/audio-plan.json'), 'utf8'));
const FPS = plan.fps;
const src = path.join(root, 'public/media/source48k.wav');
const out = path.join(root, 'public/media/voice.wav');
const tmp = path.join(root, 'public/media/voice_raw.wav');
const FADE = 0.012;

const parts = [];
plan.clips.forEach((c, i) => {
  const a = c.srcInFrame / FPS;
  const b = c.srcOutFrame / FPS;
  const d = b - a;
  parts.push(`[0:a]atrim=start=${a.toFixed(6)}:end=${b.toFixed(6)},asetpts=PTS-STARTPTS,afade=t=in:d=${FADE},afade=t=out:st=${(d - FADE).toFixed(6)}:d=${FADE}[c${i}]`);
});
const concat = plan.clips.map((_, i) => `[c${i}]`).join('') + `concat=n=${plan.clips.length}:v=0:a=1[cat]`;
// Gentle voice chain: rumble cut, light broadband denoise, soft compression.
const voice = `[cat]highpass=f=75,afftdn=nr=7:nf=-44:tn=1,acompressor=threshold=-21dB:ratio=2.3:attack=8:release=140:makeup=1.5[v]`;

const inputs = ['-i', src];
const sfxLabels = [];
plan.sfx.forEach((s, i) => {
  inputs.push('-i', path.join(root, `assets/sfx/${s.type}.wav`));
  const delay = Math.round((s.frame / FPS) * 1000);
  const vol = s.type === 'whoosh' ? 0.16 : 0.12; // well under the voice
  parts.push(`[${i + 1}:a]adelay=${delay}:all=1,volume=${vol}[s${i}]`);
  sfxLabels.push(`[s${i}]`);
});
const mix = sfxLabels.length
  ? `[v]${sfxLabels.join('')}amix=inputs=${sfxLabels.length + 1}:normalize=0:duration=first[m]`
  : `[v]anull[m]`;
const graph = [...parts, concat, voice, mix].join(';');
const total = plan.durationInFrames / FPS;

execFileSync('ffmpeg', ['-hide_banner', '-y', ...inputs, '-filter_complex', graph, '-map', '[m]', '-t', total.toFixed(6), '-ar', '48000', '-c:a', 'pcm_s24le', tmp], { stdio: 'inherit' });

// Two-pass loudness normalisation.
const target = 'I=-15:TP=-1.5:LRA=9';
const res = execFileSync('bash', ['-c', `ffmpeg -hide_banner -i "${tmp}" -af loudnorm=${target}:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p'`], { encoding: 'utf8' });
const j = JSON.parse(res);
const second = `loudnorm=${target}:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true,alimiter=limit=0.83:attack=3:release=60:level=false`;
execFileSync('ffmpeg', ['-hide_banner', '-y', '-i', tmp, '-af', second, '-ar', '48000', '-c:a', 'pcm_s24le', out], { stdio: 'inherit' });
fs.unlinkSync(tmp);
console.log('voice track:', out, 'measured input', j.input_i, 'LUFS', j.input_tp, 'dBTP');
