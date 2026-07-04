#!/usr/bin/env bun
/**
 * Unified TabGhost entrypoint for the compiled binary or runtime execution.
 *
 *   tabghost serve                 start the automation API + dashboard
 *   tabghost <cli command...>      run a CLI command (identities/list/create/…)
 *
 * With no arguments it starts the server (the most common single-binary use).
 */
import { runCLI } from "./cli.js";
import serverConfig from "./server.js";

async function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];

  if (!cmd || cmd === "serve") {
    const cfg = serverConfig as {
      port?: number;
      fetch?: (req: any) => any;
      shutdown?: () => Promise<void>;
      info?: string;
    };

    if (cfg.fetch) {
      const port = cfg.port ?? 8787;

      // Log server status
      if (cfg.info) {
        console.log(cfg.info);
      }

      // Handle termination signals to close active sessions
      if (cfg.shutdown) {
        const shutdownHandler = async () => {
          await cfg.shutdown?.();
          process.exit(0);
        };
        process.on("SIGINT", shutdownHandler);
        process.on("SIGTERM", shutdownHandler);
      }

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
  await runCLI();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
