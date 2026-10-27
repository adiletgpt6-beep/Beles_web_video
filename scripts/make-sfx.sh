#!/usr/bin/env bash
# Synthesises two subtle, license-free UI sounds with FFmpeg (no third-party audio).
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p assets/sfx
# soft whoosh: filtered pink noise with a fast attack / smooth release
ffmpeg -hide_banner -y -f lavfi -i "anoisesrc=d=0.42:c=pink:r=48000:a=0.5" \
  -af "highpass=f=350,lowpass=f=5200,bandpass=f=1800:width_type=o:w=1.6,afade=t=in:d=0.12:curve=qsin,afade=t=out:st=0.14:d=0.28:curve=exp,volume=2.2" \
  -ac 1 -c:a pcm_s16le assets/sfx/whoosh.wav
# soft pop/tick for highlights
ffmpeg -hide_banner -y -f lavfi -i "sine=f=1250:d=0.09:r=48000" -f lavfi -i "sine=f=1870:d=0.09:r=48000" \
  -filter_complex "[0][1]amix=inputs=2,afade=t=in:d=0.004,afade=t=out:st=0.01:d=0.08:curve=exp,volume=0.8" \
  -ac 1 -c:a pcm_s16le assets/sfx/pop.wav
