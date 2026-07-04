#!/usr/bin/env bun
/**
 * Unified TabGhost entrypoint for the compiled binary or runtime execution.
 *
 *   tabghost serve                 start the automation API + dashboard
 *   tabghost <cli command...>      run a CLI command (identities/list/create/…)
 *
 * With no arguments it starts the server (the most common single-binary use).
 */

async function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];

  if (!cmd || cmd === "serve") {
    // Importing the server module starts it (default export is the Bun server config).
    const mod = await import("./server.js");
    const cfg = (mod.default ?? {}) as { port?: number; fetch?: (req: any) => any };
    if (cfg.fetch) {
      const port = cfg.port ?? 8787;
      if (typeof Bun !== "undefined") {
        // Run with Bun's built-in fast HTTP server
        // @ts-ignore
        const { serve } = await import("bun");
        serve({ port, fetch: cfg.fetch });
      } else {
        // Run with Hono's Node.js server wrapper
        // @ts-ignore
        const { serve } = await import("@hono/node-server");
        serve({ port, fetch: cfg.fetch });
      }
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
