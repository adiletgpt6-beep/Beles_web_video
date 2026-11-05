# BW-003 — staged

Роль: edit. Стиль: Beles V5. WhatsApp: 0998 08 38 28.

Следующий шаг: 1) В Studio добавить запись allowlist брокера для BW-003 по production/jobs/BW-003/studio/BW-003-broker-allowlist.md и задеплоить production; 2) в среде Claude Code с STUDIO_SOURCE_TOKEN выполнить команду загрузки из HANDOFF.md задания, затем python3 scripts/beles.py verify BW-003, записать source.probe в manifest, закоммитить и выполнить verify BW-003 --record-delivery (staged → queued). Монтаж не начинать до queued и короткого промпта пользователя.

2026-11-05: BW-003 зарегистрирован один раз через beles.py register-r2 (без Git-частей, без повторной загрузки): 1000221272.mp4, 17528359 байт, SHA-256 88a05856…965d, uploadId ced83175-8979-410f-8742-df793118b3de, R2 байты проверены владельцем в Studio. Блокер доставки: брокер Studio отвечает 404 для BW-003 (BW-002 — 200, без токена — 401), allowlist содержит только BW-002; репозиторий Studio из этой сессии недоступен, изменение описано в studio/BW-003-broker-allowlist.md; запуск загрузчика с токеном в этой сессии отклонён классификатором разрешений. Исходник не скачан, доставка не подтверждена, монтаж/платные сервисы/VID/Issue не запускались.

Исходник: `1000221272.mp4`, 17528359 байт.
SHA-256: `88a058563539d8596ce356b8ab92ba0e3336971fe73dc218544482be7715965d`. Манифест: `manifest.json`.
Хранилище: приватный Cloudflare R2 через Studio source broker; uploadId `ced83175-8979-410f-8742-df793118b3de`, объект `live/raw/ced83175-8979-410f-8742-df793118b3de/source.mp4`. Git-частей нет.

Продолжение: `python3 scripts/beles.py status BW-003`; исходник получать только командой `curl -fsSL https://balago-studio.vercel.app/studio-fetch.mjs -o /tmp/belestudio-fetch.mjs && node /tmp/belestudio-fetch.mjs adiletgpt6-beep/Beles_web_video BW-003 input/BW-003/1000221272.mp4` (нужен секрет STUDIO_SOURCE_TOKEN, URL и токен не публиковать), затем `python3 scripts/beles.py verify BW-003`.

Точное состояние, заметки, артефакты и история — `checkpoint.json`; проверка доставки — `delivery.json` (если уже выполнена). Публикуйте checkpoint и рабочие материалы в GitHub перед сменой чата.
