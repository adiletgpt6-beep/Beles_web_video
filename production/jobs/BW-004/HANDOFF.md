# BW-004 — in_progress

Роль: edit. Стиль: Beles V5. WhatsApp: 0998 08 38 28.

Следующий шаг: Дождаться рендера out/beles-bw004-v1-1080x1920.mp4 (render.sh, ENTRY=production/jobs/BW-004/src/index.ts COMP=BelesReelBW004), затем scripts/verify.sh + qa/ab_audit.py, покадровый просмотр, публикация MP4 в production/jobs/BW-004/release/

2026-11-07: исходник скачан брокером (VID-001) и проверен; расшифровка (faster-whisper large-v3 + kyrgyz-whisper-medium + kyscore), выбор 6 дублей по взгляду; концепция «Үч ката» (docs/VISUAL_CONCEPT.md), A/B-композиция src/paper.tsx, edit.json → timeline/EDL/SRT/audio 33,30 с; рендер v1 запущен. Прослушивание человеком не выполнялось.

Исходник: `VID-001.mp4`, 40147656 байт.
SHA-256: `35e1fd7eaadffbf1203c3ba169ed4bc65c7d99d6fe5e33fa15d05fad8c94799b`. Манифест: `manifest.json`.
Хранилище: приватный Cloudflare R2 через Studio source broker; uploadId `bf1c41f8-9df7-4ed2-83ab-9f3145e939e9`, объект `live/raw/bf1c41f8-9df7-4ed2-83ab-9f3145e939e9/source.mp4`. Git-частей нет.

Продолжение: `python3 scripts/beles.py status BW-004`; исходник получать только командой `curl -fsSL https://balago-studio.vercel.app/studio-fetch.mjs -o /tmp/belestudio-fetch.mjs && node /tmp/belestudio-fetch.mjs adiletgpt6-beep/Beles_web_video VID-001 input/BW-004/VID-001.mp4` (нужен секрет STUDIO_SOURCE_TOKEN, URL и токен не публиковать), затем `python3 scripts/beles.py verify BW-004`.

Точное состояние, заметки, артефакты и история — `checkpoint.json`; проверка доставки — `delivery.json` (если уже выполнена). Публикуйте checkpoint и рабочие материалы в GitHub перед сменой чата.
