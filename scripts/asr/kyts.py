import sys,wave,glob,numpy as np,torch
from transformers import WhisperForConditionalGeneration, WhisperProcessor
torch.set_num_threads(4)
P=glob.glob('/root/.cache/huggingface/hub/models--nineninesix--kyrgyz-whisper-medium/snapshots/*')[0]
proc=WhisperProcessor.from_pretrained(P); model=WhisperForConditionalGeneration.from_pretrained(P).eval()
w=wave.open('../src16k.wav');a=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32768
prompt=torch.tensor([[50258,51865,50359,50363]])
s,e=map(float,sys.argv[1].split('-'));s0=s-0.25
f=proc(a[int(s0*16000):int((e+0.25)*16000)],sampling_rate=16000,return_tensors='pt').input_features
with torch.no_grad(): g=model.generate(f,decoder_input_ids=prompt,max_new_tokens=80,num_beams=1,return_token_timestamps=True,return_dict_in_generate=True)
ids=g['sequences'][0].tolist();ts=g['token_timestamps'][0].tolist()
out=[];
for i,t in zip(ids,ts):
    if i<50257:
        x=proc.tokenizer.decode([i])
        if x.startswith(' ') or not out: out.append([x.strip(),s0+t])
        else: out[-1][0]+=x
print(' | '.join('%s %.2f'%(a,b) for a,b in out))
