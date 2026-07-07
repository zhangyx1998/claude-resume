import pc from "picocolors";

/** Re-export picocolors so callers have a single styling entry point. */
export { pc };

/** Print a bold section heading. */
export function heading(text: string): void {
  console.log(pc.bold(pc.cyan(text)));
}

/** Print a dimmed horizontal rule. */
export function rule(width = 60): void {
  console.log(pc.dim("─".repeat(width)));
}

/** Print an informational line. */
export function info(text: string): void {
  console.log(text);
}

/** Print a muted, secondary line. */
export function muted(text: string): void {
  console.log(pc.dim(text));
}

/** Print a yellow warning to stderr. */
export function warn(text: string): void {
  console.error(pc.yellow(`Warning: ${text}`));
}

/** Print a red error to stderr. */
export function error(text: string): void {
  console.error(pc.red(`Error: ${text}`));
}

/** Print a green success line. */
export function success(text: string): void {
  console.log(pc.green(text));
}
