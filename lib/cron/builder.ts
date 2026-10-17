export interface BuilderState {
  frequency: 'minutes' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
  everyN: number;
  minute: number;
  hour: number;
  weekdays: number[];
  dayOfMonth: number;
}

export interface Preset {
  id: string;
  label: string;
  expr: string;
}

export const PRESETS: Preset[] = [
  { id: 'every-5-min', label: 'Every 5 minutes', expr: '*/5 * * * *' },
  {
    id: 'business-hours',
    label: 'Every 15 minutes (business hours)',
    expr: '*/15 9-18 * * *',
  },
  { id: 'hourly', label: 'Every hour', expr: '0 * * * *' },
  { id: 'daily-9am', label: 'Daily at 09:00', expr: '0 9 * * *' },
  { id: 'weekdays-9am', label: 'Weekdays at 09:00', expr: '0 9 * * 1-5' },
  { id: 'weekly-mon-10am', label: 'Weekly (Monday at 10:00)', expr: '0 10 * * 1' },
  { id: 'monthly-1st', label: 'Monthly (1st at midnight)', expr: '0 0 1 * *' },
  { id: 'custom', label: 'Custom', expr: '' },
];

function formatWeekdays(weekdays: number[]): string {
  if (weekdays.length === 0) return '*';
  const sorted = [...weekdays].sort((a, b) => a - b);
  let isContiguous = sorted.length >= 3;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1] !== sorted[i] + 1) {
      isContiguous = false;
      break;
    }
  }

  if (isContiguous) {
    return `${sorted[0]}-${sorted[sorted.length - 1]}`;
  }

  return sorted.join(',');
}

export function builderToExpr(b: BuilderState): string {
  switch (b.frequency) {
    case 'minutes':
      return `*/${b.everyN || 1} * * * *`;
    case 'hourly':
      if (b.everyN > 1) {
        return `${b.minute} */${b.everyN} * * *`;
      }
      return `${b.minute} * * * *`;
    case 'daily':
      return `${b.minute} ${b.hour} * * *`;
    case 'weekly': {
      const dow = formatWeekdays(b.weekdays);
      return `${b.minute} ${b.hour} * * ${dow}`;
    }
    case 'monthly':
      return `${b.minute} ${b.hour} ${b.dayOfMonth || 1} * *`;
    case 'custom':
      return '0 9 * * 1-5';
  }
}

export function exprToBuilder(expr: string): BuilderState | null {
  const trimmed = expr.trim();
  const tokens = trimmed.split(/\s+/);
  if (tokens.length !== 5) {
    return null;
  }

  const [min, hour, dom, mon, dow] = tokens;

  if (mon !== '*') {
    return null;
  }

  // 1. Minutes: */N * * * *
  const minStep = min.match(/^\*\/(\d+)$/);
  if (minStep && hour === '*' && dom === '*' && dow === '*') {
    return {
      frequency: 'minutes',
      everyN: parseInt(minStep[1], 10),
      minute: 0,
      hour: 0,
      weekdays: [],
      dayOfMonth: 1,
    };
  }

  // 2. Hourly: M * * * * OR M */N * * *
  if (/^\d+$/.test(min) && dom === '*' && dow === '*') {
    if (hour === '*') {
      return {
        frequency: 'hourly',
        everyN: 1,
        minute: parseInt(min, 10),
        hour: 0,
        weekdays: [],
        dayOfMonth: 1,
      };
    }
    const hourStep = hour.match(/^\*\/(\d+)$/);
    if (hourStep) {
      return {
        frequency: 'hourly',
        everyN: parseInt(hourStep[1], 10),
        minute: parseInt(min, 10),
        hour: 0,
        weekdays: [],
        dayOfMonth: 1,
      };
    }
  }

  // 3. Daily: M H * * *
  if (/^\d+$/.test(min) && /^\d+$/.test(hour) && dom === '*' && dow === '*') {
    return {
      frequency: 'daily',
      everyN: 1,
      minute: parseInt(min, 10),
      hour: parseInt(hour, 10),
      weekdays: [],
      dayOfMonth: 1,
    };
  }

  // 4. Weekly: M H * * DOW
  if (/^\d+$/.test(min) && /^\d+$/.test(hour) && dom === '*' && dow !== '*') {
    let weekdays: number[] = [];
    if (/^\d+-\d+$/.test(dow)) {
      const [start, end] = dow.split('-').map((n) => parseInt(n, 10));
      weekdays = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    } else if (/^[\d,]+$/.test(dow)) {
      weekdays = dow.split(',').map((n) => parseInt(n, 10));
    } else {
      return null;
    }

    return {
      frequency: 'weekly',
      everyN: 1,
      minute: parseInt(min, 10),
      hour: parseInt(hour, 10),
      weekdays,
      dayOfMonth: 1,
    };
  }

  // 5. Monthly: M H DOM * *
  if (
    /^\d+$/.test(min) &&
    /^\d+$/.test(hour) &&
    /^\d+$/.test(dom) &&
    dow === '*'
  ) {
    return {
      frequency: 'monthly',
      everyN: 1,
      minute: parseInt(min, 10),
      hour: parseInt(hour, 10),
      weekdays: [],
      dayOfMonth: parseInt(dom, 10),
    };
  }

  return null;
}
