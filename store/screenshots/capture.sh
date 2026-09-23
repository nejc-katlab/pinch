#!/usr/bin/env bash
set -uo pipefail
cd "$(dirname "$0")/../.."

CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT=8799
OUT=store/screenshots
NAMES=(01-clean-recipe 02-metric 03-measurable-scaling 04-auto-detect 05-print-and-dark)

python3 -m http.server "$PORT" >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT
sleep 1

for n in 1 2 3 4 5; do
  SCHEME=1
  [ "$n" = "5" ] && SCHEME=0
  PROFILE=$(mktemp -d)
  RAW="$OUT/raw-$n.png"
  rm -f "$RAW"
  "$CH" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=1280,800 \
    --virtual-time-budget=4000 --blink-settings=preferredColorScheme=$SCHEME --user-data-dir="$PROFILE" \
    --screenshot="$RAW" "http://localhost:$PORT/$OUT/compose.html?shot=$n" >/dev/null 2>&1 &
  pid=$!
  for _ in $(seq 1 60); do
    [ -s "$RAW" ] && sleep 1 && break
    sleep 0.5
  done
  kill "$pid" 2>/dev/null
  pkill -f "$PROFILE" 2>/dev/null
  wait "$pid" 2>/dev/null
  rm -rf "$PROFILE"
  python3 -c "
from PIL import Image
im = Image.open('$RAW').convert('RGBA')
flat = Image.new('RGB', im.size, (255, 255, 255))
flat.paste(im, mask=im.getchannel('A'))
flat.save('$OUT/${NAMES[$((n-1))]}.png', optimize=True)
"
  rm -f "$RAW"
  echo "$OUT/${NAMES[$((n-1))]}.png"
done
