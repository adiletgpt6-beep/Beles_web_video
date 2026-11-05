# BW-003: hand landmarks every 3rd frame (index fingertip, wrist, direction) to find pointing / open-hand gestures
import sys, json, cv2, numpy as np, mediapipe as mp
from mediapipe.tasks import python as mpp
from mediapipe.tasks.python import vision
hl = vision.HandLandmarker.create_from_options(vision.HandLandmarkerOptions(base_options=mpp.BaseOptions(model_asset_path=sys.argv[2]), num_hands=2))
cap = cv2.VideoCapture(sys.argv[1]); step = int(sys.argv[4]) if len(sys.argv) > 4 else 3
out = []; i = 0
while True:
    ok, fr = cap.read()
    if not ok: break
    if i % step == 0:
        r = hl.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(fr, cv2.COLOR_BGR2RGB)))
        hands = []
        for h in r.hand_landmarks:
            tip = h[8]; mcp = h[5]; w = h[0]
            d = np.array([tip.x - mcp.x, (tip.y - mcp.y) * 1920 / 1080]); ang = float(np.degrees(np.arctan2(d[1], d[0])))
            ext = float(np.hypot(*d))
            hands.append(dict(tip=[round(tip.x * 1080), round(tip.y * 1920)], wrist=[round(w.x * 1080), round(w.y * 1920)], dir=round(ang), ext=round(ext, 3)))
        out.append(dict(f=i, t=round(i / 30, 3), hands=hands))
    i += 1
json.dump(out, open(sys.argv[3], 'w'))
print('frames', i, 'samples', len(out))
