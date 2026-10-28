#!/usr/bin/env bash
# Technical checks of the exported MP4 (writes docs/verification-raw.txt).
set -uo pipefail
cd "$(dirname "$0")/.."
F="${1:-out/beles-web-v2-1080x1920.mp4}"
{
  echo "== file: $F ($(stat -c %s "$F") bytes)"
  echo "== streams"
  ffprobe -v error -show_entries stream=codec_name,profile,width,height,pix_fmt,r_frame_rate,avg_frame_rate,sample_rate,channels,bit_rate,color_primaries,color_transfer,color_space:format=duration,bit_rate -of default=nw=1 "$F"
  echo "== frame count"
  ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 "$F"
  echo "== faststart (moov before mdat?)"
  python3 - "$F" <<'PY'
import sys,struct
f=open(sys.argv[1],'rb');order=[]
while True:
    h=f.read(8)
    if len(h)<8: break
    size,typ=struct.unpack('>I4s',h);typ=typ.decode('latin1');order.append(typ)
    if size==1: size=struct.unpack('>Q',f.read(8))[0];f.seek(size-16,1)
    else: f.seek(size-8,1)
print(order)
PY
  echo "== full decode errors (empty = none)"
  ffmpeg -v error -i "$F" -f null - 2>&1 | head -20
  echo "== loudness (EBU R128)"
  ffmpeg -hide_banner -nostats -i "$F" -map 0:a -af ebur128=peak=true -f null - 2>&1 | grep -A12 "Summary" | grep -E "I:|LRA:|Peak:"
  echo "== black frames (>=0.1 s)"
  ffmpeg -hide_banner -nostats -i "$F" -vf blackdetect=d=0.1:pic_th=0.95 -an -f null - 2>&1 | grep blackdetect || echo none
  echo "== silences > 0.5 s at -40 dB"
  ffmpeg -hide_banner -nostats -i "$F" -af silencedetect=n=-40dB:d=0.5 -vn -f null - 2>&1 | grep -E "silence_(start|end)" || echo none
} | tee "${2:-docs/verification-v2-raw.txt}"
