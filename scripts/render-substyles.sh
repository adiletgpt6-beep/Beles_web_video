#!/usr/bin/env bash
# Renders the A–E subtitle comparison on one fragment (final frames 151–304, "Биз бизнесиңиз үчүн заманбап, кооз…"),
# then joins them into out/subtitle-styles-preview.mp4 (sequential, with the concept named in each clip).
set -euo pipefail
cd "$(dirname "$0")/.."
BROWSER_ARGS=()
if [ -n "${CHROME:-}" ]; then BROWSER_ARGS=(--browser-executable="$CHROME"); fi
FR="${FRAMES:-151-304}"
declare -A NAMES=([A]="A · Активное слово" [B]="B · Кинетическая типографика" [C]="C · Чистая типографика" [D]="D · Движущаяся плашка — выбран" [E]="E · Сборка фразы + акцент")
mkdir -p out/substyles
for v in ${VARIANTS:-A B C D E}; do
  npx remotion render src/index.ts SubStyle "out/substyles/$v.mp4" --frames="$FR" --codec=h264 --crf=18 \
    --props="{\"subVariant\":\"$v\",\"styleLabel\":\"${NAMES[$v]}\"}" --concurrency="${CONCURRENCY:-2}" --muted "${BROWSER_ARGS[@]}"
done
START=$(python3 -c "print(${FR%-*}/30)")
printf "file '%s'\n" A.mp4 B.mp4 C.mp4 D.mp4 E.mp4 > out/substyles/list.txt
ffmpeg -hide_banner -y -f concat -safe 0 -i out/substyles/list.txt -i public/media/voice.wav \
  -filter_complex "[1:a]atrim=start=${START},asetpts=PTS-STARTPTS,aloop=loop=4:size=$(( (${FR#*-}-${FR%-*}+1) * 1600 ))[a]" \
  -map 0:v -map "[a]" -c:v libx264 -crf 20 -preset medium -pix_fmt yuv420p -vf scale=720:1280 -c:a aac -b:a 160k -shortest -movflags +faststart \
  out/subtitle-styles-preview.mp4
