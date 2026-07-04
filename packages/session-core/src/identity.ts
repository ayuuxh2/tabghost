import type { IdentityPreset } from "./types.js";

/**
 * Builds the Playwright context options + init script that applies a sub-profile's
 * identity preset consistently on every page in the session.
 *
 * Storage isolation itself is handled by the SessionManager via a separate
 * userDataDir per sub-profile. This module is responsible only for the
 * in-page identity surface (UA, navigator props, screen, WebGL, canvas, audio,
 * timezone, locale, geolocation).
 */

export interface ContextLaunchOptions {
  headless: boolean;
  locale: string;
  timezoneId: string;
  userAgent: string;
  viewport: { width: number; height: number };
  screen: { width: number; height: number };
  colorScheme?: "light" | "dark" | "no-preference";
  geolocation?: { latitude: number; longitude: number };
  permissions?: string[];
  proxy?: {
    server: string;
    bypass?: string;
    username?: string;
    password?: string;
  };
}

export function buildContextOptions(preset: IdentityPreset): ContextLaunchOptions {
  return {
    headless: true,
    locale: preset.geo.locale,
    timezoneId: preset.geo.timezoneId,
    userAgent: preset.hardware.userAgent,
    viewport: {
      width: preset.hardware.screen.availWidth,
      height: preset.hardware.screen.availHeight,
    },
    screen: {
      width: preset.hardware.screen.width,
      height: preset.hardware.screen.height,
    },
    colorScheme: "light",
    geolocation: preset.geo.geolocation,
    permissions: preset.geo.geolocation ? ["geolocation"] : [],
  };
}

/**
 * The init script injected into every page. It overrides navigator, screen, and
 * WebGL/canvas/audio surfaces with stable, preset-derived values so the sub-profile
 * is internally consistent across launches and replays.
 *
 * Values are serialised in as JSON literals — never as references to the outer
 * closure — so the script is portable across page navigations.
 */
export function buildInitScript(preset: IdentityPreset): string {
  const h = preset.hardware;
  const r = preset.renderer;
  const g = preset.geo;

  return `
(() => {
  const HARDWARE = ${JSON.stringify(h)};
  const RENDERER = ${JSON.stringify(r)};
  const GEO = ${JSON.stringify(g)};

  // --- navigator surface ---
  try {
    Object.defineProperty(navigator, 'userAgent', { get: () => HARDWARE.userAgent });
    Object.defineProperty(navigator, 'platform', { get: () => HARDWARE.platform });
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => HARDWARE.hardwareConcurrency });
    Object.defineProperty(navigator, 'deviceMemory', { get: () => HARDWARE.deviceMemory });
    Object.defineProperty(navigator, 'language', { get: () => GEO.locale });
    Object.defineProperty(navigator, 'languages', { get: () => [GEO.locale, 'en'] });
  } catch (e) {}

  // --- screen surface ---
  try {
    Object.defineProperty(screen, 'width', { get: () => HARDWARE.screen.width });
    Object.defineProperty(screen, 'height', { get: () => HARDWARE.screen.height });
    Object.defineProperty(screen, 'availWidth', { get: () => HARDWARE.screen.availWidth });
    Object.defineProperty(screen, 'availHeight', { get: () => HARDWARE.screen.availHeight });
    Object.defineProperty(screen, 'colorDepth', { get: () => HARDWARE.colorDepth });
    Object.defineProperty(screen, 'pixelDepth', { get: () => HARDWARE.colorDepth });
    Object.defineProperty(window, 'devicePixelRatio', { get: () => HARDWARE.pixelRatio });
  } catch (e) {}

  // --- WebGL surface ---
  const patchWebGL = (proto) => {
    if (!proto) return;
    const orig = proto.getParameter;
    proto.getParameter = function (param) {
      // UNMASKED_VENDOR_WEBGL = 0x9245, UNMASKED_RENDERER_WEBGL = 0x9246
      if (param === 0x9245) return RENDERER.webglVendor;
      if (param === 0x9246) return RENDERER.webglRenderer;
      return orig.apply(this, arguments);
    };
  };
  try {
    patchWebGL(WebGLRenderingContext && WebGLRenderingContext.prototype);
    patchWebGL(typeof WebGL2RenderingContext !== 'undefined' && WebGL2RenderingContext.prototype);
  } catch (e) {}

  // --- canvas noise: stable per-seed perturbation ---
  const seedHash = (seed) => {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };
  const canvasSeed = seedHash(RENDERER.canvasSeed);
  try {
    const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function (...args) {
      const ctx = this.getContext('2d');
      if (ctx) {
        const w = this.width, hh = this.height;
        if (w > 0 && hh > 0) {
          const shift = (canvasSeed % 7) - 3;
          try { ctx.fillStyle = 'rgba(0,0,0,0.01)'; ctx.fillRect(0, 0, w, hh); } catch (e) {}
          // Stable per-seed pixel perturbation
          try {
            const img = ctx.getImageData(0, 0, Math.min(w, 16), Math.min(hh, 16));
            for (let i = 0; i < img.data.length; i += 4) {
              img.data[i] = (img.data[i] + shift) & 0xff;
            }
            ctx.putImageData(img, 0, 0);
          } catch (e) {}
        }
      }
      return origToDataURL.apply(this, args);
    };
  } catch (e) {}

  // --- audio noise: stable per-seed perturbation ---
  try {
    const audioSeed = seedHash(RENDERER.audioSeed);
    const origGetChannelData = AudioBuffer.prototype.getChannelData;
    AudioBuffer.prototype.getChannelData = function (...args) {
      const data = origGetChannelData.apply(this, args);
      // Stable, subaudible perturbation deterministically derived from the seed.
      for (let i = 0; i < data.length; i += 100) {
        data[i] = (data[i] + ((audioSeed % 9) - 4) * 1e-7);
      }
      return data;
    };
  } catch (e) {}
})();
`;
}
