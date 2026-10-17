import { RateSchedule } from '../types';

export function rateNextRuns(
  s: RateSchedule,
  o: {
    from: Date;
    count: number;
    until?: Date;
  }
): Date[] {
  if (o.count <= 0 || s.every <= 0) {
    return [];
  }

  let intervalMs = 0;
  switch (s.unit) {
    case 'minute':
      intervalMs = s.every * 60 * 1000;
      break;
    case 'hour':
      intervalMs = s.every * 60 * 60 * 1000;
      break;
    case 'day':
      intervalMs = s.every * 24 * 60 * 60 * 1000;
      break;
  }

  if (intervalMs <= 0) {
    return [];
  }

  const runs: Date[] = [];
  const fromTime = o.from.getTime();
  const untilTime = o.until ? o.until.getTime() : Infinity;

  for (let k = 1; k <= o.count; k++) {
    const nextTime = fromTime + k * intervalMs;
    if (nextTime > untilTime) {
      break;
    }
    runs.push(new Date(nextTime));
  }

  return runs;
}
