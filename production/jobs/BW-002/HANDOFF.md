# BW-002 — rendered

Роль: edit. Стиль: Beles V5. WhatsApp: 0998 08 38 28.

Следующий шаг: Получить отзыв пользователя на v3 (production/jobs/BW-002/release/beles-bw002-v3-1080x1920.mp4); правки → edit.json / src/demos.tsx → повторный рендер.

2026-11-05: v3 — финальная полировка (мягкий вход, крупнее демо, субтитры/safe zones, анимация WhatsApp, тексты перепроверены, zeket.kg помечен как внешний пример). verify.sh: 1067 кадров, −14,9 LUFS/−1,9 dBTP; покадровый просмотр выполнен. Не прослушано ушами.

Исходник: `1000219289.mp4`, 70809997 байт.
SHA-256: `09d4a16da764f49602f34e6ad4bc417abe35c6b39384eeb7b61a82d3dcdfc640`. Манифест: `manifest.json`.

Продолжение: `python3 scripts/beles.py status BW-002`, затем `python3 scripts/beles.py restore BW-002` и `python3 scripts/beles.py verify BW-002`.

Точное состояние, заметки, артефакты и история — `checkpoint.json`; проверка доставки — `delivery.json` (если уже выполнена). Публикуйте checkpoint и рабочие материалы в GitHub перед сменой чата.
