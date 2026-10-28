# Beles Web Video — вертикальный ролик «сайт для бизнеса»

Монтаж ролика 1080×1920 (Reels) из сырого исходника по образцу референса: ведущий в кадре, над ним реальные страницы сайта‑примера (zeket.kg) в карточках браузера, крупные заголовки, короткие кыргызские субтитры, финальный призыв.

**Готовое видео:** см. раздел [Результат](#результат).

## Стек

- **Remotion 4 + React/TypeScript** — графика, карточки, субтитры, рендер кадров (`src/`).
- **FFmpeg** — промежуточный H.264 с цветокоррекцией, сборка и обработка звука, мультиплексирование, превью.
- **Playwright (Chromium)** — съёмка публичных страниц сайта (`scripts/capture-site.cjs`).
- **ASR**: `nineninesix/kyrgyz-whisper-medium` (кыргызский) + Whisper large-v3 (черновые тайминги) — `scripts/asr/`.
- Шрифты: Oswald 700 и Montserrat 600/700/800/700‑italic из npm `@fontsource` (кириллица‑ext: ө ү ң), грузятся локально.

## Структура

| Путь | Что это |
|---|---|
| `data/edit.json` | **Главный монтажный лист**: выбранные дубли (source in/out, секунды), тексты, группы субтитров, графика с привязкой к исходному времени |
| `scripts/build-timeline.mjs` | Пересчитывает всё в кадры финала → `data/timeline.generated.json`, `data/edl.csv`, `data/edl.edl` (CMX3600), `data/subtitles.srt`, `data/audio-plan.json` |
| `scripts/build-audio.mjs` | Голос: те же кадровые склейки + фейды 12 мс, highpass, мягкий denoise, компрессия, 2‑проходный loudnorm −15 LUFS / TP −1.5 dBTP, звуки появления |
| `scripts/prepare-media.sh` | AV1 → H.264 CRF 12 (одно поколение, 30 fps CFR, bt709) с мягкой коррекцией; звук → WAV 48 kHz |
| `scripts/make-sfx.py` | Синтез палитры эффектов (whoosh_in, swish, tick, pop, chime) |
| `scripts/make-music.py` | Синтез оригинальной фоновой музыки (numpy, детерминированно); вызывается из `build-audio.mjs` |
| `scripts/capture-site.cjs` | Съёмка zeket.kg/ky (desktop @2x, мобильная iPhone 13 @3x) |
| `scripts/render.sh` | Финальный рендер + мультиплекс + превью 720p |
| `scripts/verify.sh` | Технические проверки экспорта → `docs/verification-raw.txt` |
| `src/` | Композиция `BelesReel`: камера/крупности, карточки сайта, телефон, заголовки, субтитры, финальная плашка |
| `public/site/` | Сохранённые скриншоты сайта (рендер не обращается к живой странице) |
| `assets/sfx/` | Синтезированные звуки |
| `docs/transcript.md` | Расшифровка с таймкодами, дубли, сомнительные места |
| `docs/reference-analysis.md` | Разбор референса |
| `docs/edit-plan.md` | Монтажный план и выбор кадров сайта |
| `docs/verification.md` | Отчёт о проверке итогового MP4 |

Единицы: в `edit.json` — секунды исходника; в `timeline.generated.json` и EDL — кадры @30 fps (source и record раздельно). Длительность композиции считается из таймлайна.

## Входные файлы (не публикуются)

Положите исходник сюда (имя важно):

```
input/1000218256.mp4      # 1080×1920, 30 fps, AV1 + AAC, ~5:41
```

Например: `cp ~/Downloads/1000218256.mp4 input/`. Папки `input/` и `public/media/` в `.gitignore` — сырые дубли в репозиторий не попадают. Референс для рендера не нужен.

## Повторить монтаж

```bash
npm ci
bash scripts/prepare-media.sh            # → public/media/source.mp4, source48k.wav
python3 scripts/make-sfx.py assets/sfx   # → assets/sfx/*.wav (уже в репо)
npx -y playwright@1.56.1 --version >/dev/null; node scripts/capture-site.cjs   # необязательно: переснять сайт (нужен Playwright+Chromium; скриншоты уже в репо)
node scripts/build-timeline.mjs          # → data/timeline.generated.json, EDL, SRT
node scripts/build-audio.mjs             # → public/media/voice.wav (голос + музыка + акценты; STEMS=1 — стем музыки для проверки)
NAME=beles-web-v5-1080x1920 PREVIEW=preview-v5-720x1280 bash scripts/render.sh
bash scripts/verify.sh                   # проверки
```

`render.sh` использует Chromium, который скачивает Remotion; если нужен свой — `CHROME=/path/to/chrome-headless-shell bash scripts/render.sh`. Просмотр/правка в браузере: `npm run studio`.

Чтобы поменять дубль или сдвинуть графику — правьте `data/edit.json` и заново выполните `build-timeline` → `build-audio` → `render`.

## Результат

**V5 (текущая)** — текст за ведущим (маска), видеокарточка и круглая маска, окно сайта с продолжением движения и кликом, иконки услуг из речи; бело‑голубые субтитры без подложки; WhatsApp 0998 08 38 28 по жесту. Отчёт: [`docs/v5-report.md`](docs/v5-report.md).
- Release v5.0.0: https://github.com/adiletgpt6-beep/Beles_web_video/releases/tag/v5.0.0
  - [beles-web-v5-1080x1920.mp4](https://github.com/adiletgpt6-beep/Beles_web_video/releases/download/v5.0.0/beles-web-v5-1080x1920.mp4) — 1080×1920, 30 fps CFR, H.264 yuv420p, AAC 48 kHz, faststart, 28.17 с, −15.0 LUFS
  - [preview-v5-720x1280.mp4](https://github.com/adiletgpt6-beep/Beles_web_video/releases/download/v5.0.0/preview-v5-720x1280.mp4)
- Предыдущие версии: V4 — Release v4.0.0 ([отчёт](docs/v4-report.md)), V3, V2, V1 — в `release/` и одноимённых Release.

Маска ведущего для первых секунд: `python3 scripts/segment-presenter.py <selfie_multiclass_256x256.tflite> 1178 1275` (модель MediaPipe, https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite) — выполнить после `prepare-media.sh`, до рендера.

Шрифты (OFL) — `assets/fonts/`; музыка и эффекты синтезируются в репозитории (`scripts/make-music.py`, `scripts/make-sfx.py`), сторонних аудио нет.
