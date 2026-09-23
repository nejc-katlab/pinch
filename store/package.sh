#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

for size in 16 32 48 128; do
  if [ ! -f "icons/icon${size}.png" ]; then
    echo "Missing icons/icon${size}.png — add icons before packaging." >&2
    exit 1
  fi
done

rm -rf dist
mkdir -p dist

zip -r -q dist/recipe-converter.zip \
  manifest.json background.js content.js \
  lib popup print icons \
  -x '*/.DS_Store' -x 'icons/icon512.png'

echo "Built dist/recipe-converter.zip"
echo "Contents:"
unzip -l dist/recipe-converter.zip | awk 'NR>3 {print $4}' | sed '/^$/d'
