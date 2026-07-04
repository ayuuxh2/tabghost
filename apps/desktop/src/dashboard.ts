// The dashboard HTML is embedded at build time so the compiled binary is fully
// self-contained (no external files needed at runtime). Bun/Node can load this JSON.
//
// In plain dev the JSON strings are empty, and server.ts falls back to reading the files from disk.
import assets from "./dashboard_assets.json" with { type: "json" };

export const EMBEDDED_DASHBOARD_HTML: string = assets.ui;
export const EMBEDDED_HOME_HTML: string = assets.home;
