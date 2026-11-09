# BW-004 — rendered

Роль: edit. Стиль: Beles V5. WhatsApp: 0998 08 38 28.

Следующий шаг: Передать в среду Claude Code файл 1000223289.mp4 (в репозиторий, Studio или вложением сеанса) и выполнить: bash production/jobs/BW-004/scripts/render-with-reference-music.sh <файл> v4; затем прослушать выбранный фрагмент, проверить и опубликовать v4.

2026-11-09: v3 — эффекты air/swoosh/pop/tick/click/chime, движение (шторка пустого листа, приближения, нажатия), выравнивание громкости дублей, NR 10; 32,60 с, −15,0 LUFS / −1,6 dBTP, A/B 0 нарушений, повторов нет; SHA-256 1426d98f…fb59. Музыка из 1000223289.mp4 НЕ вставлена: файла нет в среде Claude (вложений нет, нет в GitHub/Studio). v1, v2 сохранены.

Исходник: `VID-001.mp4`, 40147656 байт.
SHA-256: `35e1fd7eaadffbf1203c3ba169ed4bc65c7d99d6fe5e33fa15d05fad8c94799b`. Манифест: `manifest.json`.
Хранилище: приватный Cloudflare R2 через Studio source broker; uploadId `bf1c41f8-9df7-4ed2-83ab-9f3145e939e9`, объект `live/raw/bf1c41f8-9df7-4ed2-83ab-9f3145e939e9/source.mp4`. Git-частей нет.

Продолжение: `python3 scripts/beles.py status BW-004`; исходник получать только командой `curl -fsSL https://balago-studio.vercel.app/studio-fetch.mjs -o /tmp/belestudio-fetch.mjs && node /tmp/belestudio-fetch.mjs adiletgpt6-beep/Beles_web_video VID-001 input/BW-004/VID-001.mp4` (нужен секрет STUDIO_SOURCE_TOKEN, URL и токен не публиковать), затем `python3 scripts/beles.py verify BW-004`.

Точное состояние, заметки, артефакты и история — `checkpoint.json`; проверка доставки — `delivery.json` (если уже выполнена). Публикуйте checkpoint и рабочие материалы в GitHub перед сменой чата.
