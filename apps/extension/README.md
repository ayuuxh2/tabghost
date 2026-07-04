# TabGhost Controller (browser extension)

An MV3 browser extension that acts as a controller and dashboard for the local
TabGhost API. It does not spoof anything itself — it manages the isolated
sub-profiles and sessions that the TabGhost engine runs.

## What it does

- Shows connection status to your local TabGhost API server
- Lists identity presets and sub-profiles
- Creates, clones, and deletes sub-profiles
- Spawns and closes live sessions
- Points at any API base URL with an optional bearer token (Settings)

## Install (developer mode)

1. Start the TabGhost API server (from a release binary or `bun run` in `apps/desktop`).
2. Open `chrome://extensions` (or `edge://extensions`, `brave://extensions`).
3. Enable **Developer mode**.
4. Click **Load unpacked** and select this `apps/extension` folder.
5. Open the extension popup. If it shows **disconnected**, open **Settings** and
   set the API base URL (default `http://127.0.0.1:8787`) and token if you set one.

## Files

- `manifest.json` — MV3 manifest
- `popup.html` / `src/popup.js` — the controller UI
- `src/api.js` — local API client
- `src/background.js` — connection-status badge
- `src/options.html` / `src/options.js` — settings page
- `icons/` — extension icons

## Note

The extension talks to `http://127.0.0.1` / `localhost` only. The TabGhost API
server enables CORS so the extension origin can reach it.
