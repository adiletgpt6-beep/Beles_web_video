"""Synthesises the small, consistent sound-effect palette (original, no third-party samples).

  whoosh_in  0.40 s  filtered noise rising into the moment a move lands (place it so it ENDS on the landing)
  swish      0.22 s  short airy pass for card swaps / exits
  tick       0.05 s  soft UI click (cursor click, contact card landing)
  pop        0.12 s  rounded pop for a highlight
  chime      1.20 s  two soft bell partials (A5 + E6) for the phone number reveal

Usage: python3 scripts/make-sfx.py assets/sfx
"""
import sys
import wave

import numpy as np

SR = 48000
rng = np.random.default_rng(11)


def write(path, x):
    x = x / max(1e-9, np.max(np.abs(x))) * 0.8
    with wave.open(path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())


def bandsweep(noise, f0, f1, q=0.25):
    """Very simple time-varying band-pass (state-variable filter)."""
    n = len(noise)
    fc = np.geomspace(f0, f1, n)
    low = band = 0.0
    out = np.empty(n)
    for i in range(n):
        f = 2 * np.sin(np.pi * fc[i] / SR)
        high = noise[i] - low - q * band
        band += f * high
        low += f * band
        out[i] = band
    return out


def whoosh_in():
    n = int(0.40 * SR)
    t = np.arange(n) / SR
    x = bandsweep(rng.standard_normal(n), 300, 4200)
    env = (t / t[-1]) ** 2.2  # swells towards the landing
    env[-int(0.02 * SR):] *= np.linspace(1, 0, int(0.02 * SR))
    return x * env


def swish():
    n = int(0.22 * SR)
    t = np.arange(n) / SR
    x = bandsweep(rng.standard_normal(n), 2500, 700, q=0.35)
    env = np.sin(np.pi * t / t[-1]) ** 1.5
    return x * env


def tick():
    n = int(0.05 * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * 1850 * t) * np.exp(-t * 140) + 0.4 * rng.standard_normal(n) * np.exp(-t * 400)
    return x


def pop():
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    f = 900 * np.exp(-t * 18) + 380
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 32)


def chime():
    n = int(1.2 * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for f, a, d in ((880.0, 1.0, 3.2), (1318.5, 0.6, 3.8), (1760.0, 0.25, 5.0), (2637.0, 0.12, 6.5)):
        x += a * np.sin(2 * np.pi * f * t) * np.exp(-t * d)
    x[: int(0.004 * SR)] *= np.linspace(0, 1, int(0.004 * SR))
    return x


if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else 'assets/sfx'
    for name, fn in (('whoosh_in', whoosh_in), ('swish', swish), ('tick', tick), ('pop', pop), ('chime', chime)):
        write(f'{out}/{name}.wav', fn())
        print('sfx', name)
