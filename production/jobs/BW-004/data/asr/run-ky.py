# BW-004 (copied from BW-003): nineninesix/kyrgyz-whisper-medium over speech regions from the silence map (same method as BW-002, scripts/asr/ky2.py)
import json, sys, wave, numpy as np, torch
from transformers import WhisperForConditionalGeneration, WhisperProcessor
torch.set_num_threads(4)
WAV, SIL, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
START = float(sys.argv[4]) if len(sys.argv) > 4 else 0.0  # resume: only regions starting at/after this second
BEAMS = int(sys.argv[5]) if len(sys.argv) > 5 else 4
MODEL = 'nineninesix/kyrgyz-whisper-medium'
proc = WhisperProcessor.from_pretrained(MODEL); model = WhisperForConditionalGeneration.from_pretrained(MODEL).eval()
tok = proc.tokenizer
w = wave.open(WAV); a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
dur = len(a) / 16000
sil = [tuple(map(float, l.split())) for l in open(SIL) if l.strip()]
regs = []; prev = 0.0
for s, e in sil:
    if s - prev > 0.12: regs.append([prev, s])
    prev = e
if dur - prev > 0.12: regs.append([prev, dur])
m = []
for r in regs:
    if m and r[0] - m[-1][1] < 1.0 and r[1] - m[-1][0] < 28: m[-1][1] = r[1]
    else: m.append(r)
prompt = torch.tensor([[50258, 51865, 50359, 50363]])
out = []
for s, e in m:
    if s < START: continue
    s0 = max(0, s - 0.25); e0 = min(dur, e + 0.25)
    seg = a[int(s0 * 16000):int(e0 * 16000)]
    feats = proc(seg, sampling_rate=16000, return_tensors='pt').input_features
    with torch.no_grad():
        g = model.generate(feats, decoder_input_ids=prompt, max_new_tokens=200, num_beams=BEAMS, return_token_timestamps=True, return_dict_in_generate=True)
    seqs = g['sequences'] if isinstance(g, dict) else g.sequences
    tt = (g.get('token_timestamps') if isinstance(g, dict) else getattr(g, 'token_timestamps', None))
    ids = seqs[0].tolist(); ts = tt[0].tolist() if tt is not None else None
    text = tok.decode(ids, skip_special_tokens=True).strip()
    toks = []
    if ts:
        for i, t in zip(ids, ts):
            if i < 50257: toks.append([tok.decode([i]), round(s0 + t, 2)])
    print('%7.2f %7.2f | %s' % (s, e, text), flush=True)
    out.append(dict(start=round(s, 2), end=round(e, 2), text=text, tokens=toks))
    json.dump(out, open(OUT, 'w'), ensure_ascii=False, indent=1)
