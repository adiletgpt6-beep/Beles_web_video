"""Synthesises the background music bed (original, no third-party audio, no licence needed).

Modern minimal instrumental, 96 BPM, A minor, progression Am–F–C–G:
warm detuned pad, soft pluck arpeggio with a dotted-8th echo, sub bass, gentle kick and shaker.
It ends on a resolved Am chord with a natural fade.

Usage: python3 scripts/make-music.py <seconds> out.wav [accent_seconds]

With accent_seconds the groove stops there and a resolving Am chord (with a soft bell) rings out to the end.
"""
import sys
import wave

import numpy as np

SR = 48000
BPM = 96.0
BEAT = 60.0 / BPM
BAR = 4 * BEAT
rng = np.random.default_rng(7)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def onepole_lp(x, fc):
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):  # small buffers only (per note)
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def saw(f, t, phase=0.0):
    return 2 * ((f * t + phase) % 1.0) - 1


def adsr(n, a, d, s, r):
    env = np.ones(n) * s
    k = min(1.0, n / max(1, int((a + d + r) * SR)))  # short notes: compress the envelope
    A, D, R = int(a * SR * k), int(d * SR * k), max(1, int(r * SR * k))
    env[:A] = np.linspace(0, 1, A, endpoint=False)
    env[A:A + D] = np.linspace(1, s, D, endpoint=False)
    env[-R:] *= np.linspace(1, 0, R)
    return env


def main(total, out, accent=None):
    n = int(total * SR)
    L = np.zeros(n)
    R = np.zeros(n)
    prog = [  # chord tones (midi) + bass root
        ([57, 60, 64, 69], 45),  # Am
        ([53, 57, 60, 65], 41),  # F
        ([55, 60, 64, 67], 48),  # C
        ([55, 59, 62, 67], 43),  # G
    ]
    bars = int(np.ceil(total / BAR)) + 1
    for b in range(bars):
        t0 = b * BAR
        if t0 >= total - 0.3:
            break
        last = t0 + BAR >= total - 0.01
        if accent is not None and t0 >= accent:
            break
        notes, root = prog[0] if last else prog[b % 4]
        dur = min(BAR + 0.6, total - t0, (accent - t0 + 0.25) if accent is not None else 1e9)
        m = int(dur * SR)
        t = np.arange(m) / SR
        s0 = int(t0 * SR)
        # pad: three detuned saws per note, lowpassed, slow swell
        pad = np.zeros(m)
        for k, nn in enumerate(notes):
            f = midi(nn)
            for det, ph in ((-0.12, 0.1), (0.0, 0.5), (0.13, 0.8)):
                pad += saw(f * 2 ** (det / 12), t, ph + k * 0.2)
        pad = onepole_lp(pad / 12.0, 900.0)
        pad *= adsr(m, 0.6, 0.4, 0.8, 0.7)
        e = min(n, s0 + m)
        L[s0:e] += 0.22 * pad[: e - s0]
        R[s0:e] += 0.22 * np.roll(pad, 240)[: e - s0]
        # sub bass on beats 1 and 3
        for beat in (0, 2):
            bt = t0 + beat * BEAT
            if bt >= total or (accent is not None and bt >= accent):
                continue
            bm = int(min(2 * BEAT, total - bt) * SR)
            tb = np.arange(bm) / SR
            bass = np.sin(2 * np.pi * midi(root) * tb) * adsr(bm, 0.01, 0.3, 0.6, 0.3)
            i0 = int(bt * SR)
            L[i0:i0 + bm] += 0.16 * bass
            R[i0:i0 + bm] += 0.16 * bass
        # pluck arpeggio (8th notes), not on the final resolving bar
        if not last:
            pattern = [0, 2, 1, 3, 2, 1, 3, 2]
            for step, idx in enumerate(pattern):
                pt = t0 + step * BEAT / 2
                if pt >= total - 0.3 or (accent is not None and pt >= accent - 0.05):
                    continue
                pm = int(0.5 * SR)
                tp = np.arange(pm) / SR
                f = midi(notes[idx] + 12)
                tone = (np.sin(2 * np.pi * f * tp) + 0.3 * np.sin(4 * np.pi * f * tp)) * np.exp(-tp * 9)
                i0 = int(pt * SR)
                pan = 0.35 + 0.3 * (step % 2)
                for delay, g in ((0, 1.0), (0.75 * BEAT, 0.35), (1.5 * BEAT, 0.12)):  # dotted-8th echo
                    j0 = i0 + int(delay * SR)
                    if j0 >= n:
                        continue
                    j1 = min(n, j0 + pm)
                    L[j0:j1] += 0.07 * g * (1 - pan) * tone[: j1 - j0]
                    R[j0:j1] += 0.07 * g * pan * tone[: j1 - j0]
        # drums: soft kick on 1 and 3, shaker on off-beats (skip first bar for a gentle entry)
        if b > 0 and not last:
            for beat in range(4):
                bt = t0 + beat * BEAT
                if accent is not None and bt >= accent - 0.05:
                    continue
                if beat in (0, 2):
                    km = int(0.35 * SR)
                    tk = np.arange(km) / SR
                    freq = 45 + 75 * np.exp(-tk * 30)
                    kick = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-tk * 9)
                    i0 = int(bt * SR)
                    j1 = min(n, i0 + km)
                    L[i0:j1] += 0.30 * kick[: j1 - i0]
                    R[i0:j1] += 0.30 * kick[: j1 - i0]
                st = bt + BEAT / 2
                sm = int(0.07 * SR)
                noise = rng.standard_normal(sm)
                noise = noise - onepole_lp(noise, 6000.0)  # keep the bright part
                shaker = noise * np.exp(-np.arange(sm) / SR * 55)
                i0 = int(st * SR)
                j1 = min(n, i0 + sm)
                if i0 < n:
                    L[i0:j1] += 0.035 * shaker[: j1 - i0]
                    R[i0:j1] += 0.045 * shaker[: j1 - i0]
    if accent is not None:
        # resolving Am chord + soft bell from the accent to the end (number on screen)
        i0 = int(accent * SR)
        m = n - i0
        t = np.arange(m) / SR
        pad = np.zeros(m)
        for k, nn in enumerate([45, 57, 60, 64, 69]):
            f = midi(nn)
            for det, ph in ((-0.1, 0.2), (0.11, 0.7)):
                pad += saw(f * 2 ** (det / 12), t, ph + k * 0.3)
        pad = onepole_lp(pad / 10.0, 1100.0) * adsr(m, 0.05, 0.6, 0.8, 1.2)
        bell = sum(a * np.sin(2 * np.pi * midi(nn) * t) * np.exp(-t * dcy) for nn, a, dcy in ((81, 0.08, 2.2), (88, 0.05, 2.8)))
        L[i0:] += 0.55 * pad + 1.8 * bell
        R[i0:] += 0.55 * np.roll(pad, 240) + 1.8 * bell
    # global fades: 0.6 s in, 0.9 s out (after the last word)
    fi = int(0.6 * SR)
    fo = int(0.9 * SR)
    for ch in (L, R):
        ch[:fi] *= np.linspace(0, 1, fi)
        ch[-fo:] *= np.linspace(1, 0, fo) ** 1.2
    st = np.stack([L, R], 1)
    st /= np.max(np.abs(st)) / 0.7
    pcm = (st * 32767).astype(np.int16)
    with wave.open(out, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print('music bed', out, f'{total:.2f}s')


if __name__ == '__main__':
    main(float(sys.argv[1]), sys.argv[2], float(sys.argv[3]) if len(sys.argv) > 3 else None)
