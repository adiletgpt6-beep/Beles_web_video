import json,wave,glob,numpy as np,torch
from transformers import WhisperForConditionalGeneration, WhisperProcessor
torch.set_num_threads(4)
P=glob.glob('/root/.cache/huggingface/hub/models--nineninesix--kyrgyz-whisper-medium/snapshots/*')[0]
proc=WhisperProcessor.from_pretrained(P); model=WhisperForConditionalGeneration.from_pretrained(P).eval()
tok=proc.tokenizer
w=wave.open('../src16k.wav');a=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32768
dur=len(a)/16000
sil=[tuple(map(float,l.split())) for l in open('../silences.txt')]
regs=[];prev=0.0
for s,e in sil:
    if s-prev>0.12: regs.append([prev,s])
    prev=e
if dur-prev>0.12: regs.append([prev,dur])
m=[]
for r in regs:
    if m and r[0]-m[-1][1]<1.0 and r[1]-m[-1][0]<28: m[-1][1]=r[1]
    else: m.append(r)
prompt=torch.tensor([[50258,51865,50359,50363]])
out=[]
for s,e in m:
    s0=max(0,s-0.25);e0=min(dur,e+0.25)
    seg=a[int(s0*16000):int(e0*16000)]
    feats=proc(seg,sampling_rate=16000,return_tensors='pt').input_features
    with torch.no_grad():
        g=model.generate(feats,decoder_input_ids=prompt,max_new_tokens=200,num_beams=4,return_token_timestamps=True,return_dict_in_generate=True)
    seqs=g['sequences'] if isinstance(g,dict) else g.sequences
    tt=(g.get('token_timestamps') if isinstance(g,dict) else getattr(g,'token_timestamps',None))
    ids=seqs[0].tolist(); ts=tt[0].tolist() if tt is not None else None
    if s==m[0][0]: print('len',len(ids),len(ts) if ts else None,flush=True)
    text=tok.decode(ids,skip_special_tokens=True).strip()
    toks=[]
    if ts:
        for i,t in zip(ids,ts):
            if i<50257: toks.append([tok.decode([i]),round(s0+t,2)])
    print('%7.2f %7.2f | %s'%(s,e,text),flush=True)
    out.append(dict(start=round(s,2),end=round(e,2),text=text,tokens=toks))
    json.dump(out,open('ky.json','w'),ensure_ascii=False,indent=1)
