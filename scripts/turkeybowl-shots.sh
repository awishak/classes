#!/bin/sh
# Turkey Bowl's pictures, photographed. Start the game first (npx vite --port 5199),
# then run: sh scripts/turkeybowl-shots.sh <folder> [pages]
# Each page of private/turkeybowl-sheet.html comes back as sheet<n>.png in the folder.
OUT="${1:-/tmp/turkeybowl-shots}"
PAGES="${2:-1 2 3 4 5}"
mkdir -p "$OUT"
for p in $PAGES; do
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars \
    --window-size=1300,1500 --virtual-time-budget=4000 \
    --screenshot="$OUT/sheet$p.png" "http://localhost:5199/private/turkeybowl-sheet.html?p=$p" 2>/dev/null
done
ls "$OUT"
