import { Hono } from "hono";
import { cors } from "hono/cors";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  SessionManager,
  listIdentityPresets,
  type CreateSubProfileInput,
} from "@tabghost/session-core";
import { runAction } from "./actions.js";

/**
 * TabGhost automation API.
 *
 * This is the surface AI agents and automations talk to. It wraps the
 * SessionManager with a small, stable HTTP contract:
 *
 *   GET    /health
 *   GET    /identities
 *   GET    /profiles
 *   POST   /profiles                 { label, identityId, workspace?, proxy?, tags?, headless? }
 *   GET    /profiles/:id
 *   PATCH  /profiles/:id
 *   POST   /profiles/:id/clone       { label? }
 *   DELETE /profiles/:id
 *   GET    /sessions
 *   POST   /sessions                 { subProfileId, startUrl?, headless? }
 *   DELETE /sessions/:id
 *   POST   /sessions/:id/actions     { action, ... }   (navigate/click/fill/text/screenshot/eval)
 *
 * Auth: if TABGHOST_TOKEN is set, every request must send
 * `Authorization: Bearer <token>`.
 */

const ROOT = process.env.TABGHOST_HOME ?? `${process.env.HOME ?? "."}/.tabghost`;
const PORT = Number(process.env.PORT ?? process.env.TABGHOST_PORT ?? 8787);
const TOKEN = process.env.TABGHOST_TOKEN;

const manager = new SessionManager(ROOT);
const app = new Hono();

app.use("*", cors());

app.use("*", async (c, next) => {
  if (TOKEN) {
    const auth = c.req.header("authorization");
    if (auth !== `Bearer ${TOKEN}`) {
      return c.json({ error: "unauthorized" }, 401);
    }
  }
  await next();
});

app.get("/health", (c) => c.json({ ok: true, root: ROOT, service: "tabghost" }));

// --- dashboard --------------------------------------------------------------
// The control-panel UI is a single self-contained HTML file. Serving it from
// the same origin as the API avoids CORS and keeps the launcher a single process.
const __dir = dirname(fileURLToPath(import.meta.url));
let DASHBOARD_HTML = "";
try {
  DASHBOARD_HTML = readFileSync(
    join(__dir, "../../control-panel/src/ui.html"),
    "utf8",
  );
} catch {
  DASHBOARD_HTML = "<h1>TabGhost</h1><p>Dashboard UI not found.</p>";
}
app.get("/", (c) => c.html(DASHBOARD_HTML));

app.get("/identities", (c) => c.json({ identities: listIdentityPresets() }));

app.get("/profiles", async (c) => c.json({ profiles: await manager.listSubProfiles() }));

app.post("/profiles", async (c) => {
  const body = (await c.req.json()) as CreateSubProfileInput;
  if (!body?.label || !body?.identityId) {
    return c.json({ error: "label and identityId are required" }, 400);
  }
  try {
    const profile = await manager.createSubProfile(body);
    return c.json({ profile }, 201);
  } catch (e) {
    return c.json({ error: String(e) }, 400);
  }
});

app.get("/profiles/:id", async (c) => {
  const p = await manager.getSubProfile(c.req.param("id"));
  return p ? c.json({ profile: p }) : c.json({ error: "not found" }, 404);
});

app.patch("/profiles/:id", async (c) => {
  const patch = await c.req.json();
  try {
    const profile = await manager.updateSubProfile(c.req.param("id"), patch);
    return c.json({ profile });
  } catch (e) {
    return c.json({ error: String(e) }, 400);
  }
});

app.post("/profiles/:id/clone", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  try {
    const profile = await manager.cloneSubProfile(c.req.param("id"), body?.label);
    return c.json({ profile }, 201);
  } catch (e) {
    return c.json({ error: String(e) }, 400);
  }
});

app.delete("/profiles/:id", async (c) => {
  const ok = await manager.deleteSubProfile(c.req.param("id"));
  return c.json({ deleted: ok });
});

app.get("/sessions", (c) => c.json({ sessions: manager.listSessions() }));

app.post("/sessions", async (c) => {
  const body = await c.req.json();
  if (!body?.subProfileId) return c.json({ error: "subProfileId is required" }, 400);
  try {
    const session = await manager.spawnSession(body);
    return c.json({ session }, 201);
  } catch (e) {
    return c.json({ error: String(e) }, 400);
  }
});

app.delete("/sessions/:id", async (c) => {
  const ok = await manager.closeSession(c.req.param("id"));
  return c.json({ closed: ok });
});

app.post("/sessions/:id/actions", async (c) => {
  const context = manager.getContext(c.req.param("id"));
  if (!context) return c.json({ error: "session not found" }, 404);
  const body = await c.req.json();
  try {
    const result = await runAction(context, body);
    return c.json({ result });
  } catch (e) {
    return c.json({ error: String(e) }, 400);
  }
});

async function shutdown() {
  await manager.closeAll().catch(() => {});
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log(`[tabghost] api listening on :${PORT}  (home=${ROOT}${TOKEN ? ", auth=on" : ""})`);

export default { port: PORT, fetch: app.fetch };
