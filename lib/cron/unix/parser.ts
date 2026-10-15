import { Issue, ParseResult, UnixSchedule } from '../types';

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

const DOW_NAMES: Record<string, number> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
};

interface FieldConfig {
  name: string;
  min: number;
  max: number;
  validRangeText: string;
  nameMap?: Record<string, number>;
  normalize?: (val: number) => number;
}

const FIELD_CONFIGS: FieldConfig[] = [
  {
    name: 'minute',
    min: 0,
    max: 59,
    validRangeText: '0-59',
  },
  {
    name: 'hour',
    min: 0,
    max: 23,
    validRangeText: '0-23',
  },
  {
    name: 'dayOfMonth',
    min: 1,
    max: 31,
    validRangeText: '1-31',
  },
  {
    name: 'month',
    min: 1,
    max: 12,
    validRangeText: '1-12 or JAN-DEC',
    nameMap: MONTH_NAMES,
  },
  {
    name: 'dayOfWeek',
    min: 0,
    max: 7,
    validRangeText: '0-7 or SUN-SAT (0 or 7 is Sunday)',
    nameMap: DOW_NAMES,
    normalize: (val: number) => (val === 7 ? 0 : val),
  },
];

function resolveValue(token: string, config: FieldConfig): number | null {
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

function parseFieldPart(
  part: string,
  config: FieldConfig,
  issues: Issue[]
): number[] {
  if (part === '*' || part === '?') {
    const nums: number[] = [];
    for (let i = config.min; i <= config.max; i++) {
      nums.push(config.normalize ? config.normalize(i) : i);
    }
    return nums;
  }

  // Handle step expressions: */step or range/step or start/step
  if (part.includes('/')) {
    const slashParts = part.split('/');
    if (slashParts.length !== 2) {
      issues.push({
        field: config.name,
        message: `Invalid step expression '${part}' in ${config.name} field (valid: ${config.validRangeText})`,
        severity: 'error',
      });
      return [];
    }

    const [rangePart, stepPart] = slashParts;
    const step = parseInt(stepPart, 10);
    if (!/^\d+$/.test(stepPart) || isNaN(step) || step <= 0) {
      issues.push({
        field: config.name,
        message: `Step value must be a positive integer in '${part}' (field: ${config.name})`,
        severity: 'error',
      });
      return [];
    }

    let rangeStart = config.min;
    let rangeEnd = config.max;

    if (rangePart === '*' || rangePart === '?') {
      rangeStart = config.min;
      rangeEnd = config.max;
    } else if (rangePart.includes('-')) {
      const dashParts = rangePart.split('-');
      if (dashParts.length !== 2) {
        issues.push({
          field: config.name,
          message: `Invalid range expression '${rangePart}' in ${config.name} field`,
          severity: 'error',
        });
        return [];
      }
      const s = resolveValue(dashParts[0], config);
      const e = resolveValue(dashParts[1], config);
      if (s === null || e === null || s < config.min || s > config.max || e < config.min || e > config.max) {
        issues.push({
          field: config.name,
          message: `Range values '${rangePart}' are out of valid range (${config.validRangeText})`,
          severity: 'error',
        });
        return [];
      }
      if (s > e) {
        issues.push({
          field: config.name,
          message: `Range start '${dashParts[0]}' cannot be greater than range end '${dashParts[1]}'`,
          severity: 'error',
        });
        return [];
      }
      rangeStart = s;
      rangeEnd = e;
    } else {
      const s = resolveValue(rangePart, config);
      if (s === null || s < config.min || s > config.max) {
        issues.push({
          field: config.name,
          message: `Value '${rangePart}' is out of valid range (${config.validRangeText})`,
          severity: 'error',
        });
        return [];
      }
      rangeStart = s;
      rangeEnd = config.max;
    }

    const nums: number[] = [];
    for (let i = rangeStart; i <= rangeEnd; i += step) {
      nums.push(config.normalize ? config.normalize(i) : i);
    }
    return nums;
  }

  // Handle range expressions: start-end
  if (part.includes('-')) {
    const dashParts = part.split('-');
    if (dashParts.length !== 2) {
      issues.push({
        field: config.name,
        message: `Invalid range expression '${part}' in ${config.name} field`,
        severity: 'error',
      });
      return [];
    }
    const s = resolveValue(dashParts[0], config);
    const e = resolveValue(dashParts[1], config);
    if (s === null || e === null || s < config.min || s > config.max || e < config.min || e > config.max) {
      issues.push({
        field: config.name,
        message: `Range values '${part}' are out of valid range (${config.validRangeText})`,
        severity: 'error',
      });
      return [];
    }
    if (s > e) {
      issues.push({
        field: config.name,
        message: `Range start '${dashParts[0]}' cannot be greater than range end '${dashParts[1]}'`,
        severity: 'error',
      });
      return [];
    }
    const nums: number[] = [];
    for (let i = s; i <= e; i++) {
      nums.push(config.normalize ? config.normalize(i) : i);
    }
    return nums;
  }

  // Handle single value
  const val = resolveValue(part, config);
  if (val === null || val < config.min || val > config.max) {
    issues.push({
      field: config.name,
      message: `Invalid value '${part}' for ${config.name} field (valid: ${config.validRangeText})`,
      severity: 'error',
    });
    return [];
  }

  return [config.normalize ? config.normalize(val) : val];
}

function parseField(
  rawField: string,
  config: FieldConfig,
  issues: Issue[]
): number[] {
  const parts = rawField.split(',');
  const result: number[] = [];

  for (const part of parts) {
    if (part.trim() === '') {
      issues.push({
        field: config.name,
        message: `Empty list element in ${config.name} field`,
        severity: 'error',
      });
      continue;
    }
    const values = parseFieldPart(part.trim(), config, issues);
    result.push(...values);
  }

  return Array.from(new Set(result)).sort((a, b) => a - b);
}

export function parseUnix(expr: string): ParseResult {
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
          message: `Special macro '${trimmed}' is not supported; expected 5 fields separated by whitespace`,
          severity: 'error',
        },
      ],
    };
  }

  const fieldTokens = trimmed.split(/\s+/);
  if (fieldTokens.length !== 5) {
    return {
      ok: false,
      issues: [
        {
          field: 'expression',
          message: `Invalid field count: expected 5 fields, got ${fieldTokens.length}`,
          severity: 'error',
        },
      ],
    };
  }

  const minutes = parseField(fieldTokens[0], FIELD_CONFIGS[0], issues);
  const hours = parseField(fieldTokens[1], FIELD_CONFIGS[1], issues);
  const doms = parseField(fieldTokens[2], FIELD_CONFIGS[2], issues);
  const months = parseField(fieldTokens[3], FIELD_CONFIGS[3], issues);
  const dows = parseField(fieldTokens[4], FIELD_CONFIGS[4], issues);

  const hasErrors = issues.some((i) => i.severity === 'error');
  if (hasErrors) {
    return {
      ok: false,
      issues,
    };
  }

  const domRestricted = fieldTokens[2] !== '*' && fieldTokens[2] !== '?';
  const dowRestricted = fieldTokens[4] !== '*' && fieldTokens[4] !== '?';

  const schedule: UnixSchedule = {
    kind: 'unix',
    raw: trimmed,
    minutes,
    hours,
    doms,
    months,
    dows,
    domRestricted,
    dowRestricted,
  };

  return {
    ok: true,
    schedule,
    issues,
  };
}
