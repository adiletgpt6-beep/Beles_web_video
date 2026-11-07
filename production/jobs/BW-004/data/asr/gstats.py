import json,numpy as np,sys
d=[x for x in json.load(open('gaze_all.json')) if 'none' not in x]
g=lambda x,k:x.get(k,0)
print('take          down  h     v     pitch yaw  blinks  %down>0.35  noface')
allx=json.load(open('gaze_all.json'))
for a in sys.argv[1:]:
    s,e=map(float,a.split('-'));sel=[x for x in d if s<=x['t']<=e]
    nf=sum(1 for x in allx if s<=x['t']<=e and 'none' in x)
    bl=np.array([(g(x,'eyeBlinkLeft')+g(x,'eyeBlinkRight'))/2 for x in sel]);ok=[x for x,b in zip(sel,bl) if b<0.5]
    dn=np.array([(g(x,'eyeLookDownLeft')+g(x,'eyeLookDownRight'))/2 for x in ok])
    print('%-13s %.2f  %.2f  %.2f  %5.1f %5.1f %3d     %4.0f%%     %d'%(a,dn.mean(),np.mean([x['h'] for x in ok]),np.mean([x['v'] for x in ok]),np.mean([x['pitch'] for x in ok]),np.mean([x['yaw'] for x in ok]),int((np.diff((bl>0.5).astype(int))==1).sum()),100*(dn>0.35).mean(),nf))
