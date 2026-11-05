# Beles: начать здесь

Источник истины — актуальная основная ветка этого репозитория. Прошлые чаты не заменяют файлы и сохранённый checkpoint.

1. Прочитайте `production/STATE.json`, `production/STYLE_GUIDE.md`, `production/EDITING_LESSONS.md` и `production/HANDOFF.md`. Для демонстрации сайтов также прочитайте `production/WEBSITE_SHOWCASE_RULES.md`. Перед каждым рекламным монтажом применяйте обязательный QA-чеклист из EDITING_LESSONS.
2. Выполните `python3 scripts/beles.py queue` и `python3 scripts/beles.py next`. Для существующего активного ID прочитайте его manifest, brief, HANDOFF и checkpoint.
3. Новый исходник принимайте по `production/INGEST.md`; сообщения для ChatGPT/Claude — `production/PROMPTS.md`.
4. Перед сменой чата сохраните рабочие файлы и следующий конкретный шаг задания в GitHub. `sync` восстанавливает производные registry/HANDOFF из manifest + checkpoint.

Основная ветка на 2026-10-29: `ccr-443bddaf-7eho4h`. Ветки main нет. Перед записью проверяйте текущие default branch и head; не затирайте параллельные изменения.

**BW-001 — утверждённый эталон V5; его не переделывать.** [Готовый ролик](https://github.com/adiletgpt6-beep/Beles_web_video/releases/download/v5.0.0/beles-web-v5-1080x1920.mp4). Сохраняйте темп, бело-голубые субтитры без общей подложки и WhatsApp 0998 08 38 28.

Оригинал BW-001 опубликован четырьмя бинарными частями, независимо восстановлен и проверен. Для него: `python3 scripts/beles.py restore BW-001`, затем `python3 scripts/beles.py verify BW-001`. Повторное вложение пользователя не требуется.

Реализованы регистрация с защитой от дубликатов, очередь, восстановление и checkpoint задания. Текущая готовность и реальные ограничения — STATE и `production/reports/VERIFICATION.md`. Транспорт Git-parts: исходники до 100 MiB. **BW-002: Git-parts загружен только 1/12, но полный оригинал уже в приватном R2 и его SHA-256 независимо проверен по байтам (70 809 997 байт).** Ссылка на объект, uploadId и хеш записаны в `production/jobs/BW-002/manifest.json`. Для этого существующего ID Studio source broker опубликован в production (Studio main `5142c030`). Для Claude Code, у которого уже настроен секрет `STUDIO_SOURCE_TOKEN`, получать исходник так, не раскрывая токен и подписанный URL:

```bash
mkdir -p input/BW-002
curl -fsSL https://balago-studio.vercel.app/studio-fetch.mjs -o /tmp/belestudio-fetch.mjs
node /tmp/belestudio-fetch.mjs adiletgpt6-beep/Beles_web_video BW-002 input/BW-002/1000219289.mp4
sha256sum input/BW-002/1000219289.mp4
```

Ожидаемый SHA-256: `09d4a16da764f49602f34e6ad4bc417abe35c6b39384eeb7b61a82d3dcdfc640`. Загрузчик сам проверяет размер и SHA. **2026-11-05: Claude Code в чистой облачной среде выполнил эту команду, SHA-256, размер и ffprobe совпали с manifest** — доказательство `production/jobs/BW-002/delivery.json`, отчёт `production/reports/BW-002-r2-delivery.json`; BW-002 переведён в queued. Для BW-002 `restore`/`verify` через Git-parts не работают (загружена 1/12, дозагрузка не нужна) — восстанавливать только командой выше. Если секрет отсутствует — сохранить блокер, не просить повторную загрузку и не создавать VID/Issue. **BW-002 v4 (финал) смонтирован 2026-11-05** (`production/jobs/BW-002/release/beles-bw002-v4-1080x1920.mp4`, проверка `production/jobs/BW-002/docs/verification.md`; v1–v3 рядом), ждёт отзыва пользователя; правки вносить в `production/jobs/BW-002/data/edit.json` и рендерить через `ENTRY=production/jobs/BW-002/src/index.ts COMP=BelesReelBW002` (см. HANDOFF).

Отвечайте пользователю по-русски. Не запускайте платные API или runners автоматически. Проверка источника не означает, что новый ролик смонтирован/прослушан.
