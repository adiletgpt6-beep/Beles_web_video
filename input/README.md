Восстановление эталонного исходника из GitHub: `python3 scripts/beles.py restore BW-001`.

Проверка: `python3 scripts/beles.py verify BW-001`. Получится `input/1000218256.mp4` (1080×1920, 30 fps, AV1+AAC, ~5:41). Это игнорируемая локальная копия; оригинал закреплён частями по манифесту `production/jobs/BW-001/manifest.json`.

BW-001 уже утверждён; заново монтировать его не нужно. Новые задания используют отдельные `input/BW-XXX/…`. Порядок приёма — `production/INGEST.md`.
