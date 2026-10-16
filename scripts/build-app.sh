#!/usr/bin/env sh
# Build app.min.js from app.js (ES module, imports left as-is: core/ and config.js are served separately).
# Requires esbuild: npm install -g esbuild
set -eu
cd "$(dirname "$0")/.."
esbuild app.js --format=esm --minify --charset=utf8 --log-level=warning --outfile=app.min.js
echo "app.min.js: $(wc -c < app.min.js) bytes"
