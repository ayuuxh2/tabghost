# TabGhost — Setup

Thanks for downloading TabGhost. This archive contains a single standalone
binary. No runtime (Node, Bun) is required to run it.

## 1. Run it

**macOS / Linux**

```bash
chmod +x ./tabghost-*
./tabghost-* serve
```

**Windows**

```powershell
.\tabghost-windows-x64.exe serve
```

Then open the dashboard at http://localhost:8787

## 2. First-run browser install

Live browser sessions use a Chromium runtime. The first time you spawn a
session, TabGhost will guide you to install it:

```bash
# one-time, installs the Chromium build TabGhost drives
npx playwright install chromium
```

(If you have Node/npm available this is automatic. A fully bundled browser
runtime is on the roadmap so this step disappears.)

## 3. Commands

```
tabghost serve                       start API + dashboard (default :8787)
tabghost identities                  list identity presets
tabghost list                        list sub-profiles
tabghost create <label> <identityId> create a sub-profile
tabghost clone <id> [label]          clone a sub-profile
tabghost delete <id>                 delete a sub-profile
tabghost sessions                    list live sessions
tabghost open <id> [url]             launch a headed session
```

## 4. Config

| Env var          | Default            | Purpose                          |
|------------------|--------------------|----------------------------------|
| `PORT`           | `8787`             | API + dashboard port             |
| `TABGHOST_HOME`  | `~/.tabghost`      | where sub-profiles are stored    |
| `TABGHOST_TOKEN` | (unset)            | if set, requires bearer auth     |

## Links

- Repo: https://github.com/ayuuxh2/tabghost
- License: MIT
