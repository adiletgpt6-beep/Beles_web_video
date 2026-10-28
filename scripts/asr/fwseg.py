import json,wave,numpy as np,sys
from faster_whisper import WhisperModel
m=WhisperModel('large-v3',device='cpu',compute_type='int8',cpu_threads=4)
w=wave.open('../src16k.wav');a=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32768
edit=json.load(open('/home/user/Beles_web_video/data/edit.json'))
out={}
for s in edit['segments']:
    s0=s['in']-0.3;s1=s['out']+0.2
    segs,_=m.transcribe(a[int(s0*16000):int(s1*16000)],language='kk',word_timestamps=True,beam_size=5,condition_on_previous_text=False,vad_filter=False)
    ws=[dict(w=x.word.strip(),s=round(s0+x.start,3),e=round(s0+x.end,3),p=round(x.probability,2)) for sg in segs for x in sg.words]
    out[s['id']]=ws
    print(s['id'],len(s['text'].split()),'words; fw',len(ws));print('   ',' | '.join('%s %.2f-%.2f'%(x['w'],x['s'],x['e']) for x in ws),flush=True)
json.dump(out,open('fw_words_v2.json','w'),ensure_ascii=False,indent=1)
