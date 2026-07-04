import { test, expect, afterAll, beforeAll } from "bun:test";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SessionManager } from "../src/manager.ts";

/**
 * Browser-backed integration test. This is the real proof of TabGhost's core
 * promise: two sub-profiles on the same machine get (a) fully isolated storage
 * and (b) distinct injected identities.
 *
 * A tiny local HTTP server provides a real origin, because localStorage is
 * denied on about:blank / opaque origins, and init scripts only take effect on
 * a navigation.
 *
 * Skipped automatically if a Chromium build is not available, so unit tests
 * still pass everywhere.
 */

const root = join(tmpdir(), `tg-iso-test-${Date.now()}`);
const mgr = new SessionManager(root);

let server: ReturnType<typeof Bun.serve> | null = null;
let ORIGIN = "";

beforeAll(() => {
  server = Bun.serve({
    port: 0,
    fetch: () => new Response("<!doctype html><title>tg</title><h1>ok</h1>", {
      headers: { "content-type": "text/html" },
    }),
  });
  ORIGIN = `http://127.0.0.1:${server.port}/`;
});

async function chromiumAvailable(): Promise<boolean> {
  try {
    const { chromium } = await import("playwright");
    const ctx = await chromium.launchPersistentContext(join(root, "_probe"), {
      headless: true,
    });
    await ctx.close();
    return true;
  } catch {
    return false;
  }
}

afterAll(async () => {
  await mgr.closeAll().catch(() => {});
  server?.stop(true);
  await fs.rm(root, { recursive: true, force: true }).catch(() => {});
});

const hasBrowser = await chromiumAvailable();
const maybe = hasBrowser ? test : test.skip;

maybe("injected identity matches the preset (Win32 on any host)", async () => {
  const profile = await mgr.createSubProfile({
    label: "iso-a",
    identityId: "win-us-east",
    headless: true,
  });
  const session = await mgr.spawnSession({
    subProfileId: profile.id,
    headless: true,
    startUrl: ORIGIN,
  });
  const ctx = mgr.getContext(session.id)!;
  const page = ctx.pages()[0] ?? (await ctx.newPage());
  const platform = await page.evaluate(() => navigator.platform);
  const cores = await page.evaluate(() => navigator.hardwareConcurrency);
  expect(platform).toBe("Win32");
  expect(cores).toBe(8);
  await mgr.closeSession(session.id);
}, 60000);

maybe("two sub-profiles do not share localStorage", async () => {
  const a = await mgr.createSubProfile({ label: "iso-store-a", identityId: "win-us-east" });
  const b = await mgr.createSubProfile({ label: "iso-store-b", identityId: "mac-us-east" });

  const sa = await mgr.spawnSession({ subProfileId: a.id, headless: true, startUrl: ORIGIN });
  const ca = mgr.getContext(sa.id)!;
  const pa = ca.pages()[0] ?? (await ca.newPage());
  await pa.evaluate(() => localStorage.setItem("secret", "FROM_A"));
  await mgr.closeSession(sa.id);

  const sb = await mgr.spawnSession({ subProfileId: b.id, headless: true, startUrl: ORIGIN });
  const cb = mgr.getContext(sb.id)!;
  const pb = cb.pages()[0] ?? (await cb.newPage());
  const leaked = await pb.evaluate(() => localStorage.getItem("secret"));
  await mgr.closeSession(sb.id);

  expect(leaked).toBeNull();
}, 90000);

maybe("localStorage persists across sessions of the same sub-profile", async () => {
  const p = await mgr.createSubProfile({ label: "iso-persist", identityId: "linux-us-east" });

  const s1 = await mgr.spawnSession({ subProfileId: p.id, headless: true, startUrl: ORIGIN });
  const c1 = mgr.getContext(s1.id)!;
  const p1 = c1.pages()[0] ?? (await c1.newPage());
  await p1.evaluate(() => localStorage.setItem("keep", "YES"));
  await mgr.closeSession(s1.id);

  const s2 = await mgr.spawnSession({ subProfileId: p.id, headless: true, startUrl: ORIGIN });
  const c2 = mgr.getContext(s2.id)!;
  const p2 = c2.pages()[0] ?? (await c2.newPage());
  const kept = await p2.evaluate(() => localStorage.getItem("keep"));
  await mgr.closeSession(s2.id);

  expect(kept).toBe("YES");
}, 90000);
