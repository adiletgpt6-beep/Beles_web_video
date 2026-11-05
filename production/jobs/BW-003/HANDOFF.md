# BW-003 — in_progress

Роль: edit. Стиль: Beles V5. WhatsApp: 0998 08 38 28.

Следующий шаг: Закончить локальный ASR (faster-whisper large-v3 черновик + kyrgyz-whisper-medium), оценку взгляда MediaPipe, составить docs/transcript.md и VISUAL_CONCEPT.md, затем edit.json и рендер.

2026-11-05: монтаж начат по brief.md (разрешение пользователя). Исходник input/BW-003/1000221272.mp4 проверен (SHA совпал). Установлены npm-зависимости; идёт установка Python ASR/vision (без платных API); готовятся промежуточные медиа public/media/bw003/ (gitignored). Рабочие файлы — production/jobs/BW-003/.

Исходник: `1000221272.mp4`, 17528359 байт.
SHA-256: `88a058563539d8596ce356b8ab92ba0e3336971fe73dc218544482be7715965d`. Манифест: `manifest.json`.
Хранилище: приватный Cloudflare R2 через Studio source broker; uploadId `ced83175-8979-410f-8742-df793118b3de`, объект `live/raw/ced83175-8979-410f-8742-df793118b3de/source.mp4`. Git-частей нет.

Продолжение: `python3 scripts/beles.py status BW-003`; исходник получать только командой `curl -fsSL https://balago-studio.vercel.app/studio-fetch.mjs -o /tmp/belestudio-fetch.mjs && node /tmp/belestudio-fetch.mjs adiletgpt6-beep/Beles_web_video BW-003 input/BW-003/1000221272.mp4` (нужен секрет STUDIO_SOURCE_TOKEN, URL и токен не публиковать), затем `python3 scripts/beles.py verify BW-003`.

Точное состояние, заметки, артефакты и история — `checkpoint.json`; проверка доставки — `delivery.json` (если уже выполнена). Публикуйте checkpoint и рабочие материалы в GitHub перед сменой чата.
