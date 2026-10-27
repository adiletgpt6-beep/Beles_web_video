# Распознавание речи (как была сделана расшифровка)

Запуск из рабочей папки, где лежат `src16k.wav` (`ffmpeg -i input/1000218256.mp4 -ac 1 -ar 16000 src16k.wav`) и `silences.txt`
(`data/asr/silences-35dB.txt`); скрипты обращаются к ним как `../src16k.wav`, `../silences.txt`.

- `fw.py` — Whisper large-v3 (faster-whisper), черновик и пословные тайминги: `python3 fw.py large-v3 ../src16k.wav auto out.json`
- `ky2.py` — `nineninesix/kyrgyz-whisper-medium` с токеном `<|ky|>` (id 51865) по речевым фрагментам из карты пауз
- `kychunks.py 327.70-331.47 ...` — распознать отдельные интервалы
- `kyscore.py tests.json` — принудительный скоринг вариантов спорных слов
- `kyts.py 327.70-331.47` — пословные тайминги одного интервала

Зависимости: `pip install faster-whisper transformers torch`. Модели скачиваются с huggingface.co.
