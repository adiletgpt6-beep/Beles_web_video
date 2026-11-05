# BW-002 — in_progress

Роль: edit. Стиль: Beles V5. WhatsApp: 0998 08 38 28.

Следующий шаг: Закончить ASR (large-v3 черновик + kyrgyz-whisper-medium), составить docs/transcript.md и edit-plan.md в production/jobs/BW-002/, затем edit.json и рендер.

2026-11-05: начат монтаж по указанию пользователя. Исходник input/BW-002/1000219289.mp4 подтверждён (SHA совпал). Идёт локальный ASR на CPU (без платных API), промежуточные медиа в public/media/bw002/ (gitignored). Рабочие файлы задания — production/jobs/BW-002/.

Исходник: `1000219289.mp4`, 70809997 байт.
SHA-256: `09d4a16da764f49602f34e6ad4bc417abe35c6b39384eeb7b61a82d3dcdfc640`. Манифест: `manifest.json`.

Продолжение: `python3 scripts/beles.py status BW-002`, затем `python3 scripts/beles.py restore BW-002` и `python3 scripts/beles.py verify BW-002`.

Точное состояние, заметки, артефакты и история — `checkpoint.json`; проверка доставки — `delivery.json` (если уже выполнена). Публикуйте checkpoint и рабочие материалы в GitHub перед сменой чата.
