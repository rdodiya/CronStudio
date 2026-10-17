import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';

export function browserTz(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function isValidTz(tz: string): boolean {
  if (!tz || typeof tz !== 'string') return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

interface IntlWithSupportedValues {
  supportedValuesOf?: (key: string) => string[];
}

export function listTzs(): string[] {
  try {
    const intlObj = Intl as unknown as IntlWithSupportedValues;
    const supported =
      typeof intlObj.supportedValuesOf === 'function'
        ? intlObj.supportedValuesOf('timeZone')
        : [];
    const set = new Set<string>(['UTC', ...supported]);
    return Array.from(set).sort();
  } catch {
    return ['UTC'];
  }
}

export function formatLocal(d: Date, tz: string): string {
  try {
    return formatInTimeZone(d, tz, 'yyyy-MM-dd HH:mm:ss zzz');
  } catch {
    return d.toISOString();
  }
}

export function formatUtc(d: Date): string {
  try {
    return formatInTimeZone(d, 'UTC', 'yyyy-MM-dd HH:mm:ss') + ' UTC';
  } catch {
    return d.toISOString();
  }
}

export function localToUtc(
  y: number,
  mo: number, // 1-12
  d: number, // 1-31
  h: number, // 0-23
  mi: number, // 0-59
  s: number, // 0-59
  tz: string
): Date | null {
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${y}-${pad(mo)}-${pad(d)}T${pad(h)}:${pad(mi)}:${pad(s)}`;

  try {
    const utcDate = fromZonedTime(dateStr, tz);
    if (!utcDate || isNaN(utcDate.getTime())) {
      return null;
    }

    // Verify whether the local time actually exists in the target timezone
    // (DST spring-forward gaps skip times e.g. 02:00 -> 03:00, so 02:30 doesn't exist).
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    }).formatToParts(utcDate);

    const hourPart = parts.find((p) => p.type === 'hour');
    const minutePart = parts.find((p) => p.type === 'minute');

    if (!hourPart || !minutePart) {
      return null;
    }

    const localHour = parseInt(hourPart.value, 10) % 24;
    const localMin = parseInt(minutePart.value, 10);

    if (localHour !== h || localMin !== mi) {
      // Local time does not exist (in a spring-forward DST gap)
      return null;
    }

    return utcDate;
  } catch {
    return null;
  }
}
