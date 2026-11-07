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

**BW-003 (2026-11-05): исходник `1000221272.mp4` (17 528 359 байт, SHA-256 `88a058563539d8596ce356b8ab92ba0e3336971fe73dc218544482be7715965d`, AV1+AAC, 1080×1920, 30 fps, 216,7 с) зарегистрирован через `register-r2` без Git-частей и доставлен: Claude Code скачал его через Studio broker (Studio PR #175) и проверил — `production/jobs/BW-003/delivery.json`, отчёт `production/reports/BW-003-r2-delivery.json`; статус `queued`, `next` → BW-003.** Повторно не регистрировать и не загружать. В новой среде исходник получать только командой брокера: как для BW-002, но `BW-003 input/BW-003/1000221272.mp4`, затем `python3 scripts/beles.py verify BW-003`. `restore BW-003` ничего не скачивает. **BW-003 v1 смонтирован 2026-11-05** (`production/jobs/BW-003/release/beles-bw003-v1-1080x1920.mp4`, концепция «Түнкү смена», проверка `production/jobs/BW-003/docs/verification.md`), ждёт отзыва пользователя; правки — `production/jobs/BW-003/data/edit.json` / `src/night.tsx`, рендер `ENTRY=production/jobs/BW-003/src/index.ts COMP=BelesReelBW003` (см. edit-plan.md).

**BW-004 = Studio VID-001 (2026-11-07):** зарегистрирован из GitHub Issue #1, исходник получен брокером с идентификатором `VID-001` (`node studio-fetch.mjs adiletgpt6-beep/Beles_web_video VID-001 input/BW-004/VID-001.mp4`) и проверен (`delivery.json`). **v2 (2026-11-08) — текущая версия**: повтор «сайт, сайт» убран, дубли по правилу «последний удачный» (`docs/repeats-audit.md`): `production/jobs/BW-004/release/beles-bw004-v2-1080x1920.mp4` (v1 сохранён рядом); концепция «Үч ката», грамматика A/B, проверка `production/jobs/BW-004/docs/verification.md` (покадровый A/B-аудит: 0 нарушений). Ждёт отзыва пользователя; правки — `production/jobs/BW-004/data/edit.json` / `src/paper.tsx`, рендер `ENTRY=production/jobs/BW-004/src/index.ts COMP=BelesReelBW004` (см. edit-plan.md).

Отвечайте пользователю по-русски. Не запускайте платные API или runners автоматически. Проверка источника не означает, что новый ролик смонтирован/прослушан.
