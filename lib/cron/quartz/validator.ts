import { Issue, QuartzSchedule } from '../types';

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

export function validateQuartz(s: QuartzSchedule): Issue[] {
  const issues: Issue[] = [];

  if (
    !s.seconds?.length ||
    !s.minutes?.length ||
    !s.hours?.length ||
    !s.months?.length
  ) {
    issues.push({
      field: 'expression',
      message: 'Schedule contains empty field selections',
      severity: 'error',
    });
    return issues;
  }

  // Check if DOM and Month can ever match
  if (s.dom.type === 'values') {
    let hasValidDay = false;
    for (const m of s.months) {
      const maxDay = MAX_DAYS_IN_MONTH[m] ?? 31;
      for (const d of s.dom.values) {
        if (d <= maxDay) {
          hasValidDay = true;
          break;
        }
      }
      if (hasValidDay) {
        break;
      }
    }

    if (!hasValidDay) {
      issues.push({
        field: 'dayOfMonth',
        message: 'Schedule never matches: day of month does not exist in the selected months',
        severity: 'error',
      });
    }
  } else if (s.dom.type === 'nearestWeekday') {
    let hasValidDay = false;
    for (const m of s.months) {
      const maxDay = MAX_DAYS_IN_MONTH[m] ?? 31;
      if (s.dom.day <= maxDay) {
        hasValidDay = true;
        break;
      }
    }
    if (!hasValidDay) {
      issues.push({
        field: 'dayOfMonth',
        message: 'Schedule never matches: day of month does not exist in the selected months',
        severity: 'error',
      });
    }
  }

  if (s.years !== null && s.years.length > 0) {
    const maxYear = Math.max(...s.years);
    if (maxYear < 1970) {
      issues.push({
        field: 'year',
        message: 'Schedule never matches: specified years are in the past',
        severity: 'error',
      });
    }
  }

  return issues;
}
