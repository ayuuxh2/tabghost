import { promises as fs } from "node:fs";
import path from "node:path";
import type { SubProfile } from "./types.js";

/**
 * SubProfileStore persists sub-profile metadata as a single JSON index on disk.
 * The actual isolated browser state (cookies, storage, cache) lives in each
 * sub-profile's own userDataDir; this store only tracks the metadata graph.
 */
export class SubProfileStore {
  private readonly root: string;
  private readonly indexPath: string;
  private cache: Map<string, SubProfile> | null = null;

  constructor(root: string) {
    this.root = root;
    this.indexPath = path.join(root, "subprofiles.json");
  }

  /** Directory where a sub-profile's isolated browser state is stored. */
  userDataDirFor(id: string): string {
    return path.join(this.root, "profiles", id);
  }

  private async ensureRoot(): Promise<void> {
    await fs.mkdir(path.join(this.root, "profiles"), { recursive: true });
  }

  private async load(): Promise<Map<string, SubProfile>> {
    if (this.cache) return this.cache;
    await this.ensureRoot();
    try {
      const raw = await fs.readFile(this.indexPath, "utf8");
      const arr = JSON.parse(raw) as SubProfile[];
      this.cache = new Map(arr.map((p) => [p.id, p]));
    } catch {
      this.cache = new Map();
    }
    return this.cache;
  }

  private async flush(): Promise<void> {
    if (!this.cache) return;
    const arr = Array.from(this.cache.values());
    const tmp = this.indexPath + ".tmp";
    await fs.writeFile(tmp, JSON.stringify(arr, null, 2), "utf8");
    await fs.rename(tmp, this.indexPath);
  }

  async list(): Promise<SubProfile[]> {
    const c = await this.load();
    return Array.from(c.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async get(id: string): Promise<SubProfile | undefined> {
    const c = await this.load();
    return c.get(id);
  }

  async upsert(profile: SubProfile): Promise<SubProfile> {
    const c = await this.load();
    c.set(profile.id, profile);
    await this.flush();
    return profile;
  }

  async remove(id: string): Promise<boolean> {
    const c = await this.load();
    const existed = c.delete(id);
    if (existed) {
      await this.flush();
      // Best-effort wipe of the isolated user-data dir.
      await fs.rm(this.userDataDirFor(id), { recursive: true, force: true }).catch(() => {});
    }
    return existed;
  }
}
