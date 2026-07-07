import Table from "cli-table3";
import type { ClaudeAgent } from "./types.js";
import { formatWorkspace, humanizeTime } from "./humanize.js";
import { pc } from "./ui.js";

/** Idle, interactive sessions are the only ones worth resuming. */
export function idleInteractiveSessions(
  sessions: ClaudeAgent[],
): ClaudeAgent[] {
  return sessions.filter((s) => s.kind === "interactive");
}

/** Render a colored table of resumable sessions to stdout. */
export function printSessionsTable(sessions: ClaudeAgent[]): void {
  const filtered = idleInteractiveSessions(sessions);

  if (filtered.length === 0) {
    console.log(pc.yellow("No idle interactive sessions found."));
    return;
  }

  const table = new Table({
    head: ["SESSION ID", "NAME", "STARTED", "WORKSPACE"].map((h) =>
      pc.bold(pc.cyan(h)),
    ),
    style: { head: [], border: [] },
    chars: {
      mid: "─",
      "left-mid": "├",
      "mid-mid": "┼",
      "right-mid": "┤",
    },
  });

  for (const s of filtered) {
    let name = s.name ?? "Unnamed";
    if (name.length > 24) name = `${name.slice(0, 21)}...`;

    table.push([
      pc.green(s.sessionId ?? "Unknown ID"),
      name,
      pc.dim(humanizeTime(s.startedAt)),
      pc.blue(formatWorkspace(s.cwd)),
    ]);
  }

  console.log(table.toString());
}

/** Locate a session by full/partial id or exact name. */
export function findSession(
  sessionIdOrName: string,
  sessions: ClaudeAgent[],
): ClaudeAgent | undefined {
  return sessions.find((s) => {
    const sessionId = s.sessionId ?? "";
    const name = s.name ?? "Unnamed";
    return sessionId.includes(sessionIdOrName) || sessionIdOrName === name;
  });
}

/** Print a labeled metadata block for a matched session, or a warning if none. */
export function printSessionMetadata(
  sessionIdOrName: string,
  session: ClaudeAgent | undefined,
): void {
  if (!session) {
    console.error(
      pc.yellow(
        `Warning: Session '${sessionIdOrName}' not found in active agents list.`,
      ),
    );
    return;
  }

  const rows: Array<[string, string]> = [
    ["Match", session.sessionId ?? ""],
    ["Name", session.name ?? "Unnamed"],
    ["Start", humanizeTime(session.startedAt)],
    ["Space", formatWorkspace(session.cwd)],
  ];

  for (const [label, value] of rows) {
    console.log(`${pc.dim(label.padEnd(5))} ${value}`);
  }
}
