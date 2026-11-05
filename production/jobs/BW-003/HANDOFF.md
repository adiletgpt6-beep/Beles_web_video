# BW-003 — rendered

Роль: edit. Стиль: Beles V5. WhatsApp: 0998 08 38 28.

Следующий шаг: Показать пользователю production/jobs/BW-003/release/beles-bw003-v1-1080x1920.mp4 (ссылка в ветке ccr-443bddaf-7eho4h); получить правки (edit.json / src/night.tsx → повторный рендер ~20 мин) или утверждение: checkpoint BW-003 --status approved --user-approved.

2026-11-05: v1 смонтирован и проверен — концепция «Түнкү смена» (часы 02:00, переписка без ответа, чек заказа, дуга день-ночь, wireframe-панели услуг, телефон на тумбочке, чат-CTA WhatsApp). 32,33 с, 970 кадров, 8 дублей, −14,9 LUFS / −2,2 dBTP, SHA-256 57153074…5afc. verify.sh без ошибок, покадровый просмотр 28 кадров. Не выполнено: прослушивание ушами, просмотр на телефоне. Платные сервисы не использовались.

Исходник: `1000221272.mp4`, 17528359 байт.
SHA-256: `88a058563539d8596ce356b8ab92ba0e3336971fe73dc218544482be7715965d`. Манифест: `manifest.json`.
Хранилище: приватный Cloudflare R2 через Studio source broker; uploadId `ced83175-8979-410f-8742-df793118b3de`, объект `live/raw/ced83175-8979-410f-8742-df793118b3de/source.mp4`. Git-частей нет.

Продолжение: `python3 scripts/beles.py status BW-003`; исходник получать только командой `curl -fsSL https://balago-studio.vercel.app/studio-fetch.mjs -o /tmp/belestudio-fetch.mjs && node /tmp/belestudio-fetch.mjs adiletgpt6-beep/Beles_web_video BW-003 input/BW-003/1000221272.mp4` (нужен секрет STUDIO_SOURCE_TOKEN, URL и токен не публиковать), затем `python3 scripts/beles.py verify BW-003`.

Точное состояние, заметки, артефакты и история — `checkpoint.json`; проверка доставки — `delivery.json` (если уже выполнена). Публикуйте checkpoint и рабочие материалы в GitHub перед сменой чата.
