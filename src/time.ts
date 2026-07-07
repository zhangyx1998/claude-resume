import { exit } from "node:process";
import * as ui from "./ui.js";

/**
 * Parse an "HH:MM" 24-hour string into the next matching Date.
 * If the time has already passed today, the returned Date is tomorrow.
 * Exits the process on an invalid format.
 */
export function parseTargetDate(targetTime: string): Date {
  const match = /^(\d{1,2}):(\d{2})$/.exec(targetTime);
  if (!match) {
    ui.error(`Could not parse time '${targetTime}'. Please use HH:MM 24-hour format.`);
    exit(1);
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    ui.error(`Could not parse time '${targetTime}'. Please use HH:MM 24-hour format.`);
    exit(1);
  }

  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);

  if (target < now) {
    target.setDate(target.getDate() + 1);
  }

  return target;
}
