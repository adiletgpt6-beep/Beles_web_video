import json,numpy as np,sys
d=[x for x in json.load(open('gaze_all.json')) if 'none' not in x]
T=np.array([x['t'] for x in d])
def g(x,k): return x.get(k,0)
takes=[l.split() for l in """hook1 18.80 21.67
hook2 39.39 42.33
hook3 50.08 52.87
help1 59.63 61.26
help2 64.74 66.30
offer1 100.69 105.52
offer3 117.88 122.21
range1 153.27 159.59
range3 199.81 206.71
range4 243.71 249.51
range5 250.82 257.68
range6 271.86 279.05
dev1 287.50 290.87
dev2 291.54 294.06
level 300.35 303.02
ctaA 315.07 316.76
ctaB 317.77 322.01
ctaC 322.80 324.31
ctaD 327.70 331.47""".splitlines()]
print('take      down   up    h(in/out) v     pitch  yaw   blink  %down>0.35')
for n,s,e in takes:
    s,e=float(s),float(e);sel=[x for x in d if s<=x['t']<=e]
    blink=np.array([(g(x,'eyeBlinkLeft')+g(x,'eyeBlinkRight'))/2 for x in sel])
    ok=[x for x,b in zip(sel,blink) if b<0.5]
    dn=np.array([(g(x,'eyeLookDownLeft')+g(x,'eyeLookDownRight'))/2 for x in ok]);up=np.array([(g(x,'eyeLookUpLeft')+g(x,'eyeLookUpRight'))/2 for x in ok])
    h=np.array([x['h'] for x in ok]);v=np.array([x['v'] for x in ok])
    print(f"{n:8s} {dn.mean():.3f} {up.mean():.3f} {h.mean():.3f}±{h.std():.3f} {v.mean():.3f}±{v.std():.3f} {np.mean([x['pitch'] for x in ok]):6.1f} {np.mean([x['yaw'] for x in ok]):6.1f} {blink.mean():.2f} {np.mean(dn>0.35)*100:5.0f}%")
