#!/usr/bin/env bash
# Prepares the source for rendering. Input: input/1000218256.mp4 (AV1 1080x1920 30fps, AAC 44.1k).
# Output (git-ignored, local only):
#   public/media/source.mp4    graded H.264 intermediate, CRF 12, CFR 30 fps, no audio (single extra generation)
#   public/media/source48k.wav original audio, resampled to 48 kHz mono, untouched otherwise
set -euo pipefail
cd "$(dirname "$0")/.."
SRC="${1:-input/1000218256.mp4}"
mkdir -p public/media
# Gentle grade: slightly less red in skin/curtain, tamed white shirt highlights, small lift in mids.
GRADE="eq=contrast=1.04:brightness=0.012:saturation=0.92:gamma=1.03,colorbalance=rs=-0.04:rm=-0.03:bs=0.02:bm=0.015:rh=-0.01,curves=all='0/0 0.85/0.83 1/0.96'"
ffmpeg -hide_banner -y -i "$SRC" -map 0:v:0 -vf "$GRADE,format=yuv420p" \
  -c:v libx264 -preset medium -crf 12 -r 30 -fps_mode cfr -g 15 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -an public/media/source.mp4
ffmpeg -hide_banner -y -i "$SRC" -map 0:a:0 -ac 1 -ar 48000 -c:a pcm_s24le public/media/source48k.wav
ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=width,height,r_frame_rate,nb_read_frames,pix_fmt -of compact public/media/source.mp4
