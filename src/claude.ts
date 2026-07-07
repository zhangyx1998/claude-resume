import { spawnSync } from "node:child_process";
import { exit } from "node:process";
import type { ClaudeAgent } from "./types.js";
import * as ui from "./ui.js";

/** Run a command, streaming stdin; capture stdout. Exit the process on failure. */
export function runOrExit(command: string, args: string[], cwd?: string): string {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["inherit", "pipe", "pipe"],
  });

  if (result.error?.message.includes("ENOENT")) {
    ui.error(`'${command}' CLI not found in PATH.`);
    exit(1);
  }

  if (result.status !== 0) {
    ui.error(`executing '${command} ${args.join(" ")}':`);
    if (result.stderr) console.error(result.stderr);
    exit(result.status ?? 1);
  }

  return result.stdout;
}

/** Fetch all Claude agents as parsed JSON, exiting on any failure. */
export function fetchAgents(): ClaudeAgent[] {
  const stdout = runOrExit("claude", ["agents", "--json", "--all"]);

  try {
    return JSON.parse(stdout) as ClaudeAgent[];
  } catch {
    ui.error("Failed to parse JSON output from 'claude agents'.");
    exit(1);
  }
}

/** Run `claude --resume <session> /compact` inheriting all stdio. */
export function compactSession(session: string, cwd?: string): void {
  spawnSync("claude", ["--resume", session, "/compact"], {
    cwd,
    stdio: "inherit",
  });
}

/** Run `claude --resume <session> [prompt]` inheriting all stdio. */
export function resumeSession(session: string, prompt: string, cwd?: string): void {
  const resumeArgs = ["--resume", session];
  if (prompt) resumeArgs.push(prompt);

  spawnSync("claude", resumeArgs, {
    cwd,
    stdio: "inherit",
  });
}
