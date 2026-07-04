import { test, expect, afterAll } from "bun:test";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SubProfileStore } from "../src/store.ts";
import type { SubProfile } from "../src/types.ts";

const root = join(tmpdir(), `tg-store-test-${Date.now()}`);
const store = new SubProfileStore(root);

function make(id: string, label: string): SubProfile {
  const now = Date.now();
  return {
    id,
    label,
    workspace: "default",
    userDataDir: store.userDataDirFor(id),
    identityId: "win-us-east",
    createdAt: now,
    updatedAt: now,
    tags: [],
    headless: true,
    metadata: {},
  };
}

afterAll(async () => {
  await fs.rm(root, { recursive: true, force: true }).catch(() => {});
});

test("upsert then get returns the profile", async () => {
  const p = make("a1", "Alpha");
  await store.upsert(p);
  const got = await store.get("a1");
  expect(got?.label).toBe("Alpha");
});

test("list returns all profiles sorted by updatedAt desc", async () => {
  await store.upsert({ ...make("b1", "Beta"), updatedAt: Date.now() + 1000 });
  const list = await store.list();
  expect(list.length).toBeGreaterThanOrEqual(2);
  // Most recently updated first.
  expect(list[0].id).toBe("b1");
});

test("remove deletes the profile", async () => {
  await store.upsert(make("c1", "Gamma"));
  expect(await store.remove("c1")).toBe(true);
  expect(await store.get("c1")).toBeUndefined();
  expect(await store.remove("c1")).toBe(false);
});

test("persistence survives a fresh store instance", async () => {
  await store.upsert(make("d1", "Delta"));
  const reopened = new SubProfileStore(root);
  const got = await reopened.get("d1");
  expect(got?.label).toBe("Delta");
});
