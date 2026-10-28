import cv2,numpy as np,mediapipe as mp
from mediapipe.tasks import python as mpp
from mediapipe.tasks.python import vision
hl=vision.HandLandmarker.create_from_options(vision.HandLandmarkerOptions(base_options=mpp.BaseOptions(model_asset_path='model/hand_landmarker.task'),num_hands=2))
cap=cv2.VideoCapture('../src_h264.mp4')
for f in range(int(327.9*30),int(329.4*30)):
    cap.set(cv2.CAP_PROP_POS_FRAMES,f);ok,fr=cap.read()
    r=hl.detect(mp.Image(image_format=mp.ImageFormat.SRGB,data=cv2.cvtColor(fr,cv2.COLOR_BGR2RGB)))
    s=[]
    for h in r.hand_landmarks:
        tip=h[8];pip=h[6];mcp=h[5];w=h[0]
        d=np.array([tip.x-mcp.x,(tip.y-mcp.y)*1920/1080]);ang=np.degrees(np.arctan2(d[1],d[0]))
        s.append(f"tip=({tip.x*1080:.0f},{tip.y*1920:.0f}) wrist=({w.x*1080:.0f},{w.y*1920:.0f}) dir={ang:.0f}deg")
    print(f"{f/30:.3f}",' | '.join(s))
