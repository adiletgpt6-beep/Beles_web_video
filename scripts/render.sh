#!/usr/bin/env bash
# Final render. Prerequisites: npm ci; bash scripts/prepare-media.sh; bash scripts/make-sfx.sh
#   node scripts/build-timeline.mjs && node scripts/build-audio.mjs
# Optional: CHROME=/path/to/chrome-headless-shell (otherwise Remotion downloads its own).
set -euo pipefail
cd "$(dirname "$0")/.."
NAME="${NAME:-beles-web-v5-1080x1920}"
PREVIEW="${PREVIEW:-preview-v5-720x1280}"
BROWSER_ARGS=()
if [ -n "${CHROME:-}" ]; then BROWSER_ARGS=(--browser-executable="$CHROME"); fi
mkdir -p out
# 1) picture: Remotion, H.264 High, CRF 16 (keeps UI text and site screenshots crisp), yuv420p, 30 fps CFR
npx remotion render src/index.ts BelesReel out/video-only.mp4 \
  --codec=h264 --crf=16 --x264-preset=slow --pixel-format=yuv420p --muted \
  --concurrency="${CONCURRENCY:-2}" "${BROWSER_ARGS[@]}"
# 2) mux with the processed voice track (video stream copied, no extra generation), AAC 48 kHz, faststart
ffmpeg -hide_banner -y -i out/video-only.mp4 -i public/media/voice.wav \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 256k -ar 48000 -ac 2 \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
  -movflags +faststart -shortest out/${NAME}.mp4
# 3) light preview 720x1280
ffmpeg -hide_banner -y -i out/${NAME}.mp4 -vf "scale=720:1280:flags=lanczos" \
  -c:v libx264 -preset slow -crf 21 -pix_fmt yuv420p -r 30 -c:a aac -b:a 160k -ar 48000 \
  -movflags +faststart out/${PREVIEW}.mp4
rm -f out/video-only.mp4
ls -la out
