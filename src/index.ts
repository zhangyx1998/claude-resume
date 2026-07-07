/* ---------------------------------------------------------
 * Copyright (c) 2026-present Yuxuan Zhang, web-dev@z-yx.cc
 * This source code is licensed under the MIT license.
 * You may find the full license in project root directory.
 * ------------------------------------------------------ */
import { existsSync } from "node:fs";
import { argv, exit } from "node:process";
import { parseArgs } from "./args.js";
import {
  compactSession,
  fetchAgents,
  resumeSession,
} from "./claude.js";
import { humanizeDuration } from "./humanize.js";
import {
  findSession,
  printSessionMetadata,
  printSessionsTable,
} from "./sessions.js";
import { sleepWithCaffeinate } from "./sleep.js";
import { readPromptFromStdin } from "./stdin.js";
import { parseTargetDate } from "./time.js";
import * as ui from "./ui.js";
import { pc } from "./ui.js";

async function main(): Promise<void> {
  const args = parseArgs(argv.slice(2));

  const sessions = fetchAgents();

  // No target session: just list what's resumable and bail out.
  if (!args.session) {
    ui.rule();
    printSessionsTable(sessions);
    ui.rule();
    console.log(`\n${pc.bold("To resume a session, run:")}`);
    ui.muted(`  claude-resume HH:MM --session <session-id>`);
    exit(0);
  }

  if (!args.targetTime) {
    ui.error(
      "The 'target_time' argument HH:MM is required when resuming a --session.",
    );
    exit(2);
  }

  ui.rule();
  ui.heading("Target Session Metadata:\n");

  const session = findSession(args.session, sessions);
  printSessionMetadata(args.session, session);
  ui.rule();

  let targetCwd = session?.cwd;
  if (targetCwd && !existsSync(targetCwd)) {
    ui.warn(
      `Session workspace '${targetCwd}' does not exist. Using current directory.\n`,
    );
    targetCwd = undefined;
  }

  const promptText =
    args.prompt !== undefined ? args.prompt : readPromptFromStdin();

  const targetDate = parseTargetDate(args.targetTime);
  const sleepSeconds =
    Math.round(((targetDate.getTime() - Date.now()) / 1000 + 60) * 100) / 100;

  console.log(`\n${pc.dim("═".repeat(60))}`);
  ui.heading("Final Prompt Confirmation:");

  if (promptText) {
    console.log(pc.green(`"${promptText}"`));
  } else {
    ui.muted(
      '"(No prompt provided, will resume session exactly where it left off)"',
    );
  }

  console.log(pc.dim("═".repeat(60)));

  console.log(`\nTarget API reset time: ${pc.bold(args.targetTime)}`);
  console.log(
    `Sleeping for ${pc.bold(humanizeDuration(sleepSeconds))} (includes 1-minute buffer).`,
  );

  if (args.compact) {
    ui.muted("Session will be compacted prior to resuming.");
  }

  ui.muted("Your machine will be kept awake for this duration...\n");

  await sleepWithCaffeinate(sleepSeconds);

  ui.success("\nWaking up!");

  if (args.compact) {
    ui.muted("Compacting session context...");
    compactSession(args.session, targetCwd);
  }

  console.log(`Resuming session '${pc.bold(args.session)}'...`);
  resumeSession(args.session, promptText, targetCwd);
}

main().catch((err) => {
  ui.error(err instanceof Error ? err.message : String(err));
  exit(1);
});
