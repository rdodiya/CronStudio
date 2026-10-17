import { Dialect } from './types';
import { parseUnix } from './unix/parser';
import { parseQuartz } from './quartz/parser';
import { parseEventBridge } from './eventbridge/parser';

export interface Badge {
  label: string;
  ok: boolean;
}

export function convertQuartzToUnix(
  expr: string
): { ok: true; expr: string } | { ok: false; reason: string } {
  const trimmed = expr.trim();
  const tokens = trimmed.split(/\s+/);

  if (tokens.length !== 6 && tokens.length !== 7) {
    return { ok: false, reason: 'Quartz expression must have 6 or 7 fields' };
  }

  const [sec, min, hour, dom, mon, dow, year] = tokens;

  if (sec !== '0') {
    return {
      ok: false,
      reason: 'Seconds field is non-zero; Unix cron only supports minute-level resolution',
    };
  }

  if (year && year !== '*' && year !== '?') {
    return {
      ok: false,
      reason: 'Year field is specified; Unix cron does not support a year field',
    };
  }

  // Check for Quartz special symbols: L, W, #
  if (
    dom.includes('L') ||
    dom.includes('W') ||
    dow.includes('L') ||
    dow.includes('#')
  ) {
    return {
      ok: false,
      reason: 'Quartz special symbols (L, W, #) cannot be automatically mapped to Unix cron',
    };
  }

  let unixDom = dom;
  let unixDow = dow;

  if (dom === '?' && dow === '?') {
    return {
      ok: false,
      reason: "Both day-of-month and day-of-week cannot be '?'",
    };
  }

  if (dom === '?') {
    unixDom = '*';
  }

  if (dow === '?') {
    unixDow = '*';
  } else {
    // Shift Quartz weekday numbers to Unix:
    // Quartz 1=SUN..7=SAT  ==>  Unix 0=SUN..6=SAT
    // Replace names first if needed
    const DOW_REPLACEMENTS: [RegExp, string][] = [
      [/\bSUN\b/gi, '0'],
      [/\bMON\b/gi, '1'],
      [/\bTUE\b/gi, '2'],
      [/\bWED\b/gi, '3'],
      [/\bTHU\b/gi, '4'],
      [/\bFRI\b/gi, '5'],
      [/\bSAT\b/gi, '6'],
    ];

    let shiftedDow = dow;
    for (const [re, rep] of DOW_REPLACEMENTS) {
      shiftedDow = shiftedDow.replace(re, rep);
    }

    // Shift digits 1-7 by subtracting 1
    shiftedDow = shiftedDow.replace(/[1-7]/g, (match) => {
      const num = parseInt(match, 10);
      return String(num - 1);
    });

    unixDow = shiftedDow;
  }

  const unixExpr = `${min} ${hour} ${unixDom} ${mon} ${unixDow}`;
  const validation = parseUnix(unixExpr);
  if (!validation.ok) {
    return {
      ok: false,
      reason: 'Converted expression is not a valid Unix cron expression',
    };
  }

  return { ok: true, expr: unixExpr };
}

export function convertUnixToQuartz(expr: string): string {
  const trimmed = expr.trim();
  const tokens = trimmed.split(/\s+/);
  if (tokens.length !== 5) {
    return expr;
  }

  const [min, hour, dom, mon, dow] = tokens;

  let quartzDom = dom;
  let quartzDow = dow;

  if (dow === '*' && dom === '*') {
    quartzDom = '*';
    quartzDow = '?';
  } else if (dow === '*') {
    quartzDom = dom;
    quartzDow = '?';
  } else if (dom === '*') {
    quartzDom = '?';

    // Shift Unix weekday to Quartz:
    // Unix 0=SUN..6=SAT (or 7=SUN) ==> Quartz 1=SUN..7=SAT
    const DOW_REPLACEMENTS: [RegExp, string][] = [
      [/\bSUN\b/gi, '1'],
      [/\bMON\b/gi, '2'],
      [/\bTUE\b/gi, '3'],
      [/\bWED\b/gi, '4'],
      [/\bTHU\b/gi, '5'],
      [/\bFRI\b/gi, '6'],
      [/\bSAT\b/gi, '7'],
    ];

    let shiftedDow = dow;
    for (const [re, rep] of DOW_REPLACEMENTS) {
      shiftedDow = shiftedDow.replace(re, rep);
    }

    // Shift 0-6 to 1-7, and 7 to 1
    // Handle ranges like 1-5 -> 2-6
    shiftedDow = shiftedDow.replace(/[0-7]/g, (match) => {
      const num = parseInt(match, 10);
      if (num === 7 || num === 0) return '1';
      return String(num + 1);
    });

    quartzDow = shiftedDow;
  } else {
    // Both are restricted; in Quartz one must be '?'
    quartzDom = dom;
    quartzDow = '?';
  }

  return `0 ${min} ${hour} ${quartzDom} ${mon} ${quartzDow}`;
}

export function compatibility(expr: string, dialect: Dialect): Badge[] {
  const isUnixFamily = ['unix', 'kubernetes', 'github', 'vercel', 'cloudflare'].includes(dialect);
  const isQuartz = dialect === 'quartz';
  const isEventBridge = dialect === 'eventbridge';

  // Determine Unix-compatibility
  let unixOk = false;
  if (isUnixFamily) {
    unixOk = parseUnix(expr).ok;
  } else if (isQuartz) {
    unixOk = convertQuartzToUnix(expr).ok;
  } else if (isEventBridge) {
    const eb = parseEventBridge(expr);
    if (eb.ok && eb.schedule.kind === 'quartz') {
      const asQuartz = `0 ${eb.schedule.raw.replace(/^cron\(/i, '').replace(/\)$/, '')}`;
      unixOk = convertQuartzToUnix(asQuartz).ok;
    }
  }

  // Determine Quartz-compatibility
  let quartzOk = false;
  if (isQuartz) {
    quartzOk = parseQuartz(expr).ok;
  } else if (isUnixFamily) {
    const asQuartz = convertUnixToQuartz(expr);
    quartzOk = parseQuartz(asQuartz).ok;
  } else if (isEventBridge) {
    const eb = parseEventBridge(expr);
    if (eb.ok && eb.schedule.kind === 'quartz') {
      quartzOk = true;
    }
  }

  // Determine EventBridge-compatibility
  let ebOk = false;
  if (isEventBridge) {
    ebOk = parseEventBridge(expr).ok;
  } else if (isUnixFamily) {
    const asQuartz = convertUnixToQuartz(expr);
    const tokens = asQuartz.split(/\s+/);
    if (tokens.length >= 6) {
      const ebCron = `cron(${tokens.slice(1).join(' ')} *)`;
      ebOk = parseEventBridge(ebCron).ok;
    }
  } else if (isQuartz) {
    const asUnix = convertQuartzToUnix(expr);
    if (asUnix.ok) {
      const asQuartz = convertUnixToQuartz(asUnix.expr);
      const tokens = asQuartz.split(/\s+/);
      const ebCron = `cron(${tokens.slice(1).join(' ')} *)`;
      ebOk = parseEventBridge(ebCron).ok;
    }
  }

  const badges: Badge[] = [
    { label: 'Unix compatible', ok: unixOk },
    { label: 'Quartz compatible', ok: quartzOk },
    { label: 'Kubernetes compatible', ok: unixOk },
    { label: 'GitHub Actions compatible', ok: unixOk },
    { label: 'AWS EventBridge compatible', ok: ebOk },
    { label: 'Vercel compatible', ok: unixOk },
    { label: 'Cloudflare compatible', ok: unixOk },
  ];

  const hasAnyFailed = badges.some((b) => !b.ok);
  if (hasAnyFailed) {
    badges.push({
      label: 'Conversion requires manual review',
      ok: false,
    });
  }

  return badges;
}
