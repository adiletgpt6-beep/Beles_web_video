# Оценка взгляда и жеста (V2)

Запуск из рабочей папки, где лежат `model/face_landmarker.task`, `model/hand_landmarker.task`
(https://storage.googleapis.com/mediapipe-models/...) и `../src_h264.mp4` (несжатый по цвету H.264 исходника):

- `gaze.py <video> model/face_landmarker.task out.json 2` — радужка/blendshapes на каждом 2-м кадре
- `stats.py` — сводка по дублям (взгляд вниз, моргания, поза головы)
- `crops.py out.png 18.80-21.67 39.39-42.33 …` — кропы глаз по ориентирам лица для визуальной проверки
- `hand.py` — кончик указательного пальца и направление жеста в финальном призыве

Зависимости: `pip install mediapipe opencv-python-headless`, системная `libegl1`.
