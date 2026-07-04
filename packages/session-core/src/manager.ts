import { randomUUID } from "node:crypto";
import { chromium, type BrowserContext } from "playwright";
import { SubProfileStore } from "./store.js";
import { getIdentityPreset, IDENTITY_PRESETS } from "./presets.js";
import { buildContextOptions, buildInitScript } from "./identity.js";
import type {
  CreateSubProfileInput,
  Session,
  SpawnSessionInput,
  SubProfile,
} from "./types.js";

interface LiveSession {
  meta: Session;
  context: BrowserContext;
}

/**
 * SessionManager is the heart of TabGhost. It owns the sub-profile lifecycle
 * (create, list, clone, delete) and the live-session lifecycle (spawn, list,
 * close). Each sub-profile gets a persistent, isolated userDataDir so cookies,
 * localStorage, IndexedDB, service workers, and cache never leak across
 * sub-profiles — even for the same domain.
 */
export class SessionManager {
  private readonly store: SubProfileStore;
  private readonly sessions = new Map<string, LiveSession>();

  constructor(root: string) {
    this.store = new SubProfileStore(root);
  }

  // --- sub-profile management ---------------------------------------------

  async createSubProfile(input: CreateSubProfileInput): Promise<SubProfile> {
    const identity = getIdentityPreset(input.identityId);
    if (!identity) {
      throw new Error(
        `Unknown identity preset "${input.identityId}". Known: ${IDENTITY_PRESETS.map((p) => p.id).join(", ")}`,
      );
    }
    const id = randomUUID();
    const now = Date.now();
    const profile: SubProfile = {
      id,
      label: input.label,
      workspace: input.workspace ?? "default",
      userDataDir: this.store.userDataDirFor(id),
      identityId: input.identityId,
      proxy: input.proxy,
      createdAt: now,
      updatedAt: now,
      tags: input.tags ?? [],
      headless: input.headless ?? true,
      metadata: input.metadata ?? {},
    };
    return this.store.upsert(profile);
  }

  listSubProfiles(): Promise<SubProfile[]> {
    return this.store.list();
  }

  getSubProfile(id: string): Promise<SubProfile | undefined> {
    return this.store.get(id);
  }

  async cloneSubProfile(id: string, label?: string): Promise<SubProfile> {
    const src = await this.store.get(id);
    if (!src) throw new Error(`Sub-profile ${id} not found`);
    return this.createSubProfile({
      label: label ?? `${src.label} (clone)`,
      workspace: src.workspace,
      identityId: src.identityId,
      proxy: src.proxy,
      tags: src.tags.slice(),
      headless: src.headless,
      metadata: { ...src.metadata, clonedFrom: id },
    });
  }

  async updateSubProfile(
    id: string,
    patch: Partial<Pick<SubProfile, "label" | "workspace" | "tags" | "headless" | "proxy" | "metadata">>,
  ): Promise<SubProfile> {
    const existing = await this.store.get(id);
    if (!existing) throw new Error(`Sub-profile ${id} not found`);
    const updated: SubProfile = { ...existing, ...patch, updatedAt: Date.now() };
    return this.store.upsert(updated);
  }

  async deleteSubProfile(id: string): Promise<boolean> {
    // Close any live session bound to this sub-profile first.
    for (const [sid, live] of this.sessions) {
      if (live.meta.subProfileId === id) await this.closeSession(sid).catch(() => {});
    }
    return this.store.remove(id);
  }

  // --- live session management --------------------------------------------

  async spawnSession(input: SpawnSessionInput): Promise<Session> {
    const profile = await this.store.get(input.subProfileId);
    if (!profile) throw new Error(`Sub-profile ${input.subProfileId} not found`);
    const identity = getIdentityPreset(profile.identityId);
    if (!identity) throw new Error(`Identity preset ${profile.identityId} missing`);

    const headless = input.headless ?? profile.headless;
    const opts = buildContextOptions(identity);
    opts.headless = headless;
    if (profile.proxy) opts.proxy = profile.proxy;

    const sessionId = randomUUID();
    const meta: Session = {
      id: sessionId,
      subProfileId: profile.id,
      startedAt: Date.now(),
      headless,
      status: "launching",
      pages: 0,
    };

    try {
      const context = await chromium.launchPersistentContext(profile.userDataDir, {
        headless,
        locale: opts.locale,
        timezoneId: opts.timezoneId,
        userAgent: opts.userAgent,
        viewport: opts.viewport,
        screen: opts.screen,
        colorScheme: opts.colorScheme,
        geolocation: opts.geolocation,
        permissions: opts.permissions,
        proxy: opts.proxy,
        args: ["--disable-blink-features=AutomationControlled"],
      });

      await context.addInitScript(buildInitScript(identity));

      meta.status = "live";
      const existingPages = context.pages();
      const page = existingPages.length > 0 ? existingPages[0] : await context.newPage();
      if (input.startUrl) {
        await page.goto(input.startUrl, { waitUntil: "domcontentloaded" }).catch((e) => {
          meta.lastError = String(e);
        });
      }
      meta.pages = context.pages().length;

      context.on("close", () => {
        const live = this.sessions.get(sessionId);
        if (live) live.meta.status = "closed";
        this.sessions.delete(sessionId);
      });

      this.sessions.set(sessionId, { meta, context });
      // touch updatedAt on use
      await this.store.upsert({ ...profile, updatedAt: Date.now() });
      return meta;
    } catch (e) {
      meta.status = "error";
      meta.lastError = String(e);
      throw e;
    }
  }

  listSessions(): Session[] {
    return Array.from(this.sessions.values()).map((s) => ({
      ...s.meta,
      pages: (() => {
        try {
          return s.context.pages().length;
        } catch {
          return s.meta.pages;
        }
      })(),
    }));
  }

  getContext(sessionId: string): BrowserContext | undefined {
    return this.sessions.get(sessionId)?.context;
  }

  async closeSession(sessionId: string): Promise<boolean> {
    const live = this.sessions.get(sessionId);
    if (!live) return false;
    live.meta.status = "closing";
    try {
      await live.context.close();
    } catch {
      /* ignore */
    }
    this.sessions.delete(sessionId);
    return true;
  }

  async closeAll(): Promise<void> {
    await Promise.all(Array.from(this.sessions.keys()).map((id) => this.closeSession(id)));
  }
}
