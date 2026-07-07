import { exit } from "node:process";
import type { Args } from "./types.js";
import { pc } from "./ui.js";
import * as ui from "./ui.js";

/** Parse argv (already sliced past node + script) into structured options. */
export function parseArgs(argv: string[]): Args {
  const args: Args = { compact: false };
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === "--compact") {
      args.compact = true;
    } else if (arg === "--session") {
      args.session = argv[++i];
    } else if (arg === "--prompt") {
      args.prompt = argv[++i] ?? "";
    } else if (arg === "-h" || arg === "--help") {
      printHelp();
      exit(0);
    } else if (arg.startsWith("--")) {
      ui.error(`Unknown option: ${arg}`);
      exit(2);
    } else {
      positional.push(arg);
    }
  }

  args.targetTime = positional[0];
  return args;
}

/** Print CLI usage. */
export function printHelp(): void {
  const bin = pc.cyan("claude-resume");
  console.log(`${pc.bold("Usage:")}
  ${bin} [HH:MM] --session <session-id-or-name> [--prompt "..."] [--compact]
  ${bin}

${pc.bold("Description:")}
  Auto-resume Claude Code after quota reset.

${pc.bold("Options:")}
  --session <id|name>   Session to resume (id may be partial).
  --prompt "..."        Prompt to send on resume; omit to read from stdin.
  --compact             Run /compact before resuming.
  -h, --help            Show this help.

${pc.bold("Examples:")}
  ${bin}
  ${bin} 15:45 --session abc-123 --prompt "Resume the refactor"
`);
}
