import sys,json,cv2,numpy as np,mediapipe as mp
from mediapipe.tasks import python as mpp
from mediapipe.tasks.python import vision
opts=vision.FaceLandmarkerOptions(base_options=mpp.BaseOptions(model_asset_path=sys.argv[2]),output_face_blendshapes=True,output_facial_transformation_matrixes=True,running_mode=vision.RunningMode.VIDEO,num_faces=1)
lm=vision.FaceLandmarker.create_from_options(opts)
cap=cv2.VideoCapture(sys.argv[1]);step=int(sys.argv[4]) if len(sys.argv)>4 else 2
out=[];i=0
KEYS=['eyeLookDownLeft','eyeLookDownRight','eyeLookUpLeft','eyeLookUpRight','eyeLookInLeft','eyeLookInRight','eyeLookOutLeft','eyeLookOutRight','eyeBlinkLeft','eyeBlinkRight','jawOpen']
while True:
    ok,fr=cap.read()
    if not ok: break
    if i%step==0:
        small=cv2.resize(fr[300:1300,140:940],(560,700))  # face region, keeps detail
        img=mp.Image(image_format=mp.ImageFormat.SRGB,data=cv2.cvtColor(small,cv2.COLOR_BGR2RGB))
        r=lm.detect_for_video(img,int(i*1000/30))
        if r.face_landmarks:
            b={c.category_name:round(c.score,3) for c in r.face_blendshapes[0] if c.category_name in KEYS}
            L=r.face_landmarks[0]
            def ratio(iris,a,b_,top,bot):
                p=np.array([L[iris].x,L[iris].y]);A=np.array([L[a].x,L[a].y]);B=np.array([L[b_].x,L[b_].y])
                h=np.dot(p-A,B-A)/np.dot(B-A,B-A)
                v=(L[iris].y-L[top].y)/max(1e-6,(L[bot].y-L[top].y))
                return h,v
            # right eye (subject's): corners 33 outer,133 inner, top 159 bottom 145, iris 468
            h1,v1=ratio(468,33,133,159,145); h2,v2=ratio(473,362,263,386,374)
            M=np.array(r.facial_transformation_matrixes[0])
            yaw=float(np.degrees(np.arctan2(M[0,2],M[2,2]))); pitch=float(np.degrees(np.arcsin(-M[1,2])))
            out.append(dict(f=i,t=round(i/30,3),h=round((h1+h2)/2,3),v=round((v1+v2)/2,3),yaw=round(yaw,1),pitch=round(pitch,1),**b))
        else: out.append(dict(f=i,t=round(i/30,3),none=1))
    i+=1
json.dump(out,open(sys.argv[3],'w'))
print('frames',i,'samples',len(out))
