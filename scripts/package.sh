#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Building production bundle..."
node scripts/build.js

# Verify every required file is present and non-empty BEFORE packaging,
# so a release can never ship missing a script (e.g. content-script.js).
REQUIRED=(
  "manifest.json"
  "background/service-worker.js"
  "content/content-script.js"
  "sidepanel/sidepanel.html"
  "sidepanel/sidepanel.js"
  "sidepanel/sidepanel.css"
  "options/options.html"
  "options/options.js"
  "options/options.css"
  "assets/fonts/material-symbols.css"
  "assets/fonts/material-symbols-outlined.woff2"
  "assets/icons/icon-16.png"
  "assets/icons/icon-128.png"
)

echo "Verifying build output..."
missing=0
for f in "${REQUIRED[@]}"; do
  if [ ! -s "dist/$f" ]; then
    echo "  MISSING or empty: dist/$f"
    missing=1
  fi
done
if [ "$missing" -ne 0 ]; then
  echo "ERROR: build output is incomplete — aborting package."
  exit 1
fi

VERSION=$(node -p "require('./package.json').version")
ZIP_NAME="anya-ai-v${VERSION}.zip"

echo "Packaging ${ZIP_NAME}..."
rm -f "${ZIP_NAME}"
cd dist
zip -r "../${ZIP_NAME}" . -x '*.DS_Store'
cd ..

# Sanity-check the finished archive really contains the content script.
if ! unzip -l "${ZIP_NAME}" | grep -q "content/content-script.js"; then
  echo "ERROR: ${ZIP_NAME} is missing content/content-script.js — aborting."
  exit 1
fi

echo "Package created: ${ZIP_NAME}"
echo "--- archive contents ---"
unzip -l "${ZIP_NAME}"
