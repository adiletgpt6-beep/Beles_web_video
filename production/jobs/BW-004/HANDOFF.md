# BW-004 — rendered

Роль: edit. Стиль: Beles V5. WhatsApp: 0998 08 38 28.

Следующий шаг: Показать пользователю v2 production/jobs/BW-004/release/beles-bw004-v2-1080x1920.mp4; получить правки или утверждение: checkpoint BW-004 --status approved --user-approved. Выдача через R2/Studio (DELIVERY_RULES) требует endpoints в Studio.

2026-11-08: v2 — убран повтор «сайт, сайт» (ложный старт 74,48–74,86 в хуке), дубли пересобраны по правилу «последний удачный, иначе предыдущий» (docs/repeats-audit.md); 32,60 с, 978 кадров, −14,9 LUFS / −1,9 dBTP, SHA-256 d3309447…4c8e50; A/B 0 нарушений; ASR итогового MP4 без повторов. v1 сохранён. Не выполнено: прослушивание ушами, просмотр на телефоне, утверждение.

Исходник: `VID-001.mp4`, 40147656 байт.
SHA-256: `35e1fd7eaadffbf1203c3ba169ed4bc65c7d99d6fe5e33fa15d05fad8c94799b`. Манифест: `manifest.json`.
Хранилище: приватный Cloudflare R2 через Studio source broker; uploadId `bf1c41f8-9df7-4ed2-83ab-9f3145e939e9`, объект `live/raw/bf1c41f8-9df7-4ed2-83ab-9f3145e939e9/source.mp4`. Git-частей нет.

Продолжение: `python3 scripts/beles.py status BW-004`; исходник получать только командой `curl -fsSL https://balago-studio.vercel.app/studio-fetch.mjs -o /tmp/belestudio-fetch.mjs && node /tmp/belestudio-fetch.mjs adiletgpt6-beep/Beles_web_video VID-001 input/BW-004/VID-001.mp4` (нужен секрет STUDIO_SOURCE_TOKEN, URL и токен не публиковать), затем `python3 scripts/beles.py verify BW-004`.

Точное состояние, заметки, артефакты и история — `checkpoint.json`; проверка доставки — `delivery.json` (если уже выполнена). Публикуйте checkpoint и рабочие материалы в GitHub перед сменой чата.
