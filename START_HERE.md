# Beles: начать здесь

Источник истины — актуальная основная ветка этого репозитория. Прошлые чаты не заменяют файлы и сохранённый checkpoint.

1. Прочитайте `production/STATE.json`, `production/STYLE_GUIDE.md` и `production/HANDOFF.md`.
2. Выполните `python3 scripts/beles.py queue` и `python3 scripts/beles.py next`. Для существующего активного ID прочитайте его manifest, brief, HANDOFF и checkpoint.
3. Новый исходник принимайте по `production/INGEST.md`; сообщения для ChatGPT/Claude — `production/PROMPTS.md`.
4. Перед сменой чата сохраните рабочие файлы и следующий конкретный шаг задания в GitHub. `sync` восстанавливает производные registry/HANDOFF из manifest + checkpoint.

Основная ветка на 2026-10-29: `ccr-443bddaf-7eho4h`. Ветки main нет. Перед записью проверяйте текущие default branch и head; не затирайте параллельные изменения.

**BW-001 — утверждённый эталон V5; его не переделывать.** [Готовый ролик](https://github.com/adiletgpt6-beep/Beles_web_video/releases/download/v5.0.0/beles-web-v5-1080x1920.mp4). Сохраняйте темп, бело-голубые субтитры без общей подложки и WhatsApp 0998 08 38 28.

Оригинал BW-001 опубликован четырьмя бинарными частями, независимо восстановлен и проверен. Для него: `python3 scripts/beles.py restore BW-001`, затем `python3 scripts/beles.py verify BW-001`. Повторное вложение пользователя не требуется.

Реализованы регистрация с защитой от дубликатов, очередь, восстановление и checkpoint задания. Текущая готовность и реальные ограничения — STATE и `production/reports/VERIFICATION.md`. Транспорт Git-parts: исходники до 100 MiB. Новый BW-002 зарегистрирован, но загрузка пока частичная: см. общий HANDOFF и checkpoint задания. Промпт Claude выдавать после завершения доставки и независимой проверки.

Отвечайте пользователю по-русски. Не запускайте платные API или runners автоматически. Проверка источника не означает, что новый ролик смонтирован/прослушан.
