# TabGhost

**One browser. Many isolated sub-profiles. Built for AI agents, automation, and multi-tenant testing.**

TabGhost lets you spin up unlimited isolated browser sub-profiles inside a single controlled browser layer. Each sub-profile has its own cookies, localStorage, IndexedDB, cache, service workers, proxy, and a stable device identity — so sessions never leak into each other, even on the same domain. Agents can create, clone, drive, snapshot, and reset them through a simple local API.

> Not an "anti-detect" toy. TabGhost is a workspace layer for reproducible, isolated, automatable browser sessions.

---

## Why

Running many accounts, tenants, or agent tasks from one machine normally means juggling separate browser profiles by hand, or fighting a browser that shares cookies and fingerprints across tabs. TabGhost makes each **sub-profile** a first-class object:

- **Isolated** — separate on-disk storage partition per sub-profile
- **Consistent** — a stable, internally-coherent device identity (UA, platform, screen, WebGL, canvas/audio, timezone, locale)
- **Automatable** — spawn and drive sessions over HTTP or CLI
- **Reproducible** — clone a sub-profile or reset it to a clean state
- **Auditable** — metadata, tags, and workspaces for multi-tenant grouping

## Architecture

```
packages/session-core   Sub-profile engine: storage isolation, identity presets,
                        session lifecycle (spawn / clone / reset / delete)
apps/desktop            Automation API server (Hono) + CLI over session-core
apps/control-panel      Single-file dashboard UI (served by the API)
apps/extension          MV3 browser extension: controller/dashboard for the local API
```

The heavy lifting runs through a controlled Chromium instance (via Playwright), one persistent context per sub-profile. The extension is a **controller** — it talks to the local API, it does not try to spoof anything from inside the page.

## Quick start (from source)

### macOS / Linux (using Bun)
```bash
bun install
bun run build:core
bun run api            # starts the automation API + dashboard on :8787
```

### Windows (using Node.js)
*Note: Bun on Windows has a known bug that hangs Playwright browser pipes. Use Node.js/tsx on Windows to run TabGhost.*
```bash
bun install            # installs dependencies
bun run build:core     # builds the core package
npm run api:node       # starts the API + dashboard on :8787
```

Once started, open http://127.0.0.1:8787 for the dashboard, or use the CLI:

```bash
# On Mac/Linux:
bun run cli identities
bun run cli open <id> https://example.com

# On Windows:
npm run cli:node identities
npm run cli:node open <id> https://example.com
```

## Automation API

`GET /health` · `GET /identities` · `GET|POST /profiles` · `GET|PATCH|DELETE /profiles/:id` · `POST /profiles/:id/clone` · `GET|POST /sessions` · `DELETE /sessions/:id` · `POST /sessions/:id/actions`

Session actions: `navigate`, `click`, `fill`, `type`, `text`, `html`, `screenshot`, `waitFor`, `eval`, `cookies`, `pages`.

Set `TABGHOST_TOKEN` to require `Authorization: Bearer <token>` on every request.

```bash
# create a profile, spawn a session, navigate, read the title
curl -s localhost:8787/profiles -d '{"label":"A","identityId":"win-us-east"}'
curl -s localhost:8787/sessions -d '{"subProfileId":"<id>","startUrl":"https://example.com"}'
curl -s localhost:8787/sessions/<sid>/actions -d '{"action":"text","selector":"h1"}'
```

## Downloads

Standalone binaries (no runtime required) for Linux, macOS, and Windows, plus the browser extension, are published on the [Releases page](https://github.com/ayuuxh2/tabghost/releases). Playwright's Chromium is fetched on first run.

## Build binaries locally

```bash
bun run build:core
bash scripts/build-binaries.sh     # -> dist/binaries/
bash scripts/package-release.sh    # -> dist/release/ (archives + extension + checksums)
```

## Browser extension

Load `apps/extension/` as an unpacked MV3 extension (Chrome → Extensions → Developer mode → Load unpacked), or install the packaged zip from Releases. Point it at your local API in the extension's settings.

## Project status

Working today: sub-profile engine, storage isolation, identity injection, session manager, automation API, CLI, dashboard, standalone binaries, browser extension, CI + release automation.

See `docs/ARCHITECTURE.md` for design details and `docs/REPO-GOVERNANCE.md` for contribution and branding rules.

## License

MIT — see `LICENSE`.
