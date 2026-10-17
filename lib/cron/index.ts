import { Dialect, Schedule, ParseResult } from './types';
import { DIALECTS } from './dialects';
import { parseUnix } from './unix/parser';
import { parseQuartz } from './quartz/parser';
import { parseEventBridge } from './eventbridge/parser';
import { unixNextRuns, unixDayMatches } from './unix/scheduler';
import { quartzNextRuns, quartzDayMatches } from './quartz/scheduler';
import { rateNextRuns } from './eventbridge/rate';

export * from './types';
export * from './dialects';
export * from './compatibility';
export * from './formatter';
export * from './safety';

export function parse(expr: string, dialect: Dialect): ParseResult {
  const meta = DIALECTS[dialect];
  if (!meta) {
    return {
      ok: false,
      issues: [
        {
          field: 'expression',
          message: `Unknown dialect: ${dialect}`,
          severity: 'error',
        },
      ],
    };
  }

  switch (meta.family) {
    case 'unix':
      return parseUnix(expr);
    case 'quartz':
      return parseQuartz(expr);
    case 'eventbridge':
      return parseEventBridge(expr);
  }
}

export function nextRuns(
  s: Schedule,
  o: {
    tz: string;
    from: Date;
    count: number;
    until?: Date;
  }
): Date[] {
  switch (s.kind) {
    case 'unix':
      return unixNextRuns(s, o);
    case 'quartz':
      return quartzNextRuns(s, o);
    case 'rate':
      return rateNextRuns(s, { from: o.from, count: o.count, until: o.until });
  }
}

export function dayMatches(
  s: Schedule,
  y: number,
  m: number,
  d: number
): boolean {
  switch (s.kind) {
    case 'unix':
      return unixDayMatches(s, y, m, d);
    case 'quartz':
      return quartzDayMatches(s, y, m, d);
    case 'rate':
      return true;
  }
}

export function timeSets(s: Schedule): {
  seconds: number[];
  minutes: number[];
  hours: number[];
} {
  switch (s.kind) {
    case 'unix':
      return {
        seconds: [0],
        minutes: s.minutes,
        hours: s.hours,
      };
    case 'quartz':
      return {
        seconds: s.seconds,
        minutes: s.minutes,
        hours: s.hours,
      };
    case 'rate':
      return {
        seconds: [0],
        minutes: [],
        hours: [],
      };
  }
}

export function frequency(
  s: Schedule,
  tz: string,
  from: Date
): {
  perDay: number;
  perWeek: number;
  perMonth: number;
  perYear: number;
  matchingDays: number;
} {
  if (s.kind === 'rate') {
    let intervalMinutes = s.every;
    if (s.unit === 'hour') intervalMinutes = s.every * 60;
    if (s.unit === 'day') intervalMinutes = s.every * 1440;

    const perYear = intervalMinutes > 0 ? 525600 / intervalMinutes : 0;
    return {
      perDay: perYear / 365,
      perWeek: perYear / 52.1429,
      perMonth: perYear / 12,
      perYear,
      matchingDays: 365,
    };
  }

  let y: number;
  let m: number;
  let d: number;

  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).formatToParts(from);

    const yPart = parts.find((p) => p.type === 'year');
    const mPart = parts.find((p) => p.type === 'month');
    const dPart = parts.find((p) => p.type === 'day');

    y = yPart ? parseInt(yPart.value, 10) : from.getUTCFullYear();
    m = mPart ? parseInt(mPart.value, 10) : from.getUTCMonth() + 1;
    d = dPart ? parseInt(dPart.value, 10) : from.getUTCDate();
  } catch {
    y = from.getUTCFullYear();
    m = from.getUTCMonth() + 1;
    d = from.getUTCDate();
  }

  let matchingDays = 0;
  for (let i = 0; i < 365; i++) {
    if (dayMatches(s, y, m, d)) {
      matchingDays++;
    }
    const nextDate = new Date(Date.UTC(y, m - 1, d + 1));
    y = nextDate.getUTCFullYear();
    m = nextDate.getUTCMonth() + 1;
    d = nextDate.getUTCDate();
  }

  const ts = timeSets(s);
  const runsPerMatchingDay =
    ts.seconds.length * ts.minutes.length * ts.hours.length;
  const perYear = matchingDays * runsPerMatchingDay;

  return {
    perDay: perYear / 365,
    perWeek: perYear / 52.1429,
    perMonth: perYear / 12,
    perYear,
    matchingDays,
  };
}
