import { spawnSync } from "node:child_process";
import { stdin } from "node:process";

/** Read a prompt from stdin, prompting interactively when attached to a TTY. */
export function readPromptFromStdin(): string {
  if (stdin.isTTY) {
    console.log("\nEnter your prompt (Press Ctrl+D when finished):");
  }

  return spawnSync("cat", {
    encoding: "utf8",
    stdio: ["inherit", "pipe", "inherit"],
  }).stdout.trim();
}
