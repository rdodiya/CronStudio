import {
  DomSpec,
  DowSpec,
  Issue,
  ParseResult,
  QuartzSchedule,
} from '../types';

export type { DomSpec, DowSpec };

const MONTH_NAMES: Record<string, number> = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12,
};

// Quartz uses 1 = SUN ... 7 = SAT
const QUARTZ_DOW_NAMES: Record<string, number> = {
  SUN: 1,
  MON: 2,
  TUE: 3,
  WED: 4,
  THU: 5,
  FRI: 6,
  SAT: 7,
};

interface SimpleFieldConfig {
  name: string;
  min: number;
  max: number;
  validRangeText: string;
  nameMap?: Record<string, number>;
}

function resolveToken(token: string, config: SimpleFieldConfig): number | null {
  const upper = token.toUpperCase();
  if (config.nameMap && upper in config.nameMap) {
    return config.nameMap[upper];
  }
  if (/^\d+$/.test(token)) {
    const num = parseInt(token, 10);
    return num;
  }
  return null;
}

function parseNumberList(
  rawField: string,
  config: SimpleFieldConfig,
  issues: Issue[]
): number[] {
  const parts = rawField.split(',');
  const result: number[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed === '') {
      issues.push({
        field: config.name,
        message: `Empty list element in ${config.name} field`,
        severity: 'error',
      });
      continue;
    }

    if (trimmed === '*' || trimmed === '?') {
      for (let i = config.min; i <= config.max; i++) {
        result.push(i);
      }
      continue;
    }

    if (trimmed.includes('/')) {
      const slashParts = trimmed.split('/');
      if (slashParts.length !== 2) {
        issues.push({
          field: config.name,
          message: `Invalid step expression '${trimmed}' in ${config.name} field`,
          severity: 'error',
        });
        continue;
      }
      const [rangePart, stepPart] = slashParts;
      const step = parseInt(stepPart, 10);
      if (!/^\d+$/.test(stepPart) || isNaN(step) || step <= 0) {
        issues.push({
          field: config.name,
          message: `Step value must be a positive integer in '${trimmed}' in ${config.name} field`,
          severity: 'error',
        });
        continue;
      }

      let start = config.min;
      let end = config.max;

      if (rangePart === '*' || rangePart === '?') {
        start = config.min;
        end = config.max;
      } else if (rangePart.includes('-')) {
        const dashParts = rangePart.split('-');
        if (dashParts.length !== 2) {
          issues.push({
            field: config.name,
            message: `Invalid range expression '${rangePart}' in ${config.name} field`,
            severity: 'error',
          });
          continue;
        }
        const s = resolveToken(dashParts[0], config);
        const e = resolveToken(dashParts[1], config);
        if (s === null || e === null || s < config.min || s > config.max || e < config.min || e > config.max) {
          issues.push({
            field: config.name,
            message: `Range values '${rangePart}' are out of valid range (${config.validRangeText})`,
            severity: 'error',
          });
          continue;
        }
        if (s > e) {
          issues.push({
            field: config.name,
            message: `Range start '${dashParts[0]}' cannot be greater than range end '${dashParts[1]}'`,
            severity: 'error',
          });
          continue;
        }
        start = s;
        end = e;
      } else {
        const s = resolveToken(rangePart, config);
        if (s === null || s < config.min || s > config.max) {
          issues.push({
            field: config.name,
            message: `Value '${rangePart}' is out of valid range (${config.validRangeText})`,
            severity: 'error',
          });
          continue;
        }
        start = s;
        end = config.max;
      }

      for (let i = start; i <= end; i += step) {
        result.push(i);
      }
      continue;
    }

    if (trimmed.includes('-')) {
      const dashParts = trimmed.split('-');
      if (dashParts.length !== 2) {
        issues.push({
          field: config.name,
          message: `Invalid range expression '${trimmed}' in ${config.name} field`,
          severity: 'error',
        });
        continue;
      }
      const s = resolveToken(dashParts[0], config);
      const e = resolveToken(dashParts[1], config);
      if (s === null || e === null || s < config.min || s > config.max || e < config.min || e > config.max) {
        issues.push({
          field: config.name,
          message: `Range values '${trimmed}' are out of valid range (${config.validRangeText})`,
          severity: 'error',
        });
        continue;
      }
      if (s > e) {
        issues.push({
          field: config.name,
          message: `Range start '${dashParts[0]}' cannot be greater than range end '${dashParts[1]}'`,
          severity: 'error',
        });
        continue;
      }
      for (let i = s; i <= e; i++) {
        result.push(i);
      }
      continue;
    }

    const val = resolveToken(trimmed, config);
    if (val === null || val < config.min || val > config.max) {
      issues.push({
        field: config.name,
        message: `Invalid value '${trimmed}' for ${config.name} field (valid: ${config.validRangeText})`,
        severity: 'error',
      });
      continue;
    }
    result.push(val);
  }

  return Array.from(new Set(result)).sort((a, b) => a - b);
}

function parseDomSpec(raw: string, issues: Issue[]): DomSpec {
  const upper = raw.toUpperCase().trim();

  if (upper === '?') {
    return { type: 'any' };
  }
  if (upper === '*') {
    return { type: 'all' };
  }
  if (upper === 'L') {
    return { type: 'last' };
  }
  if (upper === 'LW') {
    return { type: 'lastWeekday' };
  }

  // L-n
  if (/^L-\d+$/.test(upper)) {
    const offset = parseInt(upper.slice(2), 10);
    if (offset < 1 || offset > 31) {
      issues.push({
        field: 'dayOfMonth',
        message: `Offset in 'L-${offset}' must be between 1 and 31`,
        severity: 'error',
      });
      return { type: 'lastOffset', offset };
    }
    return { type: 'lastOffset', offset };
  }

  // nW
  if (/^\d+W$/.test(upper)) {
    const day = parseInt(upper.slice(0, -1), 10);
    if (day < 1 || day > 31) {
      issues.push({
        field: 'dayOfMonth',
        message: `Day in '${upper}' must be between 1 and 31`,
        severity: 'error',
      });
      return { type: 'nearestWeekday', day };
    }
    return { type: 'nearestWeekday', day };
  }

  if (upper.includes('L') || upper.includes('W')) {
    issues.push({
      field: 'dayOfMonth',
      message: `Invalid Day-of-Month expression '${raw}'`,
      severity: 'error',
    });
    return { type: 'any' };
  }

  const values = parseNumberList(
    raw,
    {
      name: 'dayOfMonth',
      min: 1,
      max: 31,
      validRangeText: '1-31, ?, L, LW, nW, L-n',
    },
    issues
  );

  return { type: 'values', values };
}

function parseDowSpec(raw: string, issues: Issue[]): DowSpec {
  const upper = raw.toUpperCase().trim();

  if (upper === '?') {
    return { type: 'any' };
  }
  if (upper === '*') {
    return { type: 'all' };
  }
  if (upper === 'L') {
    return { type: 'lastDay' };
  }

  // nL (e.g. 6L = last Friday)
  const lastMatch = upper.match(/^([1-7]|SUN|MON|TUE|WED|THU|FRI|SAT)L$/);
  if (lastMatch) {
    const token = lastMatch[1];
    const day = QUARTZ_DOW_NAMES[token] ?? parseInt(token, 10);
    if (day < 1 || day > 7) {
      issues.push({
        field: 'dayOfWeek',
        message: `Invalid day of week '${token}' in '${upper}' (valid: 1-7 or SUN-SAT)`,
        severity: 'error',
      });
      return { type: 'lastDayOfWeek', day: 1 };
    }
    return { type: 'lastDayOfWeek', day };
  }

  // n#m (e.g. 6#3 = 3rd Friday)
  const nthMatch = upper.match(/^([1-7]|SUN|MON|TUE|WED|THU|FRI|SAT)#(\d+)$/);
  if (nthMatch) {
    const token = nthMatch[1];
    const nth = parseInt(nthMatch[2], 10);
    const day = QUARTZ_DOW_NAMES[token] ?? parseInt(token, 10);

    if (day < 1 || day > 7) {
      issues.push({
        field: 'dayOfWeek',
        message: `Invalid day of week '${token}' in '${upper}' (valid: 1-7 or SUN-SAT)`,
        severity: 'error',
      });
    }

    if (nth < 1 || nth > 5) {
      issues.push({
        field: 'dayOfWeek',
        message: `Occurrence in '${upper}' must be between 1 and 5 (got ${nth})`,
        severity: 'error',
      });
    }

    return { type: 'nthDayOfWeek', day, nth };
  }

  if (upper.includes('#') || (upper.includes('L') && upper.length > 1 && !upper.endsWith('L'))) {
    issues.push({
      field: 'dayOfWeek',
      message: `Invalid Day-of-Week expression '${raw}'`,
      severity: 'error',
    });
    return { type: 'any' };
  }

  const values = parseNumberList(
    raw,
    {
      name: 'dayOfWeek',
      min: 1,
      max: 7,
      validRangeText: '1-7 or SUN-SAT (1 = SUN), ?, L, nL, n#m',
      nameMap: QUARTZ_DOW_NAMES,
    },
    issues
  );

  return { type: 'values', values };
}

export function parseQuartz(expr: string): ParseResult {
  const issues: Issue[] = [];

  if (typeof expr !== 'string') {
    return {
      ok: false,
      issues: [
        {
          field: 'expression',
          message: 'Cron expression must be a string',
          severity: 'error',
        },
      ],
    };
  }

  const trimmed = expr.trim();
  if (trimmed.length === 0) {
    return {
      ok: false,
      issues: [
        {
          field: 'expression',
          message: 'Cron expression cannot be empty',
          severity: 'error',
        },
      ],
    };
  }

  if (trimmed.length > 500) {
    return {
      ok: false,
      issues: [
        {
          field: 'expression',
          message: 'Expression exceeds maximum length of 500 characters',
          severity: 'error',
        },
      ],
    };
  }

  if (trimmed.startsWith('@')) {
    return {
      ok: false,
      issues: [
        {
          field: 'expression',
          message: `Special macro '${trimmed}' is not supported in Quartz cron; expected 6 or 7 fields`,
          severity: 'error',
        },
      ],
    };
  }

  const tokens = trimmed.split(/\s+/);
  if (tokens.length !== 6 && tokens.length !== 7) {
    return {
      ok: false,
      issues: [
        {
          field: 'expression',
          message: `Invalid field count: expected 6 or 7 fields, got ${tokens.length}`,
          severity: 'error',
        },
      ],
    };
  }

  const domRaw = tokens[3];
  const dowRaw = tokens[5];

  // Quartz Rule: Exactly one of DOM or DOW must be '?'
  const domHasQuestion = domRaw.includes('?');
  const dowHasQuestion = dowRaw.includes('?');

  if (domRaw === '*' && dowRaw === '*') {
    issues.push({
      field: 'dayOfWeek',
      message: "Cannot specify '*' for both Day-of-Month and Day-of-Week; one must be '?'",
      severity: 'error',
    });
  } else if (domHasQuestion && dowHasQuestion) {
    issues.push({
      field: 'expression',
      message: "Cannot specify '?' for both Day-of-Month and Day-of-Week; exactly one must be '?'",
      severity: 'error',
    });
  } else if (!domHasQuestion && !dowHasQuestion) {
    issues.push({
      field: 'dayOfWeek',
      message: "Cannot specify both Day-of-Month and Day-of-Week; one must be '?'",
      severity: 'error',
    });
  }

  const seconds = parseNumberList(
    tokens[0],
    {
      name: 'second',
      min: 0,
      max: 59,
      validRangeText: '0-59',
    },
    issues
  );

  const minutes = parseNumberList(
    tokens[1],
    {
      name: 'minute',
      min: 0,
      max: 59,
      validRangeText: '0-59',
    },
    issues
  );

  const hours = parseNumberList(
    tokens[2],
    {
      name: 'hour',
      min: 0,
      max: 23,
      validRangeText: '0-23',
    },
    issues
  );

  const dom = parseDomSpec(domRaw, issues);

  const months = parseNumberList(
    tokens[4],
    {
      name: 'month',
      min: 1,
      max: 12,
      validRangeText: '1-12 or JAN-DEC',
      nameMap: MONTH_NAMES,
    },
    issues
  );

  const dow = parseDowSpec(dowRaw, issues);

  let years: number[] | null = null;
  if (tokens.length === 7) {
    const yearRaw = tokens[6].trim();
    if (yearRaw !== '*' && yearRaw !== '?') {
      years = parseNumberList(
        yearRaw,
        {
          name: 'year',
          min: 1970,
          max: 2199,
          validRangeText: '1970-2199',
        },
        issues
      );
    }
  }

  const hasErrors = issues.some((i) => i.severity === 'error');
  if (hasErrors) {
    return {
      ok: false,
      issues,
    };
  }

  const schedule: QuartzSchedule = {
    kind: 'quartz',
    raw: trimmed,
    seconds,
    minutes,
    hours,
    dom,
    months,
    dow,
    years,
  };

  return {
    ok: true,
    schedule,
    issues,
  };
}
