import sys,wave,glob,numpy as np,torch
from transformers import WhisperForConditionalGeneration, WhisperProcessor
torch.set_num_threads(4)
P=glob.glob('/root/.cache/huggingface/hub/models--nineninesix--kyrgyz-whisper-medium/snapshots/*')[0]
proc=WhisperProcessor.from_pretrained(P); model=WhisperForConditionalGeneration.from_pretrained(P).eval()
w=wave.open('../src16k.wav');a=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32768
prompt=torch.tensor([[50258,51865,50359,50363]])
for arg in sys.argv[1:]:
    s,e=map(float,arg.split('-'))
    seg=a[max(0,int((s-0.15)*16000)):int((e+0.15)*16000)]
    f=proc(seg,sampling_rate=16000,return_tensors='pt').input_features
    with torch.no_grad(): g=model.generate(f,decoder_input_ids=prompt,max_new_tokens=120,num_beams=4)
    print('%7.2f-%7.2f | %s'%(s,e,proc.tokenizer.decode(g[0],skip_special_tokens=True).strip()),flush=True)
