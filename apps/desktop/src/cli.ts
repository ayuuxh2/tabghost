#!/usr/bin/env bun
import {
  SessionManager,
  listIdentityPresets,
} from "@tabghost/session-core";

/**
 * TabGhost CLI — thin wrapper over SessionManager for local operators.
 *
 *   tabghost identities
 *   tabghost list
 *   tabghost create <label> <identityId> [--workspace w] [--proxy server] [--headed]
 *   tabghost clone <id> [label]
 *   tabghost delete <id>
 *   tabghost open <id> [url]        launch a session and keep it live
 *   tabghost sessions
 */

const ROOT = process.env.TABGHOST_HOME ?? `${process.env.HOME ?? "."}/.tabghost`;
const manager = new SessionManager(ROOT);

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
function has(flag: string): boolean {
  return process.argv.includes(flag);
}

async function main() {
  const [cmd, a, b] = process.argv.slice(2);

  switch (cmd) {
    case "identities": {
      for (const p of listIdentityPresets()) console.log(`${p.id}\t${p.label}`);
      break;
    }
    case "list": {
      const profiles = await manager.listSubProfiles();
      if (!profiles.length) return console.log("(no sub-profiles)");
      for (const p of profiles) {
        console.log(`${p.id}\t${p.workspace}\t${p.label}\t[${p.identityId}]${p.proxy ? " proxy" : ""}`);
      }
      break;
    }
    case "create": {
      if (!a || !b) return console.error("usage: tabghost create <label> <identityId>");
      const proxy = arg("--proxy");
      const p = await manager.createSubProfile({
        label: a,
        identityId: b,
        workspace: arg("--workspace") ?? "default",
        headless: !has("--headed"),
        proxy: proxy ? { server: proxy } : undefined,
      });
      console.log(`created ${p.id}`);
      break;
    }
    case "clone": {
      if (!a) return console.error("usage: tabghost clone <id> [label]");
      const p = await manager.cloneSubProfile(a, b);
      console.log(`cloned -> ${p.id}`);
      break;
    }
    case "delete": {
      if (!a) return console.error("usage: tabghost delete <id>");
      console.log((await manager.deleteSubProfile(a)) ? "deleted" : "not found");
      break;
    }
    case "sessions": {
      const s = manager.listSessions();
      if (!s.length) return console.log("(no live sessions)");
      for (const x of s) console.log(`${x.id}\t${x.subProfileId}\t${x.status}\tpages=${x.pages}`);
      break;
    }
    case "open": {
      if (!a) return console.error("usage: tabghost open <id> [url]");
      const s = await manager.spawnSession({ subProfileId: a, startUrl: b, headless: false });
      console.log(`session ${s.id} live (ctrl-c to close)`);
      await new Promise<void>((resolve) => {
        process.on("SIGINT", async () => {
          await manager.closeSession(s.id);
          resolve();
        });
      });
      break;
    }
    default:
      console.log(
        [
          "tabghost <command>",
          "  identities                     list identity presets",
          "  list                           list sub-profiles",
          "  create <label> <identityId>    create a sub-profile",
          "  clone <id> [label]             clone a sub-profile",
          "  delete <id>                    delete a sub-profile",
          "  sessions                       list live sessions",
          "  open <id> [url]                launch a live (headed) session",
        ].join("\n"),
      );
  }
  process.exit(0);
}

export async function runCLI() {
  await main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

const isMain = process.argv[1] && (
  process.argv[1].endsWith("cli.ts") || 
  process.argv[1].endsWith("cli.js") ||
  process.argv[1].endsWith("cli.cjs")
);
if (isMain) {
  runCLI();
}
