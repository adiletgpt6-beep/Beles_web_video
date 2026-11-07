# BW-004 — staged

Роль: edit. Стиль: Beles V5. WhatsApp: 0998 08 38 28.

Следующий шаг: Получить исходник через Studio broker с идентификатором VID-001 (не BW-004): curl -fsSL https://balago-studio.vercel.app/studio-fetch.mjs -o /tmp/belestudio-fetch.mjs && node /tmp/belestudio-fetch.mjs adiletgpt6-beep/Beles_web_video VID-001 input/BW-004/VID-001.mp4 (SHA-256 скрипта fcee607e…de68), затем ffprobe → manifest.source.probe, verify BW-004 --record-delivery и монтаж по production/studio/VID-001.md

БЛОКЕР 2026-11-07: Issue #1 прочитан из GitHub, BW-004 зарегистрирован через register-studio-issue (VID-001, uploadId bf1c41f8-9df7-4ed2-83ab-9f3145e939e9, 40147656 байт, SHA-256 35e1fd7e…799b). STUDIO_SOURCE_TOKEN в окружении присутствует. Запуск загрузчика (и curl|node, и локальная прочитанная копия) отклонён классификатором разрешений Claude Code в auto mode; исходник НЕ скачан. Монтаж, прослушивание, рендер НЕ выполнялись. Повторно не загружать и не создавать VID/Issue.

Исходник: `VID-001.mp4`, 40147656 байт.
SHA-256: `35e1fd7eaadffbf1203c3ba169ed4bc65c7d99d6fe5e33fa15d05fad8c94799b`. Манифест: `manifest.json`.
Хранилище: приватный Cloudflare R2 через Studio source broker; uploadId `bf1c41f8-9df7-4ed2-83ab-9f3145e939e9`, объект `live/raw/bf1c41f8-9df7-4ed2-83ab-9f3145e939e9/source.mp4`. Git-частей нет.

Продолжение: `python3 scripts/beles.py status BW-004`; исходник получать только командой `curl -fsSL https://balago-studio.vercel.app/studio-fetch.mjs -o /tmp/belestudio-fetch.mjs && node /tmp/belestudio-fetch.mjs adiletgpt6-beep/Beles_web_video VID-001 input/BW-004/VID-001.mp4` (нужен секрет STUDIO_SOURCE_TOKEN, URL и токен не публиковать), затем `python3 scripts/beles.py verify BW-004`.

Точное состояние, заметки, артефакты и история — `checkpoint.json`; проверка доставки — `delivery.json` (если уже выполнена). Публикуйте checkpoint и рабочие материалы в GitHub перед сменой чата.
