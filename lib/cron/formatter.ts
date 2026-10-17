import { Schedule, Dialect, UnixSchedule, QuartzSchedule } from './types';
import { QUARTZ_SYMBOL_HELP, QUARTZ_DOW_NAMES } from './quartz/symbols';

export interface ExplanationField {
  name: string;
  raw: string;
  text: string;
}

export interface Explanation {
  summary: string;
  fields: ExplanationField[];
  notes: string[];
}

const MONTH_NAMES = [
  '',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const UNIX_DOW_NAMES: Record<number, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function describeUnixField(index: number, raw: string): string {
  switch (index) {
    case 0: // Minute
      if (raw === '*') return 'Every minute';
      if (raw.startsWith('*/')) return `Every ${raw.slice(2)} minutes`;
      return `At minute ${raw}`;
    case 1: // Hour
      if (raw === '*') return 'Every hour';
      if (raw.startsWith('*/')) return `Every ${raw.slice(2)} hours`;
      if (raw.includes('-')) {
        const [start, end] = raw.split('-');
        return `Between ${pad(Number(start))}:00 and ${pad(Number(end))}:59`;
      }
      return `At ${pad(Number(raw))}:00`;
    case 2: // Day of Month
      if (raw === '*') return 'Every day of the month';
      return `On day ${raw} of the month`;
    case 3: // Month
      if (raw === '*') return 'Every month';
      return `In ${raw
        .split(',')
        .map((m) => MONTH_NAMES[Number(m)] || m)
        .join(', ')}`;
    case 4: // Day of Week
      if (raw === '*') return 'Every day of the week';
      if (raw === '1-5') return 'Monday through Friday';
      if (raw === '0,6' || raw === '6,0') return 'Saturday and Sunday';
      return raw
        .split(',')
        .map((d) => UNIX_DOW_NAMES[Number(d)] || d)
        .join(', ');
    default:
      return raw;
  }
}

function describeQuartzField(index: number, raw: string): string {
  switch (index) {
    case 0: // Second
      if (raw === '0') return 'At second 0';
      if (raw === '*') return 'Every second';
      if (raw.startsWith('*/')) return `Every ${raw.slice(2)} seconds`;
      return `At second ${raw}`;
    case 1: // Minute
      if (raw === '0') return 'At minute 0';
      if (raw === '*') return 'Every minute';
      if (raw.startsWith('*/')) return `Every ${raw.slice(2)} minutes`;
      return `At minute ${raw}`;
    case 2: // Hour
      if (raw === '*') return 'Every hour';
      if (raw.startsWith('*/')) return `Every ${raw.slice(2)} hours`;
      if (raw.includes('-')) {
        const [start, end] = raw.split('-');
        return `Between ${pad(Number(start))}:00 and ${pad(Number(end))}:59`;
      }
      return `At ${pad(Number(raw))}:00`;
    case 3: // Day of Month
      if (raw === '?') return 'No specific day of month';
      if (raw === '*') return 'Every day of month';
      if (raw === 'L') return 'Last day of the month';
      if (raw === 'LW') return 'Last weekday of the month';
      if (raw.endsWith('W')) return `Nearest weekday to day ${raw.slice(0, -1)}`;
      return `On day ${raw} of the month`;
    case 4: // Month
      if (raw === '*') return 'Every month';
      return `In ${raw
        .split(',')
        .map((m) => MONTH_NAMES[Number(m)] || m)
        .join(', ')}`;
    case 5: // Day of Week
      if (raw === '?') return 'No specific day of week';
      if (raw === '*') return 'Every day of the week';
      if (raw === '2-6') return 'Monday through Friday';
      if (raw.endsWith('L')) {
        const day = raw.slice(0, -1);
        return `Last ${QUARTZ_DOW_NAMES[Number(day)] || day} of the month`;
      }
      if (raw.includes('#')) {
        const [day, nth] = raw.split('#');
        return `${nth}${
          nth === '1' ? 'st' : nth === '2' ? 'nd' : nth === '3' ? 'rd' : 'th'
        } ${QUARTZ_DOW_NAMES[Number(day)] || day} of the month`;
      }
      return raw
        .split(',')
        .map((d) => QUARTZ_DOW_NAMES[Number(d)] || d)
        .join(', ');
    case 6: // Year
      if (raw === '*') return 'Every year';
      return `In year ${raw}`;
    default:
      return raw;
  }
}

function explainUnix(s: UnixSchedule): Explanation {
  const tokens = s.raw.trim().split(/\s+/);
  const fieldNames = [
    'Minute',
    'Hour',
    'Day of Month',
    'Month',
    'Day of Week',
  ];

  const fields: ExplanationField[] = fieldNames.map((name, i) => {
    const raw = tokens[i] || '*';
    return {
      name,
      raw,
      text: describeUnixField(i, raw),
    };
  });

  const [minRaw, hourRaw, domRaw, monRaw, dowRaw] = tokens;
  let summary = '';

  // Common pattern: At HH:mm, Monday through Friday
  if (
    /^\d+$/.test(minRaw) &&
    /^\d+$/.test(hourRaw) &&
    domRaw === '*' &&
    monRaw === '*' &&
    dowRaw === '1-5'
  ) {
    summary = `At ${pad(Number(hourRaw))}:${pad(
      Number(minRaw)
    )}, Monday through Friday`;
  }
  // Common pattern: Every N minutes between H1 and H2
  else if (
    minRaw.startsWith('*/') &&
    hourRaw.includes('-') &&
    domRaw === '*' &&
    monRaw === '*' &&
    dowRaw === '*'
  ) {
    const step = minRaw.slice(2);
    const [startH, endH] = hourRaw.split('-');
    summary = `Every ${step} minutes, between ${pad(Number(startH))}:00 and ${pad(
      Number(endH)
    )}:59`;
  }
  // Common pattern: At 00:00 on day 1 of the month
  else if (
    /^\d+$/.test(minRaw) &&
    /^\d+$/.test(hourRaw) &&
    /^\d+$/.test(domRaw) &&
    monRaw === '*' &&
    dowRaw === '*'
  ) {
    summary = `At ${pad(Number(hourRaw))}:${pad(
      Number(minRaw)
    )}, on day ${domRaw} of the month`;
  } else {
    // General fallback
    const parts: string[] = [];
    if (/^\d+$/.test(minRaw) && /^\d+$/.test(hourRaw)) {
      parts.push(`At ${pad(Number(hourRaw))}:${pad(Number(minRaw))}`);
    } else {
      if (minRaw.startsWith('*/')) {
        parts.push(`Every ${minRaw.slice(2)} minutes`);
      } else if (minRaw === '*') {
        parts.push('Every minute');
      } else {
        parts.push(`At minute ${minRaw}`);
      }
      if (hourRaw !== '*') {
        parts.push(describeUnixField(1, hourRaw));
      }
    }

    if (domRaw !== '*') {
      parts.push(describeUnixField(2, domRaw));
    }
    if (monRaw !== '*') {
      parts.push(describeUnixField(3, monRaw));
    }
    if (dowRaw !== '*') {
      parts.push(describeUnixField(4, dowRaw));
    }

    summary = parts.join(', ');
  }

  return {
    summary,
    fields,
    notes: [],
  };
}

function explainQuartz(s: QuartzSchedule, dialect: Dialect): Explanation {
  const tokens = s.raw.trim().split(/\s+/);
  const fieldNames = [
    'Second',
    'Minute',
    'Hour',
    'Day of Month',
    'Month',
    'Day of Week',
  ];
  if (tokens.length >= 7) {
    fieldNames.push('Year');
  }

  const fields: ExplanationField[] = fieldNames.map((name, i) => {
    const raw = tokens[i] || '*';
    return {
      name,
      raw,
      text: describeQuartzField(i, raw),
    };
  });

  const notes: string[] = [];
  if (dialect === 'quartz') {
    notes.push('Quartz weekday numbering starts at 1 = Sunday through 7 = Saturday.');
  }

  if (s.raw.includes('?')) notes.push(QUARTZ_SYMBOL_HELP['?']);
  if (s.raw.includes('L')) notes.push(QUARTZ_SYMBOL_HELP['L']);
  if (s.raw.includes('W')) notes.push(QUARTZ_SYMBOL_HELP['W']);
  if (s.raw.includes('#')) notes.push(QUARTZ_SYMBOL_HELP['#']);

  if (s.seconds.length > 1 || (s.seconds.length === 1 && s.seconds[0] !== 0)) {
    notes.push('Schedule specifies second-level precision.');
  }
  if (tokens.length >= 7 && tokens[6] !== '*' && tokens[6] !== '?') {
    notes.push('Schedule is constrained to specific year range.');
  }

  const [secRaw, minRaw, hourRaw, domRaw, monRaw, dowRaw] = tokens;
  const parts: string[] = [];

  if (secRaw !== '0') {
    if (secRaw.startsWith('*/')) {
      parts.push(`Every ${secRaw.slice(2)} seconds`);
    } else {
      parts.push(`At second ${secRaw}`);
    }
  }

  if (/^\d+$/.test(minRaw) && /^\d+$/.test(hourRaw)) {
    parts.push(`At ${pad(Number(hourRaw))}:${pad(Number(minRaw))}`);
  } else {
    if (minRaw.startsWith('*/')) {
      parts.push(`Every ${minRaw.slice(2)} minutes`);
    } else if (minRaw !== '0') {
      parts.push(`At minute ${minRaw}`);
    }
    if (hourRaw !== '*') {
      parts.push(describeQuartzField(2, hourRaw));
    }
  }

  if (domRaw !== '?' && domRaw !== '*') {
    parts.push(describeQuartzField(3, domRaw));
  }
  if (monRaw !== '*') {
    parts.push(describeQuartzField(4, monRaw));
  }
  if (dowRaw !== '?' && dowRaw !== '*') {
    parts.push(describeQuartzField(5, dowRaw));
  }
  if (tokens[6] && tokens[6] !== '*' && tokens[6] !== '?') {
    parts.push(`in year ${tokens[6]}`);
  }

  const summary = parts.length > 0 ? parts.join(', ') : 'Every minute';

  return {
    summary,
    fields,
    notes,
  };
}

export function explain(
  s: Schedule,
  dialect: Dialect,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  tz: string
): Explanation {
  if (s.kind === 'rate') {
    const unitText = s.every === 1 ? s.unit : `${s.unit}s`;
    const summary = `Every ${s.every} ${unitText}`;
    return {
      summary,
      fields: [
        {
          name: 'Rate',
          raw: s.raw,
          text: summary,
        },
      ],
      notes: ['AWS EventBridge rate expression.'],
    };
  }

  if (s.kind === 'unix') {
    return explainUnix(s);
  }

  return explainQuartz(s, dialect);
}
