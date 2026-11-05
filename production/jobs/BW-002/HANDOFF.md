# BW-002 — queued

Роль: edit. Стиль: Beles V5. WhatsApp: 0998 08 38 28.

Следующий шаг: Исходник BW-002 получать только командой Studio broker из START_HERE.md (Git-parts 1/12 не использовать); затем расшифровать кыргызскую речь и выбрать дубли. Монтаж и платные сервисы — только по отдельному указанию пользователя.

2026-11-05: Claude Code в чистой облачной среде скачал оригинал через Studio source broker (STUDIO_SOURCE_TOKEN из окружения, подписанный URL не раскрыт): 70809997 байт, SHA-256 09d4a16d…fc640 совпал с manifest, ffprobe (1080x1920, 30 fps, h264/aac, 308.71 с) совпал. Отчёт production/reports/BW-002-r2-delivery.json, delivery.json записан. Новый ID не создавался, видео повторно не загружалось, монтаж не запускался.

Исходник: `1000219289.mp4`, 70809997 байт.
SHA-256: `09d4a16da764f49602f34e6ad4bc417abe35c6b39384eeb7b61a82d3dcdfc640`. Манифест: `manifest.json`.

Продолжение: `python3 scripts/beles.py status BW-002`, затем `python3 scripts/beles.py restore BW-002` и `python3 scripts/beles.py verify BW-002`.

Точное состояние, заметки, артефакты и история — `checkpoint.json`; проверка доставки — `delivery.json` (если уже выполнена). Публикуйте checkpoint и рабочие материалы в GitHub перед сменой чата.
