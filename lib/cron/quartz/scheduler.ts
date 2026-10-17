import { QuartzSchedule } from '../types';
import { validateQuartz } from './validator';
import { localToUtc } from '../../timezone';

export function quartzDayMatches(
  s: QuartzSchedule,
  y: number,
  m: number, // 1-12
  d: number // 1-31
): boolean {
  if (!s.months.includes(m)) {
    return false;
  }

  if (s.years !== null && !s.years.includes(y)) {
    return false;
  }

  const date = new Date(Date.UTC(y, m - 1, d));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return false;
  }

  const jsDow = date.getUTCDay(); // 0=Sun..6=Sat
  const quartzDow = jsDow + 1; // 1=Sun..7=Sat

  const lastDayOfMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();

  // Day of Month checks
  if (s.dom.type !== 'any') {
    switch (s.dom.type) {
      case 'all':
        break;
      case 'values':
        if (!s.dom.values.includes(d)) {
          return false;
        }
        break;
      case 'last':
        if (d !== lastDayOfMonth) {
          return false;
        }
        break;
      case 'lastOffset':
        if (d !== lastDayOfMonth - s.dom.offset) {
          return false;
        }
        break;
      case 'lastWeekday': {
        let lastWeekday = lastDayOfMonth;
        const lastDayJsDow = new Date(Date.UTC(y, m - 1, lastDayOfMonth)).getUTCDay();
        if (lastDayJsDow === 6) {
          lastWeekday = lastDayOfMonth - 1;
        } else if (lastDayJsDow === 0) {
          lastWeekday = lastDayOfMonth - 2;
        }
        if (d !== lastWeekday) {
          return false;
        }
        break;
      }
      case 'nearestWeekday': {
        const targetDay = s.dom.day;
        const targetDate = new Date(Date.UTC(y, m - 1, targetDay));
        const targetDow = targetDate.getUTCDay();
        let nearestDay = targetDay;
        if (targetDow === 6) {
          // Saturday
          if (targetDay === 1) {
            nearestDay = 3; // jump to Monday (cannot go into previous month)
          } else {
            nearestDay = targetDay - 1; // Friday
          }
        } else if (targetDow === 0) {
          // Sunday
          if (targetDay === lastDayOfMonth) {
            nearestDay = targetDay - 2; // Friday (cannot go into next month)
          } else {
            nearestDay = targetDay + 1; // Monday
          }
        }
        if (d !== nearestDay) {
          return false;
        }
        break;
      }
    }
  }

  // Day of Week checks
  if (s.dow.type !== 'any') {
    switch (s.dow.type) {
      case 'all':
        break;
      case 'values':
        if (!s.dow.values.includes(quartzDow)) {
          return false;
        }
        break;
      case 'lastDay':
        if (quartzDow !== 7) {
          return false;
        }
        break;
      case 'lastDayOfWeek': {
        if (quartzDow !== s.dow.day) {
          return false;
        }
        if (d + 7 <= lastDayOfMonth) {
          return false; // Another occurrence remains in this month
        }
        break;
      }
      case 'nthDayOfWeek': {
        if (quartzDow !== s.dow.day) {
          return false;
        }
        const nth = Math.floor((d - 1) / 7) + 1;
        if (nth !== s.dow.nth) {
          return false;
        }
        break;
      }
    }
  }

  return true;
}

export function quartzNextRuns(
  s: QuartzSchedule,
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

  // If validation fails (impossible dates/months), return immediately
  const issues = validateQuartz(s);
  if (issues.some((i) => i.severity === 'error')) {
    return [];
  }

  const eightYearsMs = 8 * 365.25 * 24 * 60 * 60 * 1000;
  const maxTimestamp = o.until
    ? Math.min(o.until.getTime(), o.from.getTime() + eightYearsMs)
    : o.from.getTime() + eightYearsMs;

  let curYear: number;
  let curMonth: number;
  let curDay: number;

  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: o.tz,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).formatToParts(o.from);

    const yPart = parts.find((p) => p.type === 'year');
    const mPart = parts.find((p) => p.type === 'month');
    const dPart = parts.find((p) => p.type === 'day');

    if (!yPart || !mPart || !dPart) {
      return [];
    }

    curYear = parseInt(yPart.value, 10);
    curMonth = parseInt(mPart.value, 10);
    curDay = parseInt(dPart.value, 10);
  } catch {
    return [];
  }

  const runs: Date[] = [];
  const maxYear = curYear + 8;

  while (runs.length < o.count && curYear <= maxYear && curYear <= 2199) {
    if (quartzDayMatches(s, curYear, curMonth, curDay)) {
      for (const h of s.hours) {
        for (const mi of s.minutes) {
          for (const sec of s.seconds) {
            const utc = localToUtc(curYear, curMonth, curDay, h, mi, sec, o.tz);
            if (!utc) {
              continue; // Drop nonexistent time in DST spring-forward gap
            }
            if (utc.getTime() <= o.from.getTime()) {
              continue;
            }
            if (utc.getTime() > maxTimestamp) {
              return runs;
            }

            // De-duplicate in case of duplicate local representations
            if (runs.length === 0 || runs[runs.length - 1].getTime() !== utc.getTime()) {
              runs.push(utc);
              if (runs.length >= o.count) {
                return runs;
              }
            }
          }
        }
      }
    }

    // Walk forward one calendar day
    const nextDate = new Date(Date.UTC(curYear, curMonth - 1, curDay + 1));
    curYear = nextDate.getUTCFullYear();
    curMonth = nextDate.getUTCMonth() + 1;
    curDay = nextDate.getUTCDate();
  }

  return runs;
}
