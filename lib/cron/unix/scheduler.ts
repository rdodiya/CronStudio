import { Cron } from 'croner';
import { UnixSchedule } from '../types';
import { validateUnix } from './validator';

export function unixDayMatches(
  s: UnixSchedule,
  y: number,
  m: number, // 1-12
  d: number // 1-31
): boolean {
  if (!s.months.includes(m)) {
    return false;
  }

  // Verify that the calendar date actually exists (e.g. leap year check for Feb 29)
  const date = new Date(Date.UTC(y, m - 1, d));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return false;
  }

  const dow = date.getUTCDay(); // 0 = Sunday ... 6 = Saturday
  const domMatch = s.doms.includes(d);
  const dowMatch = s.dows.includes(dow);

  // Standard Unix OR-semantics when both day-of-month and day-of-week are restricted
  if (s.domRestricted && s.dowRestricted) {
    return domMatch || dowMatch;
  }

  return domMatch && dowMatch;
}

export function unixNextRuns(
  s: UnixSchedule,
  o: {
    tz: string;
    from: Date;
    count: number;
    until?: Date;
  }
): Date[] {
  if (o.count <= 0) {
    return [];
  }

  // If validation fails (e.g. impossible month/dom combinations like 31 Feb),
  // return immediately to avoid long searches.
  const issues = validateUnix(s);
  if (issues.some((i) => i.severity === 'error')) {
    return [];
  }

  const eightYearsMs = 8 * 365.25 * 24 * 60 * 60 * 1000;
  const maxTimestamp = o.until
    ? Math.min(o.until.getTime(), o.from.getTime() + eightYearsMs)
    : o.from.getTime() + eightYearsMs;

  try {
    const job = new Cron(s.raw, { timezone: o.tz });
    const runs = job.nextRuns(o.count, o.from);

    return runs.filter((r) => r.getTime() <= maxTimestamp);
  } catch {
    return [];
  }
}
