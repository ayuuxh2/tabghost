/**
 * TabGhost session-core: type definitions for sub-profiles, sessions, identities, and proxies.
 *
 * A "sub-profile" is the persistent, isolated unit. It owns a separate user-data
 * directory (so cookies, localStorage, IndexedDB, service workers, and cache are
 * fully isolated from every other sub-profile) plus an identity preset and an
 * optional proxy binding.
 *
 * A "session" is a live, running instance of a sub-profile — an open browser
 * context bound to that sub-profile's storage partition.
 */

export type SubProfileId = string;
export type SessionId = string;

/** Proxy configuration bound to a sub-profile. */
export interface ProxyConfig {
  /** "http" | "https" | "socks4" | "socks5" */
  server: string;
  /** Optional bypass list, comma-separated hosts. */
  bypass?: string;
  username?: string;
  password?: string;
}

/** Geographic + locale metadata used to drive fingerprint consistency. */
export interface GeoPreset {
  locale: string;
  timezone: string;
  /** IANA timezone id, e.g. "America/New_York". */
  timezoneId: string;
  geolocation?: { latitude: number; longitude: number };
}

/** Hardware fingerprint preset. Values are deliberately constrained to realistic
 *  combinations so a sub-profile stays internally consistent across replays. */
export interface HardwarePreset {
  userAgent: string;
  platform: string;
  /** e.g. "Win32", "MacIntel", "Linux x86_64". */
  hardwareConcurrency: number;
  deviceMemory: number;
  /** Screen dimensions in CSS px. */
  screen: { width: number; height: number; availWidth: number; availHeight: number };
  colorDepth: number;
  pixelRatio: number;
}

/** WebGL + Canvas identity descriptors. These are injected as stable per-sub-profile
 *  values rather than randomised per-launch, so a sub-profile is internally consistent. */
export interface RendererPreset {
  webglVendor: string;
  webglRenderer: string;
  /** Stable noise seed for canvas/WebAudio fingerprint normalisation. */
  canvasSeed: string;
  audioSeed: string;
}

/** A complete identity preset. Sub-profiles reference one of these by id. */
export interface IdentityPreset {
  id: string;
  label: string;
  hardware: HardwarePreset;
  renderer: RendererPreset;
  geo: GeoPreset;
}

/** A sub-profile: the persistent, isolated workspace unit. */
export interface SubProfile {
  id: SubProfileId;
  label: string;
  /** Grouping used by the dashboard for multi-tenant workspaces. */
  workspace: string;
  /** Path to the isolated user-data directory on disk. */
  userDataDir: string;
  identityId: string;
  proxy?: ProxyConfig;
  createdAt: number;
  updatedAt: number;
  /** Free-form tags for filtering and governance. */
  tags: string[];
  /** Whether the sub-profile should be launched in headless mode by default. */
  headless: boolean;
  /** Arbitrary metadata for agents / users. */
  metadata: Record<string, unknown>;
}

/** A live session: an open browser context bound to a sub-profile. */
export interface Session {
  id: SessionId;
  subProfileId: SubProfileId;
  startedAt: number;
  /** BrowserContext handle is held in the SessionManager, not serialised here. */
  headless: boolean;
  status: "launching" | "live" | "closing" | "closed" | "error";
  pages: number;
  lastError?: string;
}

/** A reproducible recipe used to clone or replay a sub-profile. */
export interface SessionRecipe {
  label: string;
  workspace: string;
  identityId: string;
  proxy?: ProxyConfig;
  tags: string[];
  headless: boolean;
  metadata: Record<string, unknown>;
}

export interface CreateSubProfileInput {
  label: string;
  workspace?: string;
  identityId: string;
  proxy?: ProxyConfig;
  tags?: string[];
  headless?: boolean;
  metadata?: Record<string, unknown>;
}

export interface SpawnSessionInput {
  subProfileId: SubProfileId;
  headless?: boolean;
  /** Initial URL to navigate to. */
  startUrl?: string;
}
