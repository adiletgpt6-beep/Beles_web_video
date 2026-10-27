import sys,json
from faster_whisper import WhisperModel
m=WhisperModel(sys.argv[1],device='cpu',compute_type='int8',cpu_threads=4)
lang=sys.argv[3] if len(sys.argv)>3 and sys.argv[3]!='auto' else None
import wave,numpy as np
w=wave.open(sys.argv[2]);audio=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32768
segs,info=m.transcribe(audio,language=lang,word_timestamps=True,vad_filter=False,beam_size=5,condition_on_previous_text=False)
print('LANG',info.language,info.language_probability,flush=True)
out=[]
for s in segs:
    print('%7.2f %7.2f %s'%(s.start,s.end,s.text),flush=True)
    out.append(dict(start=s.start,end=s.end,text=s.text,avg_logprob=s.avg_logprob,no_speech=s.no_speech_prob,words=[dict(s=w.start,e=w.end,w=w.word,p=w.probability) for w in s.words]))
json.dump(dict(lang=info.language,prob=info.language_probability,all=info.all_language_probs[:8] if info.all_language_probs else None,segments=out),open(sys.argv[4],'w'),ensure_ascii=False,indent=1)
