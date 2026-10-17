import { Issue, UnixSchedule } from '../types';

const MAX_DAYS_IN_MONTH: Record<number, number> = {
  1: 31,
  2: 29, // Leap year max
  3: 31,
  4: 30,
  5: 31,
  6: 30,
  7: 31,
  8: 31,
  9: 30,
  10: 31,
  11: 30,
  12: 31,
};

export function validateUnix(s: UnixSchedule): Issue[] {
  const issues: Issue[] = [];

  if (
    !s.minutes?.length ||
    !s.hours?.length ||
    !s.doms?.length ||
    !s.months?.length ||
    !s.dows?.length
  ) {
    issues.push({
      field: 'expression',
      message: 'Schedule contains empty field selections',
      severity: 'error',
    });
    return issues;
  }

  // Check if any (month, dom) pair can ever exist
  let hasValidDomMonthPair = false;
  for (const m of s.months) {
    const maxDay = MAX_DAYS_IN_MONTH[m] ?? 31;
    for (const d of s.doms) {
      if (d <= maxDay) {
        hasValidDomMonthPair = true;
        break;
      }
    }
    if (hasValidDomMonthPair) {
      break;
    }
  }

  if (!hasValidDomMonthPair) {
    issues.push({
      field: 'dayOfMonth',
      message: 'Day of month never matches in the selected months (e.g. day 31 in February)',
      severity: 'error',
    });
  }

  return issues;
}
