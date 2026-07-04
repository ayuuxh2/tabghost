# Contributing to TabGhost

Thanks for your interest in TabGhost — an open-source browser workspace layer for AI agents, automation, and multi-tenant testing.

## Getting started

```bash
bun install
bun run build:core
bun test              # runs unit + browser isolation tests
bun run api           # API + dashboard on :8787
```

## Ground rules

- **Keep the positioning.** TabGhost is a *workspace layer* for reproducible, isolated, automatable browser sessions — not an "anti-detect" tool. PRs that reframe it as stealth/evasion will be declined. See `docs/REPO-GOVERNANCE.md`.
- **Don't change branding** (name, logo, owner) without maintainer sign-off.
- **Tests must pass.** Add tests for new behaviour, especially anything touching storage isolation or identity injection.
- **Small, reviewable commits.** Conventional-commit style prefixes (`feat:`, `fix:`, `docs:`, `chore:`) preferred.

## Project layout

| Path | What |
|------|------|
| `packages/session-core` | Sub-profile engine, identity presets, session manager |
| `apps/desktop` | Automation API server + CLI |
| `apps/control-panel` | Single-file dashboard UI |
| `apps/extension` | MV3 controller extension |
| `scripts/` | Binary build + release packaging |

## Reporting bugs / ideas

Open a GitHub issue with steps to reproduce (for bugs) or a clear use case (for features). Isolation or identity bugs are highest priority — include the identity preset and OS involved.

## License

By contributing, you agree your contributions are licensed under the MIT License.
