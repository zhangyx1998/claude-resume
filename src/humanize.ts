import { homedir } from "node:os";

/** Render a duration in seconds compactly (e.g. "1h 5m", "30.76s"). */
export function humanizeDuration(inputSeconds: number): string {
  if (inputSeconds === 0) return "now";

  const isNegative = inputSeconds < 0;
  let seconds = Math.abs(inputSeconds);

  const units: Array<[string, number]> = [
    ["y", 365 * 24 * 3600],
    ["d", 24 * 3600],
    ["h", 3600],
    ["m", 60],
    ["s", 1],
  ];

  const values: Record<string, number> = {};

  for (const [name, unitSeconds] of units) {
    if (name === "s") {
      values[name] = Number.isInteger(seconds)
        ? seconds
        : Math.round(seconds * 100) / 100;
    } else {
      values[name] = Math.floor(seconds / unitSeconds);
      seconds = seconds % unitSeconds;
    }
  }

  // Seconds are noise once we're measuring in hours or larger.
  if (values.y > 0 || values.d > 0 || values.h > 0) values.s = 0;

  const parts = units
    .filter(([name]) => values[name] > 0)
    .map(([name]) => `${values[name]}${name}`);

  if (parts.length === 0) return "now";

  const result = parts.join(" ");
  return isNegative ? `-${result}` : result;
}

/** Render a timestamp (seconds or milliseconds) as a relative phrase like "5 minutes ago". */
export function humanizeTime(timestamp: unknown): string {
  if (!timestamp) return "Unknown";

  const raw = Number(timestamp);
  if (Number.isNaN(raw)) return "Unknown";

  let ts = raw;
  if (ts > 2e9) ts /= 1000;

  const seconds = Date.now() / 1000 - ts;
  if (seconds <= 0) return "Just now";

  return `${humanizeDuration(seconds)} ago`;
}

/** Collapse the user's home directory in a path to "~". */
export function formatWorkspace(cwd?: string): string {
  if (!cwd) return "Unknown";

  const home = homedir();
  return cwd.startsWith(home) ? cwd.replace(home, "~") : cwd;
}
