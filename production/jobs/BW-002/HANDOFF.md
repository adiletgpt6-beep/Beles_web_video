# BW-002 — rendered

Роль: edit. Стиль: Beles V5. WhatsApp: 0998 08 38 28.

Следующий шаг: Получить отзыв пользователя на v2 (production/jobs/BW-002/release/beles-bw002-v2-1080x1920.mp4); правки → edit.json / src/demos.tsx → повторный рендер.

2026-11-05: v2 — полная переработка графики (поисковый хук, телефон с реальным zeket.kg, демо-магазин и демо-автоматизация с меткой ДЕМО, окно десктопа, лампочка, WhatsApp с кнопкой), речь/дубли/склейки как в v1. Проверено: verify.sh, −14,9 LUFS/−1,9 dBTP, покадровый просмотр каждого 6-го кадра, надписи сверены. Не прослушано ушами.

Исходник: `1000219289.mp4`, 70809997 байт.
SHA-256: `09d4a16da764f49602f34e6ad4bc417abe35c6b39384eeb7b61a82d3dcdfc640`. Манифест: `manifest.json`.

Продолжение: `python3 scripts/beles.py status BW-002`, затем `python3 scripts/beles.py restore BW-002` и `python3 scripts/beles.py verify BW-002`.

Точное состояние, заметки, артефакты и история — `checkpoint.json`; проверка доставки — `delivery.json` (если уже выполнена). Публикуйте checkpoint и рабочие материалы в GitHub перед сменой чата.
