#!/usr/bin/env bash
# BW-004: rebuild the mix with the user's reference music (1000223289.mp4) and render the next version.
#   bash production/jobs/BW-004/scripts/render-with-reference-music.sh /path/to/1000223289.mp4 v4 [start_seconds]
# Steps: SHA-256 of the reference → prep-music.py (even stretch, 0.8 s in / 2.5 s out, −18 LUFS) → build-audio
# (bed −21 dB under the voice + side-chain ducking, same SFX, per-take levelling) → render → technical + A/B checks.
# Listen to the chosen stretch before publishing: the reference must not carry speech/vocals over the voice.
set -euo pipefail
cd "$(dirname "$0")/../../../.."
REF="$1"; VER="${2:-v4}"; START="${3:-}"
J=production/jobs/BW-004
mkdir -p input/BW-004/music
sha256sum "$REF" | tee "$J/data/reference-music.sha256"
DUR=$(python3 -c "import json;t=json.load(open('$J/data/timeline.generated.json'));print(t['durationInFrames']/t['fps'])")
python3 "$J/scripts/prep-music.py" "$REF" "$DUR" input/BW-004/music/bed.wav ${START:+--start $START}
cp input/BW-004/music/bed.wav.json "$J/data/reference-music-choice.json"
MUSIC_FILE=input/BW-004/music/bed.wav LEVEL_CLIPS=1 VOICE_NR=10 VOICE_EQ=1 \
  PLAN=$J/data/audio-plan.json MEDIA=public/media/bw004 node scripts/build-audio.mjs
CONCURRENCY=3 CHROME=/opt/pw-browsers/chromium NAME=beles-bw004-$VER-1080x1920 PREVIEW=preview-bw004-$VER-720x1280 \
  ENTRY=$J/src/index.ts COMP=BelesReelBW004 AUDIO=public/media/bw004/voice.wav bash scripts/render.sh
bash scripts/verify.sh out/beles-bw004-$VER-1080x1920.mp4 $J/docs/verification-$VER-raw.txt
python3 $J/qa/ab_audit.py $J/data/timeline.generated.json out/beles-bw004-$VER-1080x1920.mp4 $J/docs/ab-audit-$VER.json
