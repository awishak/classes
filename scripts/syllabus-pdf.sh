#!/bin/zsh
# Print a syllabus HTML file to PDF with headless Chrome.
#
#   zsh scripts/syllabus-pdf.sh teaching/comm3/comm3-syllabus.html
#
# Writes the PDF next to the HTML with the same name. Chrome on this machine
# does not exit after print-to-pdf, so the script waits for the file to land,
# then kills the process. No dependency beyond Google Chrome.
set -u
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SRC="${1:?usage: syllabus-pdf.sh path/to/syllabus.html}"
SRC="$(cd "$(dirname "$SRC")" && pwd)/$(basename "$SRC")"
OUT="${SRC%.html}.pdf"
PROFILE="${TMPDIR:-/tmp}/syllabus-chrome-profile"
mkdir -p "$PROFILE"
rm -f "$OUT"

"$CHROME" --headless=new --disable-gpu --no-first-run --user-data-dir="$PROFILE" \
  --no-pdf-header-footer --virtual-time-budget=8000 \
  --print-to-pdf="$OUT" "file://$SRC" >/dev/null 2>&1 &
PID=$!
for i in {1..60}; do
  if [ -s "$OUT" ]; then sleep 1; break; fi
  sleep 1
done
kill $PID 2>/dev/null
pkill -f "syllabus-chrome-profile" 2>/dev/null

if [ -s "$OUT" ]; then
  echo "wrote $OUT"
else
  echo "no PDF written" >&2
  exit 1
fi
