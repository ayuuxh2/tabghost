import type { HardwarePreset, RendererPreset, GeoPreset, IdentityPreset } from "./types.js";

/**
 * Curated identity presets. Each one is internally consistent (UA, platform,
 * hardware, screen, WebGL vendor/renderer, locale, timezone all line up), so a
 * sub-profile bound to one of these looks like a coherent real device.
 *
 * TabGhost does not chase "every possible fingerprint" — it gives agents a
 * small set of stable, believable identities they can reuse deterministically.
 */

const winChrome128: HardwarePreset = {
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  platform: "Win32",
  hardwareConcurrency: 8,
  deviceMemory: 8,
  screen: { width: 1920, height: 1080, availWidth: 1920, availHeight: 1040 },
  colorDepth: 24,
  pixelRatio: 1,
};

const macChrome128: HardwarePreset = {
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  platform: "MacIntel",
  hardwareConcurrency: 10,
  deviceMemory: 8,
  screen: { width: 1728, height: 1117, availWidth: 1728, availHeight: 1077 },
  colorDepth: 30,
  pixelRatio: 2,
};

const linuxChrome128: HardwarePreset = {
  userAgent:
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  platform: "Linux x86_64",
  hardwareConcurrency: 8,
  deviceMemory: 8,
  screen: { width: 1920, height: 1080, availWidth: 1920, availHeight: 1053 },
  colorDepth: 24,
  pixelRatio: 1,
};

const angleRenderer: RendererPreset = {
  webglVendor: "Google Inc. (Intel)",
  webglRenderer: "ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0, D3D11)",
  canvasSeed: "tg-angle-630-01",
  audioSeed: "tg-angle-audio-01",
};

const appleRenderer: RendererPreset = {
  webglVendor: "Google Inc. (Apple)",
  webglRenderer: "ANGLE (Apple, Apple M1, OpenGL 4.1)",
  canvasSeed: "tg-apple-m1-01",
  audioSeed: "tg-apple-audio-01",
};

const mesaRenderer: RendererPreset = {
  webglVendor: "Google Inc. (Intel)",
  webglRenderer: "ANGLE (Intel, Mesa Intel(R) UHD Graphics 630 (CFL GT2), OpenGL 4.6)",
  canvasSeed: "tg-mesa-630-01",
  audioSeed: "tg-mesa-audio-01",
};

const usEast: GeoPreset = {
  locale: "en-US",
  timezone: "America/New_York",
  timezoneId: "America/New_York",
  geolocation: { latitude: 40.7128, longitude: -74.006 },
};

const usWest: GeoPreset = {
  locale: "en-US",
  timezone: "America/Los_Angeles",
  timezoneId: "America/Los_Angeles",
  geolocation: { latitude: 34.0522, longitude: -118.2437 },
};

const euWest: GeoPreset = {
  locale: "en-GB",
  timezone: "Europe/London",
  timezoneId: "Europe/London",
  geolocation: { latitude: 51.5074, longitude: -0.1278 },
};

export const IDENTITY_PRESETS: IdentityPreset[] = [
  {
    id: "win-us-east",
    label: "Windows / Chrome 128 / US East",
    hardware: winChrome128,
    renderer: angleRenderer,
    geo: usEast,
  },
  {
    id: "win-us-west",
    label: "Windows / Chrome 128 / US West",
    hardware: winChrome128,
    renderer: angleRenderer,
    geo: usWest,
  },
  {
    id: "mac-us-east",
    label: "macOS / Chrome 128 / US East",
    hardware: macChrome128,
    renderer: appleRenderer,
    geo: usEast,
  },
  {
    id: "mac-eu-west",
    label: "macOS / Chrome 128 / EU West",
    hardware: macChrome128,
    renderer: appleRenderer,
    geo: euWest,
  },
  {
    id: "linux-us-east",
    label: "Linux / Chrome 128 / US East",
    hardware: linuxChrome128,
    renderer: mesaRenderer,
    geo: usEast,
  },
];

const presetIndex = new Map(IDENTITY_PRESETS.map((p) => [p.id, p]));

export function getIdentityPreset(id: string): IdentityPreset | undefined {
  return presetIndex.get(id);
}

export function listIdentityPresets(): IdentityPreset[] {
  return IDENTITY_PRESETS.slice();
}
