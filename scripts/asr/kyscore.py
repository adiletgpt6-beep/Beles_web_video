import sys,json,wave,glob,numpy as np,torch
from transformers import WhisperForConditionalGeneration, WhisperProcessor
torch.set_num_threads(4)
P=glob.glob('/root/.cache/huggingface/hub/models--nineninesix--kyrgyz-whisper-medium/snapshots/*')[0]
proc=WhisperProcessor.from_pretrained(P); model=WhisperForConditionalGeneration.from_pretrained(P).eval()
tok=proc.tokenizer
w=wave.open('../src16k.wav');a=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32768
tests=json.load(open(sys.argv[1]))
for t in tests:
    s,e=t['range']
    seg=a[max(0,int((s-0.15)*16000)):int((e+0.15)*16000)]
    f=proc(seg,sampling_rate=16000,return_tensors='pt').input_features
    for cand in t['cands']:
        ids=[50258,51865,50359,50363]+tok.encode(' '+cand,add_special_tokens=False)+[50257]
        x=torch.tensor([ids])
        with torch.no_grad(): out=model(input_features=f,decoder_input_ids=x[:,:-1])
        lp=torch.log_softmax(out.logits,-1)[0,3:].gather(1,x[0,4:].unsqueeze(1)).sum().item()
        print(f'{s:7.2f} {lp:8.2f}  {cand}',flush=True)
    print()
