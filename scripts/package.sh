#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "Building production bundle..."
node scripts/build.js

VERSION=$(node -p "require('./package.json').version")
ZIP_NAME="anya-ai-v${VERSION}.zip"

echo "Packaging ${ZIP_NAME}..."
cd dist
zip -r "../${ZIP_NAME}" . -x '*.DS_Store'
cd ..

echo "Package created: ${ZIP_NAME}"
