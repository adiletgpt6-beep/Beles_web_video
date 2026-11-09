"""BW-004: turn the user's reference video (1000223289.mp4) into the background bed for the edit.

  python3 prep-music.py <reference.mp4|.m4a|.wav> <seconds> <out.wav> [--start S]

1. extracts the audio track (48 kHz stereo);
2. picks the most even musical stretch of the required length: every 0.25 s start is scored by the spread of its
   short-term loudness (no drops to silence, no sudden peaks) and snapped to the nearest onset so the bed starts on
   a beat; --start overrides the choice;
3. loops with a 1.5 s crossfade only if the reference is shorter than needed;
4. 0.8 s fade-in, 2.5 s fade-out, loudness-normalised to −18 LUFS (scripts/build-audio.mjs then sets the bed
   ~20 dB under the voice and side-chain-ducks it while he speaks).
The script reports the chosen start and writes <out>.json with it, so the choice is reproducible.
"""
import json, subprocess, sys
import numpy as np

SR = 48000
ref, dur, out = sys.argv[1], float(sys.argv[2]), sys.argv[3]
start_override = float(sys.argv[sys.argv.index('--start') + 1]) if '--start' in sys.argv else None
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', ref, '-vn', '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
x = np.frombuffer(raw, np.float32).reshape(-1, 2).astype(np.float64)
total = len(x) / SR
mono = x.mean(axis=1)
hop = int(0.05 * SR)
rms = np.array([np.sqrt(np.mean(mono[i:i + hop] ** 2)) + 1e-9 for i in range(0, len(mono) - hop, hop)])
db = 20 * np.log10(rms)
flux = np.maximum(0, np.diff(db, prepend=db[0]))  # crude onset strength
need = dur + 0.1
if total >= need:
    if start_override is not None:
        start = start_override
    else:
        best = None
        for s in np.arange(0, total - need + 1e-6, 0.25):
            a, b = int(s / 0.05), int((s + dur) / 0.05)
            w = db[a:b]
            if len(w) < 10: continue
            # even loudness, no near-silence, not the quiet intro/outro
            score = np.std(w) + 3.0 * np.mean(w < (np.median(db) - 20)) - 0.05 * (np.mean(w) - np.median(db))
            if best is None or score < best[0]: best = (score, s)
        start = best[1]
        # snap to the strongest onset within ±0.5 s
        i0 = int(start / 0.05); lo, hi = max(0, i0 - 10), min(len(flux), i0 + 10)
        start = (lo + int(np.argmax(flux[lo:hi]))) * 0.05
        start = min(max(0.0, start), total - need)
    seg = x[int(start * SR):int((start + dur) * SR)]
else:
    start = 0.0
    xf = int(1.5 * SR); seg = x.copy()
    while len(seg) < dur * SR:
        ramp = np.linspace(0, 1, xf)[:, None]
        seg = np.concatenate([seg[:-xf], seg[-xf:] * (1 - ramp) + x[:xf] * ramp, x[xf:]])
    seg = seg[:int(dur * SR)]
n = len(seg); t = np.arange(n) / SR
env = np.minimum(1, t / 0.8) * np.minimum(1, (dur - t) / 2.5)
seg = seg * np.clip(env, 0, 1)[:, None]
tmp = out + '.raw.wav'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', tmp], input=seg.astype(np.float32).tobytes(), check=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-af', 'loudnorm=I=-18:TP=-2:LRA=11', '-ar', str(SR), '-c:a', 'pcm_s24le', out], check=True)
subprocess.run(['rm', '-f', tmp])
info = dict(reference=ref, reference_seconds=round(total, 3), start=round(start, 3), seconds=dur, looped=total < need, fade_in=0.8, fade_out=2.5, lufs=-18)
json.dump(info, open(out + '.json', 'w'), indent=1)
print(json.dumps(info))
