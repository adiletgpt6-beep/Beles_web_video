"""BW-004 v3: three extra original sound effects (synthesised, no third-party samples).

  air     0.80 s  very soft, low-passed air whoosh for the A<->B paper dissolves (peak at 0.45 s)
  swoosh  0.34 s  mid "swoosh" for a screen switch inside a scene (peak at 0.18 s)
  click   0.06 s  soft UI tap for a finger/cursor press (peak at 0)
Usage: python3 make-sfx-bw004.py assets/sfx
"""
import sys, wave
import numpy as np
SR = 48000
rng = np.random.default_rng(404)

def write(path, x, peak=0.7):
    x = x / max(1e-9, np.max(np.abs(x))) * peak
    with wave.open(path, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())

def svf_band(x, fc, q):
    low = band = 0.0; out = np.empty(len(x))
    for i in range(len(x)):
        f = 2 * np.sin(np.pi * fc[i] / SR)
        high = x[i] - low - q * band; band += f * high; low += f * band; out[i] = band
    return out

def lowpass(x, fc):
    a = np.exp(-2 * np.pi * fc / SR); y = np.empty(len(x)); s = 0.0
    for i, v in enumerate(x): s = (1 - a) * v + a * s; y[i] = s
    return y

out = sys.argv[1]
# air: band sweep 300 -> 1600 -> 500 Hz, bell envelope peaking at 0.45 s, low-passed (no hiss)
n = int(0.8 * SR); t = np.arange(n) / SR
fc = np.interp(t, [0, 0.45, 0.8], [300, 1600, 500])
x = svf_band(rng.standard_normal(n), fc, 0.9)
env = np.exp(-((t - 0.45) / 0.17) ** 2)
write(f'{out}/air.wav', lowpass(x * env, 2600))
# swoosh: faster sweep 2500 -> 600 Hz
n = int(0.34 * SR); t = np.arange(n) / SR
fc = np.geomspace(2500, 600, n)
x = svf_band(rng.standard_normal(n), fc, 0.6)
env = np.exp(-((t - 0.18) / 0.07) ** 2)
write(f'{out}/swoosh.wav', lowpass(x * env, 4500))
# click: short damped 1.9 kHz + 3.8 kHz partials with a tiny noise transient
n = int(0.06 * SR); t = np.arange(n) / SR
x = (np.sin(2 * np.pi * 1900 * t) + 0.35 * np.sin(2 * np.pi * 3800 * t)) * np.exp(-t / 0.009)
x[:96] += rng.standard_normal(96) * np.linspace(0.6, 0, 96)
write(f'{out}/click.wav', lowpass(x, 7000), 0.6)
print('air/swoosh/click written to', out)
