import { Schedule, Dialect, Issue, ParseResult } from './types';
import { DIALECTS } from './dialects';
import { parse, nextRuns, frequency } from './index';
import { explain, Explanation } from './formatter';
import { compatibility, Badge } from './compatibility';
import { dstWarnings, transitions, Transition } from '../dst';
import { isValidTz } from '../timezone';

export interface Analysis {
  parse: ParseResult;
  runs: Date[];
  explanation: Explanation | null;
  safety: Issue[];
  badges: Badge[];
  frequency: ReturnType<typeof frequency> | null;
  transitions: Transition[];
}

export function safetyChecks(
  s: Schedule,
  dialect: Dialect,
  tz: string,
  runs: Date[],
  now: Date
): Issue[] {
  const issues: Issue[] = [];

  // 1. DOM + DOW both restricted in Unix cron (OR-semantics)
  if (s.kind === 'unix' && s.domRestricted && s.dowRestricted) {
    issues.push({
      field: 'dayOfMonth',
      severity: 'warning',
      message:
        'Both day-of-month and day-of-week are restricted; Unix cron evaluates these with OR logic (runs if either matches).',
    });
  }

  // 2. Schedule never matches
  if (runs.length === 0) {
    issues.push({
      field: 'expression',
      severity: 'error',
      message: 'Schedule never matches any valid execution time within the lookup window.',
    });
  }

  // 3. Interval checks (excessively frequent, frequent, github minimum interval)
  if (runs.length >= 2) {
    let minGapMs = Infinity;
    for (let i = 0; i < runs.length - 1; i++) {
      const gap = runs[i + 1].getTime() - runs[i].getTime();
      if (gap < minGapMs) {
        minGapMs = gap;
      }
    }

    if (minGapMs < 60 * 1000) {
      issues.push({
        field: 'minute',
        severity: 'warning',
        message: 'Schedule is excessively frequent (sub-minute execution).',
      });
    } else if (minGapMs < 5 * 60 * 1000) {
      issues.push({
        field: 'minute',
        severity: 'info',
        message: 'Schedule runs frequently (interval under 5 minutes).',
      });
    }

    if (dialect === 'github' && minGapMs < 5 * 60 * 1000) {
      issues.push({
        field: 'expression',
        severity: 'warning',
        message:
          'GitHub Actions recommends a minimum interval of 5 minutes between scheduled runs to prevent queuing delays.',
      });
    }
  }

  // 4. Dialect is UTC-only but a non-UTC timezone is selected
  const meta = DIALECTS[dialect];
  if (meta?.utcOnly && tz !== 'UTC') {
    issues.push({
      field: 'expression',
      severity: 'warning',
      message: `${meta.label} only executes in UTC; local timezone '${tz}' will not apply when deployed.`,
    });
  }

  // 5. Business hours / weekday / weekend tagging
  if (runs.length > 0) {
    let allBusinessHours = true;
    let allWeekday = true;
    let allWeekend = true;

    for (const r of runs) {
      try {
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          hour: 'numeric',
          weekday: 'short',
          hour12: false,
        }).formatToParts(r);

        const hPart = parts.find((p) => p.type === 'hour');
        const wPart = parts.find((p) => p.type === 'weekday');

        const h = hPart ? parseInt(hPart.value, 10) % 24 : 0;
        const dowStr = wPart ? wPart.value : '';

        const isWkday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(dowStr);
        const isWkend = ['Sat', 'Sun'].includes(dowStr);

        if (!isWkday || h < 9 || h >= 18) {
          allBusinessHours = false;
        }
        if (!isWkday) {
          allWeekday = false;
        }
        if (!isWkend) {
          allWeekend = false;
        }
      } catch {
        allBusinessHours = false;
        allWeekday = false;
        allWeekend = false;
      }
    }

    if (allBusinessHours) {
      issues.push({
        field: 'expression',
        severity: 'info',
        message:
          'All scheduled runs fall within standard business hours (09:00–18:00, Monday through Friday).',
      });
    }

    if (allWeekday) {
      issues.push({
        field: 'expression',
        severity: 'info',
        message: 'Schedule is weekday-only (Monday through Friday).',
      });
    }

    if (allWeekend) {
      issues.push({
        field: 'expression',
        severity: 'info',
        message: 'Schedule is weekend-only (Saturday and Sunday).',
      });
    }
  }

  // 6. DST warnings
  const oneYearLater = new Date(now.getTime() + 365 * 86400 * 1000);
  const dstIssues = dstWarnings(s, tz, now, oneYearLater);
  issues.push(...dstIssues);

  return issues;
}

export function analyze(i: {
  expr: string;
  dialect: Dialect;
  tz: string;
  now: Date;
  runCount: number;
}): Analysis {
  let effectiveTz = i.tz;
  let tzFallbackIssue: Issue | null = null;

  if (!isValidTz(effectiveTz)) {
    effectiveTz = 'UTC';
    tzFallbackIssue = {
      field: 'expression',
      severity: 'info',
      message: `Invalid timezone '${i.tz}', fallback to UTC.`,
    };
  }

  const p = parse(i.expr, i.dialect);
  const badges = compatibility(i.expr, i.dialect);

  if (!p.ok) {
    const safety: Issue[] = [...p.issues];
    if (tzFallbackIssue) {
      safety.unshift(tzFallbackIssue);
    }
    return {
      parse: p,
      runs: [],
      explanation: null,
      safety,
      badges,
      frequency: null,
      transitions: [],
    };
  }

  const s = p.schedule;
  const runs = nextRuns(s, {
    tz: effectiveTz,
    from: i.now,
    count: i.runCount,
  });

  const explanation = explain(s, i.dialect, effectiveTz);
  const safety = safetyChecks(s, i.dialect, effectiveTz, runs, i.now);

  if (tzFallbackIssue) {
    safety.unshift(tzFallbackIssue);
  }

  const freq = frequency(s, effectiveTz, i.now);
  const oneYearLater = new Date(i.now.getTime() + 365 * 86400 * 1000);
  const transitionList = transitions(effectiveTz, i.now, oneYearLater);

  return {
    parse: p,
    runs,
    explanation,
    safety,
    badges,
    frequency: freq,
    transitions: transitionList,
  };
}
