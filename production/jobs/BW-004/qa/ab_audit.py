"""BW-004 A/B exclusivity audit over EVERY frame of the final MP4.

1) Schedule (from data/timeline.generated.json, same constants as src/paper.tsx IN/OUT):
   per frame -> A (presenter+captions), T (transition: presenter <-> EMPTY paper), B (paper opaque, scene live).
2) Pixels (decoded final video, every frame at 216x384):
   curtain = share of dark-red studio-curtain pixels; paper = share of paper-coloured pixels.
   A frames must show the presenter (curtain high, paper ~0); B frames must show no presenter (curtain ~0).
   T frames: checks that no scene element exists = frame is a blend of presenter and the plain paper only,
   verified by schedule (elements are mounted only when paper opacity == 1) and by pixel test: inside T the
   frame must be explained by mix(previous A frame look, paper) -> we check absence of scene ink/red/green pixels.
Usage: python3 ab_audit.py timeline.generated.json final.mp4 out.json
"""
import json, subprocess, sys
import numpy as np

IN, OUT = 10, 10
tl = json.load(open(sys.argv[1])); mp4 = sys.argv[2]
N = tl['durationInFrames']; W, H = 216, 384
sched = ['A'] * N
for o in tl.get('overlays', []):
    s, e = o['startFrame'], o['endFrame']; d = e - s
    for f in range(s, e):
        l = f - s
        if l < IN or (not o.get('hold') and l >= d - OUT): sched[f] = 'T'
        else: sched[f] = 'B'
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, '-vf', f'scale={W}:{H}:flags=area', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3).astype(np.int16)
assert len(fr) == N, (len(fr), N)
r, g, b = fr[..., 0], fr[..., 1], fr[..., 2]
curtain = ((r > 45) & (r < 200) & (g < 70) & (b < 70) & (r > 2 * g)).mean(axis=(1, 2))
paper = ((abs(r - 242) < 22) & (abs(g - 238) < 22) & (abs(b - 229) < 22)).mean(axis=(1, 2))
# scene "ink" elements: strong scene colours that never appear in the studio frame or plain paper
ink = ((r < 60) & (g < 70) & (b > 50) & (b > r + 15)).mean(axis=(1, 2))          # #10233F navy
green = ((g > 140) & (r < 90) & (b < 150) & (g > r + 60)).mean(axis=(1, 2))       # #16A36A / #25D366
rows, bad = [], []
for f in range(N):
    m = sched[f]
    row = dict(f=f, mode=m, curtain=round(float(curtain[f]), 4), paper=round(float(paper[f]), 4), ink=round(float(ink[f]), 4), green=round(float(green[f]), 4))
    rows.append(row)
    if f < tl.get('fadeIn', 0): continue
    if m == 'A' and (paper[f] > 0.02 or ink[f] > 0.01 or green[f] > 0.005): bad.append((f, 'A frame shows scene/paper', row))
    if m == 'B' and curtain[f] > 0.002: bad.append((f, 'B frame shows presenter (curtain pixels)', row))
    if m == 'T' and (ink[f] > 0.01 or green[f] > 0.003): bad.append((f, 'transition frame contains scene element', row))
summary = dict(frames=N, A=sched.count('A'), T=sched.count('T'), B=sched.count('B'), violations=len(bad),
               max_curtain_in_B=round(float(max([curtain[i] for i in range(N) if sched[i] == 'B'] or [0])), 4),
               max_paper_in_A=round(float(max([paper[i] for i in range(N) if sched[i] == 'A' and i >= tl.get('fadeIn', 0)] or [0])), 4),
               max_ink_in_T=round(float(max([ink[i] for i in range(N) if sched[i] == 'T'] or [0])), 4),
               max_green_in_T=round(float(max([green[i] for i in range(N) if sched[i] == 'T'] or [0])), 4),
               min_curtain_in_A=round(float(min([curtain[i] for i in range(N) if sched[i] == 'A' and i >= tl.get('fadeIn', 0)] or [0])), 4))
json.dump(dict(summary=summary, violations=bad[:50], frames=rows), open(sys.argv[3], 'w'), indent=0)
print(json.dumps(summary, indent=1)); [print(v[:2]) for v in bad[:20]]
