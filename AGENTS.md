# TabGhost — Workspace Index

Open-source browser workspace layer: one browser, many isolated sub-profiles, built for AI agents, automation, and multi-tenant testing. MIT licensed. GitHub: https://github.com/ayuuxh2/tabghost

## Repo map

- `packages/session-core/` — core engine. Sub-profile types (`types.ts`), device identity presets (`presets.ts`), in-page identity injection script (`identity.ts`), on-disk metadata store (`store.ts`), and the `SessionManager` (`manager.ts`) that owns sub-profile + live-session lifecycle. Playwright is imported lazily so profile/CLI ops work without browsers installed.
- `apps/desktop/` — automation API server (`server.ts`, Hono), automation verbs (`actions.ts`), CLI (`cli.ts`), unified binary entrypoint (`main.ts`), embedded dashboard (`dashboard.ts`).
- `apps/control-panel/` — single-file dashboard UI (`src/ui.html`), served by the desktop API at `/`.
- `apps/extension/` — MV3 browser extension controller for the local API (popup, options, background, api client). It is a controller, NOT an in-page spoofer.
- `scripts/build-binaries.sh` — compiles standalone binaries for linux/mac (x64+arm64) and windows via `bun build --compile`. Playwright is external.
- `scripts/package-release.sh` — bundles binaries + extension into `dist/release/` archives with checksums.
- `.github/workflows/ci.yml` — install + typecheck + build on push/PR.
- `.github/workflows/release.yml` — on `v*` tag: build, package, publish GitHub Release.

## Key decisions

- Storage isolation = one persistent Chromium context per sub-profile, separate `userDataDir`. This is the real isolation guarantee.
- Identity presets are internally consistent (UA/platform/screen/WebGL/geo all line up) and stable per sub-profile, not randomized per launch.
- Positioning is "workspace layer for agents/automation", never "anti-detect". Keep it that way (see `docs/REPO-GOVERNANCE.md`, `brand/BRAND.md`).
- Single-exe cannot fully embed Playwright browsers; they download on first `serve`. That's expected.

## Conventions

- Bun + TypeScript, ESM, `.js` import specifiers in TS source.
- Git identity for pushes: flexhunt1@gmail.com. Auth via `gh` credential helper (already configured); if a push fails on auth, run `GH_TOKEN="$GITHUB" gh auth setup-git`.
- Build core (`bun run build:core`) before compiling binaries.

## Common commands

```bash
bun install
bun run build:core
bun run api           # API + dashboard on :8787
bun run cli <cmd>     # CLI
bash scripts/build-binaries.sh && bash scripts/package-release.sh
```
