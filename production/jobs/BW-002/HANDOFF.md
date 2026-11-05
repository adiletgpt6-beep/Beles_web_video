# BW-002 — rendered

Роль: edit. Стиль: Beles V5. WhatsApp: 0998 08 38 28.

Следующий шаг: Утверждение пользователем v4 (production/jobs/BW-002/release/beles-bw002-v4-1080x1920.mp4): checkpoint BW-002 --status approved --user-approved; иначе — правки по замечаниям.

2026-11-05: v4 — финальная доработка (карточка-смартфон в начале, прокрутка каталога и корзина в демо-магазине, субтитры подняты, наезд, мягкие переходы, номер по цифрам). Реальные магазины KG/RU из среды недоступны — макет ДЕМО по правилу 4. verify.sh: 1067 кадров, −14,9 LUFS/−1,9 dBTP; покадровый просмотр выполнен. Не прослушано ушами.

Исходник: `1000219289.mp4`, 70809997 байт.
SHA-256: `09d4a16da764f49602f34e6ad4bc417abe35c6b39384eeb7b61a82d3dcdfc640`. Манифест: `manifest.json`.

Продолжение: `python3 scripts/beles.py status BW-002`, затем `python3 scripts/beles.py restore BW-002` и `python3 scripts/beles.py verify BW-002`.

Точное состояние, заметки, артефакты и история — `checkpoint.json`; проверка доставки — `delivery.json` (если уже выполнена). Публикуйте checkpoint и рабочие материалы в GitHub перед сменой чата.
