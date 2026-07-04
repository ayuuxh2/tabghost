#!/usr/bin/env bash
# Package compiled TabGhost binaries into per-platform release archives.
# Each archive contains the standalone binary plus a README with setup steps.
# Playwright browsers are fetched on first `tabghost serve` run rather than
# bundled (they are large and platform-specific).
set -euo pipefail

cd "$(dirname "$0")/.."
VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "0.0.0")
BIN=dist/binaries
OUT=dist/release
rm -rf "$OUT"
mkdir -p "$OUT"

declare -A ARCHIVES=(
  [tabghost-linux-x64]=tar
  [tabghost-linux-arm64]=tar
  [tabghost-macos-x64]=tar
  [tabghost-macos-arm64]=tar
  [tabghost-windows-x64.exe]=zip
)

for bin in "${!ARCHIVES[@]}"; do
  [ -f "$BIN/$bin" ] || { echo "!! missing $BIN/$bin, run build-binaries.sh first"; exit 1; }
  name="${bin%.exe}"
  stage="$OUT/stage/$name"
  mkdir -p "$stage"
  cp "$BIN/$bin" "$stage/"
  cp README.md LICENSE "$stage/" 2>/dev/null || true
  cp docs/RELEASE-README.md "$stage/SETUP.md" 2>/dev/null || true

  if [ "${ARCHIVES[$bin]}" = "zip" ]; then
    (cd "$OUT/stage" && zip -qr "../${name}-v${VERSION}.zip" "$name")
  else
    tar -czf "$OUT/${name}-v${VERSION}.tar.gz" -C "$OUT/stage" "$name"
  fi
  echo "packaged $name"
done

rm -rf "$OUT/stage"

# Package the browser extension alongside the binaries.
if [ -d apps/extension ]; then
  (cd apps/extension && zip -qr "../../$OUT/tabghost-extension-v${VERSION}.zip" . \
    -x "*.DS_Store" "README-dev*")
  echo "packaged tabghost-extension"
fi

( cd "$OUT" && sha256sum ./* > SHA256SUMS.txt 2>/dev/null || shasum -a 256 ./* > SHA256SUMS.txt )
echo "==> release archives (v${VERSION}):"
ls -lh "$OUT"
