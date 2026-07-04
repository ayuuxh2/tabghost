#!/usr/bin/env bash
# Build standalone TabGhost binaries for all supported platforms using Bun's
# --compile cross-compilation. Playwright is kept external (it ships its own
# browser binaries fetched at runtime via `playwright install chromium`).
set -euo pipefail

cd "$(dirname "$0")/.."

VERSION="$(node -p "require('./package.json').version" 2>/dev/null || echo dev)"
OUT="dist/binaries"
ENTRY="apps/desktop/src/main.ts"
rm -rf "$OUT"
mkdir -p "$OUT"

# target-triple : output-name
TARGETS=(
  "bun-linux-x64:tabghost-linux-x64"
  "bun-linux-arm64:tabghost-linux-arm64"
  "bun-darwin-x64:tabghost-macos-x64"
  "bun-darwin-arm64:tabghost-macos-arm64"
  "bun-windows-x64:tabghost-windows-x64.exe"
)

for entry in "${TARGETS[@]}"; do
  triple="${entry%%:*}"
  name="${entry##*:}"
  echo "==> building $name ($triple)"
  bun build "$ENTRY" \
    --compile \
    --target="$triple" \
    --external playwright \
    --external playwright-core \
    --outfile "$OUT/$name" || { echo "FAILED: $name"; continue; }
done

echo
echo "==> built binaries (v$VERSION):"
ls -lh "$OUT"
