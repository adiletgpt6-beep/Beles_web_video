import sys,cv2,numpy as np,mediapipe as mp
from mediapipe.tasks import python as mpp
from mediapipe.tasks.python import vision
lm=vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(base_options=mpp.BaseOptions(model_asset_path='model/face_landmarker.task'),num_faces=1))
cap=cv2.VideoCapture('../src_h264.mp4')
out=sys.argv[1];rows=[]
for r in sys.argv[2:]:
    s,e=map(float,r.split('-'));tiles=[]
    t=s
    while t<=e and len(tiles)<14:
        cap.set(cv2.CAP_PROP_POS_FRAMES,int(round(t*30)));ok,fr=cap.read()
        sub=fr[300:1300,140:940];res=lm.detect(mp.Image(image_format=mp.ImageFormat.SRGB,data=cv2.cvtColor(np.ascontiguousarray(sub),cv2.COLOR_BGR2RGB)))
        if res.face_landmarks:
            L=res.face_landmarks[0];xs=[140+L[i].x*800 for i in (33,133,362,263)];ys=[300+L[i].y*1000 for i in (159,145,386,374)]
            cx,cy=np.mean(xs),np.mean(ys);w=(max(xs)-min(xs))*1.6;h=w*0.55
            c=fr[int(cy-h/2):int(cy+h/2),int(cx-w/2):int(cx+w/2)]
            c=cv2.resize(c,(320,176),interpolation=cv2.INTER_CUBIC)
        else: c=np.zeros((176,320,3),np.uint8)
        cv2.putText(c,'%.2f'%t,(3,14),cv2.FONT_HERSHEY_SIMPLEX,0.45,(0,255,255),1)
        tiles.append(c);t+=max(0.2,(e-s)/13)
    while len(tiles)<14: tiles.append(np.full((176,320,3),255,np.uint8))
    P=[np.pad(x,((2,2),(2,2),(0,0)),constant_values=255) for x in tiles]
    rows.append(np.hstack(P[:7]));rows.append(np.hstack(P[7:14]));rows.append(np.full((10,P[0].shape[1]*7,3),(0,0,200),np.uint8))
cv2.imwrite(out,np.vstack(rows))
