// The dashboard HTML is embedded at build time so the compiled binary is fully
// self-contained (no external files needed at runtime). Bun inlines this import
// as a string when bundling/compiling with `--compile`.
//
// In plain dev (`bun run src/server.ts`) the text import also works, but if a
// toolchain can't resolve it, server.ts falls back to reading the file from disk.
import html from "../../control-panel/src/ui.html" with { type: "text" };

export const EMBEDDED_DASHBOARD_HTML: string = html;
