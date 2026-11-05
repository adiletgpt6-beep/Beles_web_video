# Studio source broker: доступ к существующему исходнику BW-003 (спецификация минимального изменения)

Дата: 2026-11-05. Автор: Claude Code (сессия Beles, ветка проекта). Репозиторий Studio (`adiletzainidinov/balago-video`) приватный и в этой сессии недоступен (подключение отклонено), поэтому изменение Studio здесь **не внесено**, а описано точно так, чтобы его можно было применить по образцу BW-002 (Studio PR #173, squash `5142c030`).

## Проверка текущего состояния брокера (выполнено 2026-11-05, только HTTP-статусы, тела ответов не читались и не сохранялись)

| Запрос `POST /api/source/resolve` | Статус |
|---|---|
| `{"repository":"adiletgpt6-beep/Beles_web_video","videoId":"BW-002"}` с `Authorization: Bearer $STUDIO_SOURCE_TOKEN` | 200 |
| та же пара без заголовка Authorization | 401 |
| `{"repository":"adiletgpt6-beep/Beles_web_video","videoId":"BW-003"}` с тем же токеном | **404** |

Вывод: авторизация брокера работает и секрет `STUDIO_SOURCE_TOKEN` в среде Claude Code действителен, но allowlist брокера содержит только BW-002. BW-003 не разрешён, поэтому `studio-fetch.mjs` (SHA-256 `fcee607e5c7018f1606cfb336de8de776031fcb9a5b2b8deb4164f5bfb69de68`, 122 строки, уже принимает `BW-\d{3,4}`) для BW-003 завершится ошибкой «Source broker rejected request (HTTP 404)». Изменять CLI не нужно.

## Требуемое изменение (только данные allowlist + тест)

Добавить в ту же таблицу точных соответствий, где уже описан BW-002, одну запись. Все поля должны совпадать **точно**; любое расхождение → 404, как сейчас.

```json
{
  "repository": "adiletgpt6-beep/Beles_web_video",
  "videoId": "BW-003",
  "uploadId": "ced83175-8979-410f-8742-df793118b3de",
  "objectKey": "live/raw/ced83175-8979-410f-8742-df793118b3de/source.mp4",
  "size": 17528359,
  "sha256": "88a058563539d8596ce356b8ab92ba0e3336971fe73dc218544482be7715965d",
  "status": "verified_r2_bytes_by_owner_2026-11-05",
  "sourceName": "1000221272.mp4"
}
```

Поведение эндпоинта не меняется:

- тот же `STUDIO_SOURCE_TOKEN` (сравнение с `STUDIO_SOURCE_TOKEN_SHA256` на Vercel) — без токена 401, с токеном и неизвестной парой repository/videoId — 404;
- перед выдачей подписанного GET выполняется R2 HEAD объекта и сверка `ContentLength === 17528359` (иначе 409/500, URL не выдаётся);
- ответ `{ size: 17528359, sha256: "88a0…965d", downloadUrl: <приватный подписанный R2 GET, срок 5 минут> }`;
- никаких записей: не создаётся VID/Issue, не вызывается submit, объект не перезаписывается, повторная загрузка не требуется;
- логировать только repository/videoId/статус, не URL и не токен.

Тест (по образцу теста BW-002): resolve для `BW-003` с валидным токеном → 200 и `size`/`sha256` из записи выше; `BW-003` без токена → 401; `BW-004` с токеном → 404; `BW-003` с другим `repository` → 404.

## После деплоя Studio (production READY)

В среде Claude Code с секретом выполнить команду из `production/jobs/BW-003/HANDOFF.md`:

```bash
curl -fsSL https://balago-studio.vercel.app/studio-fetch.mjs -o /tmp/belestudio-fetch.mjs
node /tmp/belestudio-fetch.mjs adiletgpt6-beep/Beles_web_video BW-003 input/BW-003/1000221272.mp4
python3 scripts/beles.py verify BW-003            # размер + SHA-256 + ffprobe; выводит probe
```

Затем записать выведенный `probe` в `production/jobs/BW-003/manifest.json` → `source.probe`, закоммитить и выполнить `python3 scripts/beles.py verify BW-003 --record-delivery`: появится `delivery.json`, BW-003 перейдёт `staged → queued`. Ожидаемые значения: 17 528 359 байт, SHA-256 `88a058563539d8596ce356b8ab92ba0e3336971fe73dc218544482be7715965d`. Если что-то не совпало — доставку не отмечать, исходник повторно не загружать, Issue/VID не создавать.

Примечание для этой сессии: даже если бы allowlist уже содержал BW-003, запуск загрузчика с токеном в текущей сессии был отклонён автоматическим классификатором разрешений Claude Code (две попытки). Для скачивания нужна сессия/режим, где эта команда разрешена пользователем.
