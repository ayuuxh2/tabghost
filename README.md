# TabGhost

TabGhost is a browser workspace layer for automations, AI agents, QA teams, and power users.

## Positioning

- One browser profile containing many isolated sub-profiles
- Each sub-profile has its own cookies, storage, proxy, and automation hooks
- Built for deterministic sessions, replay, cloning, and reset
- Open source and enterprise-ready

## Product principles

1. **Workspace isolation** — each session is a first-class object
2. **Automation-first** — agents can spawn, control, and reset sessions
3. **Deterministic replay** — saved recipes can be rehydrated exactly
4. **Auditability** — every sub-profile has history and state snapshots
5. **Brand control** — repo governance keeps the project identity intact

## Monorepo layout

- `brand/` — identity, naming, positioning, and contribution rules
- `docs/` — architecture and product documentation
- `apps/desktop/` — browser shell and control plane
- `apps/control-panel/` — dashboard for sessions and automations
- `packages/session-core/` — shared session and isolation primitives
- `.github/workflows/` — CI and release automation

## Next step

Draft the architecture blueprint and repository governance docs, then wire the initial app skeletons.
