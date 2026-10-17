import { Schedule, Issue } from './cron/types';
import { dayMatches, timeSets } from './cron/index';

export interface Transition {
  at: Date;
  kind: 'gap' | 'overlap';
  offsetBeforeMin: number;
  offsetAfterMin: number;
}

export function transitions(tz: string, from: Date, to: Date): Transition[] {
  if (tz === 'UTC' || tz === 'Etc/UTC') {
    return [];
  }

  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'shortOffset',
      hour12: false,
    });
  } catch {
    return [];
  }

  function getOffset(date: Date): number {
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    if (!tzPart) return 0;
    const match = tzPart.value.match(/GMT([+-])(\d+)(?::(\d+))?/);
    if (!match) return 0;
    const sign = match[1] === '-' ? -1 : 1;
    const hours = parseInt(match[2], 10);
    const mins = match[3] ? parseInt(match[3], 10) : 0;
    return sign * (hours * 60 + mins);
  }

  const trs: Transition[] = [];
  let curTime = from.getTime();
  const endTime = to.getTime();
  let prevOffset = getOffset(from);

  // Step 24 hours at a time; DST periods last months, so stepping 24h never skips a transition
  const stepMs = 24 * 3600 * 1000;
  while (curTime < endTime) {
    const nextTime = Math.min(curTime + stepMs, endTime);
    const nextOffset = getOffset(new Date(nextTime));
    if (nextOffset !== prevOffset) {
      // Bisect down to 1 minute (60,000 ms)
      let low = curTime;
      let high = nextTime;
      while (high - low > 60000) {
        const mid = low + Math.floor((high - low) / (2 * 60000)) * 60000;
        if (mid === low) break;
        const midOffset = getOffset(new Date(mid));
        if (midOffset === prevOffset) {
          low = mid;
        } else {
          high = mid;
        }
      }
      const at = new Date(high);
      const kind: 'gap' | 'overlap' = nextOffset > prevOffset ? 'gap' : 'overlap';
      trs.push({
        at,
        kind,
        offsetBeforeMin: prevOffset,
        offsetAfterMin: nextOffset,
      });
      prevOffset = nextOffset;
      curTime = high;
    } else {
      curTime = nextTime;
    }
  }

  return trs;
}

export function flagRun(run: Date, tr: Transition[]): 'dst-overlap' | null {
  const runMs = run.getTime();
  for (const t of tr) {
    if (t.kind === 'overlap') {
      const deltaMs = Math.abs(t.offsetAfterMin - t.offsetBeforeMin) * 60 * 1000;
      if (runMs >= t.at.getTime() - deltaMs && runMs < t.at.getTime() + deltaMs) {
        return 'dst-overlap';
      }
    }
  }
  return null;
}

export function dstWarnings(
  s: Schedule,
  tz: string,
  from: Date,
  to: Date
): Issue[] {
  if (s.kind === 'rate') {
    return [];
  }

  const ts = timeSets(s);
  if (ts.hours.length === 24) {
    // Wildcard hours (all 24 hours included), skip warnings
    return [];
  }

  const trs = transitions(tz, from, to);
  if (trs.length === 0) {
    return [];
  }

  const issues: Issue[] = [];

  for (const t of trs) {
    if (t.kind === 'gap') {
      const beforeLocalMs = t.at.getTime() + t.offsetBeforeMin * 60 * 1000;
      const beforeDate = new Date(beforeLocalMs);
      const y = beforeDate.getUTCFullYear();
      const m = beforeDate.getUTCMonth() + 1;
      const d = beforeDate.getUTCDate();
      const skippedHour = beforeDate.getUTCHours();

      if (dayMatches(s, y, m, d) && ts.hours.includes(skippedHour)) {
        issues.push({
          field: 'hour',
          severity: 'warning',
          message: `Local time ${skippedHour}:00 on ${y}-${String(m).padStart(
            2,
            '0'
          )}-${String(d).padStart(
            2,
            '0'
          )} does not exist due to DST spring-forward gap.`,
        });
      }
    } else if (t.kind === 'overlap') {
      const afterLocalMs = t.at.getTime() + t.offsetAfterMin * 60 * 1000;
      const afterDate = new Date(afterLocalMs);
      const y = afterDate.getUTCFullYear();
      const m = afterDate.getUTCMonth() + 1;
      const d = afterDate.getUTCDate();
      const repeatedHour = afterDate.getUTCHours();

      if (dayMatches(s, y, m, d) && ts.hours.includes(repeatedHour)) {
        issues.push({
          field: 'hour',
          severity: 'warning',
          message: `Local time ${repeatedHour}:00 on ${y}-${String(m).padStart(
            2,
            '0'
          )}-${String(d).padStart(
            2,
            '0'
          )} occurs twice due to DST fall-back overlap.`,
        });
      }
    }
  }

  return issues;
}
