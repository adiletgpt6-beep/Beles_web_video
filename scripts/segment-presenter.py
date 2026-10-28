"""Presenter matte for the 'text behind the presenter' shot (MediaPipe selfie_multiclass, Apache-2.0 model file).

Writes RGBA cut-outs (presenter colour × refined matte) of frames [start, end) of public/media/source.mp4
to public/media/matte/<frame>.png, on the same pixel grid as the source video.
Refinement: guided filter guided by the full-resolution frame (sharp hair/shoulder edges),
light temporal smoothing, then a soft contrast curve on the alpha.

Usage: python3 scripts/segment-presenter.py <model.tflite> 1178 1275
"""
import os
import sys

import cv2
import mediapipe as mp
import numpy as np
from mediapipe.tasks import python as mpp
from mediapipe.tasks.python import vision
from PIL import Image

root = os.path.join(os.path.dirname(__file__), '..')
model, start, end = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
out = os.path.join(root, 'public/media/matte')
os.makedirs(out, exist_ok=True)
seg = vision.ImageSegmenter.create_from_options(
    vision.ImageSegmenterOptions(base_options=mpp.BaseOptions(model_asset_path=model), output_confidence_masks=True, running_mode=vision.RunningMode.VIDEO)
)
X0, Y0, X1, Y1 = 60, 260, 1020, 1700  # region that contains the presenter
cap = cv2.VideoCapture(os.path.join(root, 'public/media/source.mp4'))
cap.set(cv2.CAP_PROP_POS_FRAMES, start)
prev = None
for f in range(start, end):
    ok, bgr = cap.read()
    if not ok:
        break
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    crop = np.ascontiguousarray(rgb[Y0:Y1, X0:X1])
    r = seg.segment_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=crop), int(f * 1000 / 30))
    bg = r.confidence_masks[0].numpy_view()
    person = 1.0 - cv2.resize(bg, (X1 - X0, Y1 - Y0), interpolation=cv2.INTER_LINEAR)
    guide = crop.astype(np.float32) / 255
    a = cv2.ximgproc.guidedFilter(guide, person.astype(np.float32), 10, 1e-3)
    a = cv2.ximgproc.guidedFilter(guide, a, 4, 2e-4)
    if prev is not None:
        a = 0.7 * a + 0.3 * prev  # temporal smoothing against edge flicker
    prev = a
    a = np.clip((a - 0.35) / 0.3, 0, 1)  # soft contrast curve: solid inside, short soft edge
    alpha = np.zeros((1920, 1080), np.float32)
    alpha[Y0:Y1, X0:X1] = a
    alpha[Y1:, X0:X1] = alpha[Y1 - 1 : Y1, X0:X1]
    a8 = (alpha * 255).astype(np.uint8)
    Image.fromarray(np.dstack([rgb, a8])).save(f'{out}/{f}.png', compress_level=2)
print('matte frames', start, end)
