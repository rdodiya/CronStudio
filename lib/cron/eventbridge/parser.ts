import { ParseResult } from '../types';
import { parseQuartz } from '../quartz/parser';

export function parseEventBridge(input: string): ParseResult {
  if (typeof input !== 'string') {
    return {
      ok: false,
      issues: [
        {
          field: 'expression',
          message: 'Expression must be a string',
          severity: 'error',
        },
      ],
    };
  }

  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return {
      ok: false,
      issues: [
        {
          field: 'expression',
          message: 'Expression cannot be empty',
          severity: 'error',
        },
      ],
    };
  }

  // 1. Check for rate(...) expression
  if (trimmed.toLowerCase().startsWith('rate(') && trimmed.endsWith(')')) {
    const content = trimmed.slice(5, -1).trim();
    const rateMatch = content.match(/^(\d+)\s+([a-zA-Z]+)$/);

    if (!rateMatch) {
      return {
        ok: false,
        issues: [
          {
            field: 'expression',
            message: `Invalid rate expression format '${trimmed}'. Expected 'rate(value unit)', e.g. 'rate(5 minutes)' or 'rate(1 hour)'`,
            severity: 'error',
          },
        ],
      };
    }

    const value = parseInt(rateMatch[1], 10);
    const unitRaw = rateMatch[2].toLowerCase();

    if (value <= 0) {
      return {
        ok: false,
        issues: [
          {
            field: 'expression',
            message: 'Rate value must be greater than zero',
            severity: 'error',
          },
        ],
      };
    }

    const validUnits = ['minute', 'minutes', 'hour', 'hours', 'day', 'days'];
    if (!validUnits.includes(unitRaw)) {
      return {
        ok: false,
        issues: [
          {
            field: 'expression',
            message: `Invalid rate unit '${rateMatch[2]}'. Allowed units are minute(s), hour(s), day(s)`,
            severity: 'error',
          },
        ],
      };
    }

    if (value === 1 && unitRaw.endsWith('s')) {
      return {
        ok: false,
        issues: [
          {
            field: 'expression',
            message: `Singular unit expected for value 1: use '${unitRaw.slice(0, -1)}' instead of '${unitRaw}'`,
            severity: 'error',
          },
        ],
      };
    }

    if (value > 1 && !unitRaw.endsWith('s')) {
      return {
        ok: false,
        issues: [
          {
            field: 'expression',
            message: `Plural unit expected for value ${value}: use '${unitRaw}s' instead of '${unitRaw}'`,
            severity: 'error',
          },
        ],
      };
    }

    let normalizedUnit: 'minute' | 'hour' | 'day';
    if (unitRaw.startsWith('minute')) {
      normalizedUnit = 'minute';
    } else if (unitRaw.startsWith('hour')) {
      normalizedUnit = 'hour';
    } else {
      normalizedUnit = 'day';
    }

    return {
      ok: true,
      schedule: {
        kind: 'rate',
        raw: trimmed,
        every: value,
        unit: normalizedUnit,
      },
      issues: [],
    };
  }

  // 2. Check for cron(...) expression or bare 6 fields
  let cronBody = trimmed;
  if (trimmed.toLowerCase().startsWith('cron(') && trimmed.endsWith(')')) {
    cronBody = trimmed.slice(5, -1).trim();
  }

  const tokens = cronBody.split(/\s+/);
  if (tokens.length !== 6) {
    return {
      ok: false,
      issues: [
        {
          field: 'expression',
          message: `EventBridge cron expects 6 fields: minute, hour, day-of-month, month, day-of-week, year. Got ${tokens.length} fields.`,
          severity: 'error',
        },
      ],
    };
  }

  // EventBridge cron expressions are 6 fields without seconds.
  // We prepend '0 ' for seconds to parse as 7-field Quartz cron.
  const quartzExpr = `0 ${cronBody}`;
  const quartzResult = parseQuartz(quartzExpr);

  if (!quartzResult.ok) {
    return quartzResult;
  }

  return {
    ok: true,
    schedule: {
      ...quartzResult.schedule,
      raw: trimmed,
    },
    issues: quartzResult.issues,
  };
}
