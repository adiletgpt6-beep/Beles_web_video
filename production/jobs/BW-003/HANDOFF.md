# BW-003 — queued

Роль: edit. Стиль: Beles V5. WhatsApp: 0998 08 38 28.

Следующий шаг: Ждать короткий промпт пользователя на монтаж BW-003. Затем: исходник уже в input/BW-003/1000221272.mp4 (в новой среде — команда брокера из HANDOFF задания + verify BW-003); прочитать brief.md, STYLE_GUIDE.md, EDITING_LESSONS.md, WEBSITE_SHOWCASE_RULES.md; расшифровать кыргызскую речь (локальный ASR), выбрать дубли, записать уникальную визуальную концепцию в production/jobs/BW-003/docs/ перед монтажом. Эталон V5 и файлы BW-002 не менять; платные API/Actions не запускать.

2026-11-05: Claude Code скачал исходник через Studio source broker (BW-003 resolve → 200 после Studio PR #175 / 17bc2dc; токен и подписанный URL не раскрывались): 17528359 байт, SHA-256 88a05856…965d совпали с manifest и проверкой владельца по байтам R2; ffprobe 1080×1920, 30/1, av1 + aac 44100 Hz stereo, 216.735 с записан в source.probe (коммит 4d934fe). verify --record-delivery: delivery.json записан, staged → queued. Отчёт production/reports/BW-003-r2-delivery.json. MP4 в Git не публикуется. Монтаж, прослушивание, рендер, платные сервисы, VID/Issue и повторная загрузка не выполнялись.

Исходник: `1000221272.mp4`, 17528359 байт.
SHA-256: `88a058563539d8596ce356b8ab92ba0e3336971fe73dc218544482be7715965d`. Манифест: `manifest.json`.
Хранилище: приватный Cloudflare R2 через Studio source broker; uploadId `ced83175-8979-410f-8742-df793118b3de`, объект `live/raw/ced83175-8979-410f-8742-df793118b3de/source.mp4`. Git-частей нет.

Продолжение: `python3 scripts/beles.py status BW-003`; исходник получать только командой `curl -fsSL https://balago-studio.vercel.app/studio-fetch.mjs -o /tmp/belestudio-fetch.mjs && node /tmp/belestudio-fetch.mjs adiletgpt6-beep/Beles_web_video BW-003 input/BW-003/1000221272.mp4` (нужен секрет STUDIO_SOURCE_TOKEN, URL и токен не публиковать), затем `python3 scripts/beles.py verify BW-003`.

Точное состояние, заметки, артефакты и история — `checkpoint.json`; проверка доставки — `delivery.json` (если уже выполнена). Публикуйте checkpoint и рабочие материалы в GitHub перед сменой чата.
