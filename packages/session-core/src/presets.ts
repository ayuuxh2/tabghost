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

const winChrome131: HardwarePreset = {
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  platform: "Win32",
  hardwareConcurrency: 16,
  deviceMemory: 8,
  screen: { width: 2560, height: 1440, availWidth: 2560, availHeight: 1400 },
  colorDepth: 24,
  pixelRatio: 1,
};

const pixelChrome131: HardwarePreset = {
  userAgent:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
  platform: "Linux armv8l",
  hardwareConcurrency: 8,
  deviceMemory: 8,
  screen: { width: 412, height: 915, availWidth: 412, availHeight: 915 },
  colorDepth: 24,
  pixelRatio: 2.625,
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

const nvidiaRenderer: RendererPreset = {
  webglVendor: "Google Inc. (NVIDIA)",
  webglRenderer:
    "ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)",
  canvasSeed: "tg-nvidia-3060-01",
  audioSeed: "tg-nvidia-audio-01",
};

const adrenoRenderer: RendererPreset = {
  webglVendor: "Google Inc. (Qualcomm)",
  webglRenderer: "ANGLE (Qualcomm, Adreno (TM) 730, OpenGL ES 3.2)",
  canvasSeed: "tg-adreno-730-01",
  audioSeed: "tg-adreno-audio-01",
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

const euCentral: GeoPreset = {
  locale: "de-DE",
  timezone: "Europe/Berlin",
  timezoneId: "Europe/Berlin",
  geolocation: { latitude: 52.52, longitude: 13.405 },
};

const apacIn: GeoPreset = {
  locale: "en-IN",
  timezone: "Asia/Kolkata",
  timezoneId: "Asia/Kolkata",
  geolocation: { latitude: 19.076, longitude: 72.8777 },
};

const apacSg: GeoPreset = {
  locale: "en-SG",
  timezone: "Asia/Singapore",
  timezoneId: "Asia/Singapore",
  geolocation: { latitude: 1.3521, longitude: 103.8198 },
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
  {
    id: "win-gaming-eu",
    label: "Windows / Chrome 131 / RTX 3060 / EU Central",
    hardware: winChrome131,
    renderer: nvidiaRenderer,
    geo: euCentral,
  },
  {
    id: "win-us-west-131",
    label: "Windows / Chrome 131 / US West",
    hardware: winChrome131,
    renderer: nvidiaRenderer,
    geo: usWest,
  },
  {
    id: "pixel8-in",
    label: "Pixel 8 / Chrome 131 / India",
    hardware: pixelChrome131,
    renderer: adrenoRenderer,
    geo: apacIn,
  },
  {
    id: "pixel8-sg",
    label: "Pixel 8 / Chrome 131 / Singapore",
    hardware: pixelChrome131,
    renderer: adrenoRenderer,
    geo: apacSg,
  },
];

const presetIndex = new Map(IDENTITY_PRESETS.map((p) => [p.id, p]));

export function getIdentityPreset(id: string): IdentityPreset | undefined {
  return presetIndex.get(id);
}

export function listIdentityPresets(): IdentityPreset[] {
  return IDENTITY_PRESETS.slice();
}
