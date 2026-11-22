#!/usr/bin/env bash
# Final master for social media: two-pass EBU R128 loudness normalisation to −14 LUFS,
# true peak −1 dBTP, AAC 320 kb/s 48 kHz. The video stream is copied without re-encoding.
set -euo pipefail
cd "$(dirname "$0")/.."
for name in admingest-trailer-16x9 admingest-trailer-9x16; do
  raw="out/${name}.raw.mp4"
  [ -f "$raw" ] || { echo "Falta $raw (ejecuta npm run render:16x9 / render:9x16)"; exit 1; }
  stats=$(ffmpeg -hide_banner -nostats -i "$raw" -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
  get() { echo "$stats" | python3 -c "import json,sys; print(json.load(sys.stdin)['$1'])"; }
  ffmpeg -hide_banner -loglevel error -y -i "$raw" -c:v copy \
    -af "loudnorm=I=-14:TP=-1:LRA=11:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true" \
    -ar 48000 -c:a aac -b:a 320k -movflags +faststart "out/${name}.mp4"
  echo "out/${name}.mp4 listo"
done
