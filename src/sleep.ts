import { spawn } from "node:child_process";
import { stdout } from "node:process";
import cliProgress from "cli-progress";
import { humanizeDuration } from "./humanize.js";
import { pc } from "./ui.js";

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

/**
 * Keep the machine awake for the lifetime of the returned handle via a background
 * `caffeinate`. Returns a no-op cleanup when `caffeinate` is unavailable — the
 * wait still completes, the machine just isn't prevented from sleeping.
 */
function keepAwake(): () => void {
  const child = spawn("caffeinate", ["-i"], { stdio: "ignore" });
  child.on("error", () => {}); // ENOENT etc. — degrade gracefully.
  return () => child.kill();
}

/** Format the remaining milliseconds as a compact, always-positive duration. */
function remainingLabel(remainingMs: number): string {
  if (remainingMs <= 0) return "0s";
  return humanizeDuration(Math.max(1, Math.ceil(remainingMs / 1000)));
}

/** Render an animated spinner + progress bar until `endAt`, then resolve. */
function renderWait(totalSeconds: number, endAt: number): Promise<void> {
  const totalMs = totalSeconds * 1000;

  // No TTY (piped/CI): a single static line, then a plain timed wait.
  if (!stdout.isTTY) {
    console.log(`Waiting ${humanizeDuration(totalSeconds)}...`);
    return new Promise((resolve) => setTimeout(resolve, totalMs));
  }

  const bar = new cliProgress.SingleBar(
    {
      format: `{spinner} ${pc.cyan("Waiting")} {bar} {percentage}% · {remaining} left`,
      barCompleteChar: "█",
      barIncompleteChar: "░",
      barsize: 30,
      hideCursor: true,
      clearOnComplete: false,
      linewrap: false,
    },
    cliProgress.Presets.shades_classic,
  );

  return new Promise((resolve) => {
    let frame = 0;
    bar.start(totalSeconds, 0, {
      spinner: pc.cyan(SPINNER_FRAMES[0]),
      remaining: remainingLabel(totalMs),
    });

    const timer = setInterval(() => {
      const remainingMs = Math.max(0, endAt - Date.now());
      const elapsed = Math.min(totalSeconds, totalSeconds - remainingMs / 1000);
      frame = (frame + 1) % SPINNER_FRAMES.length;

      if (remainingMs <= 0) {
        clearInterval(timer);
        bar.update(totalSeconds, {
          spinner: pc.green("✓"),
          remaining: "0s",
        });
        bar.stop();
        resolve();
        return;
      }

      bar.update(elapsed, {
        spinner: pc.cyan(SPINNER_FRAMES[frame]),
        remaining: remainingLabel(remainingMs),
      });
    }, 120);
  });
}

/**
 * Wait `seconds` while keeping the machine awake, showing a live spinner and
 * progress bar. Timing is driven by the wall clock, so a brief system sleep
 * self-corrects instead of overshooting.
 */
export async function sleepWithCaffeinate(seconds: number): Promise<void> {
  const endAt = Date.now() + seconds * 1000;
  const stopKeepAwake = keepAwake();
  try {
    await renderWait(seconds, endAt);
  } finally {
    stopKeepAwake();
  }
}
