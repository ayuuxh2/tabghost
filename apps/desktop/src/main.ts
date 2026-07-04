#!/usr/bin/env bun
/**
 * Unified TabGhost entrypoint for the compiled binary.
 *
 *   tabghost serve                 start the automation API + dashboard
 *   tabghost <cli command...>      run a CLI command (identities/list/create/…)
 *
 * With no arguments it starts the server (the most common single-binary use).
 */
import { serve } from "bun";

async function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];

  if (!cmd || cmd === "serve") {
    // Importing the server module starts it (default export is the Bun server config).
    const mod = await import("./server.js");
    const cfg = (mod.default ?? {}) as { port?: number; fetch?: (req: Request) => Response | Promise<Response> };
    if (cfg.fetch) {
      serve({ port: cfg.port ?? 8787, fetch: cfg.fetch });
    }
    return;
  }

  // Delegate everything else to the CLI.
  await import("./cli.js");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
