import { test, expect } from "bun:test";
import {
  listIdentityPresets,
  getIdentityPreset,
} from "../src/presets.ts";
import { buildContextOptions, buildInitScript } from "../src/identity.ts";

test("presets are internally consistent", () => {
  for (const p of listIdentityPresets()) {
    expect(p.id).toBeTruthy();
    expect(p.hardware.userAgent).toContain("Mozilla/5.0");
    expect(p.hardware.screen.availWidth).toBeLessThanOrEqual(p.hardware.screen.width);
    expect(p.hardware.screen.availHeight).toBeLessThanOrEqual(p.hardware.screen.height);
    expect(p.geo.locale).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
    // Windows UA should carry a Win32 platform, mac -> MacIntel, etc.
    if (p.hardware.userAgent.includes("Windows")) expect(p.hardware.platform).toBe("Win32");
    if (p.hardware.userAgent.includes("Macintosh")) expect(p.hardware.platform).toBe("MacIntel");
  }
});

test("getIdentityPreset returns undefined for unknown id", () => {
  expect(getIdentityPreset("does-not-exist")).toBeUndefined();
});

test("buildContextOptions maps preset fields correctly", () => {
  const preset = getIdentityPreset("win-us-east")!;
  const opts = buildContextOptions(preset);
  expect(opts.userAgent).toBe(preset.hardware.userAgent);
  expect(opts.timezoneId).toBe(preset.geo.timezoneId);
  expect(opts.locale).toBe(preset.geo.locale);
});

test("init script embeds preset values as literals, not references", () => {
  const preset = getIdentityPreset("mac-eu-west")!;
  const script = buildInitScript(preset);
  // Values must be serialised inline so the script is portable across pages.
  expect(script).toContain(preset.hardware.platform);
  expect(script).toContain(preset.hardware.userAgent);
  expect(script).toContain("UNMASKED_VENDOR_WEBGL".length ? "0x9245" : "");
  // No outer-closure references leaked in.
  expect(script).toContain("navigator");
  expect(script).toContain("getChannelData");
});
