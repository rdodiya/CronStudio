import { describe, it, expect } from 'vitest';
import { parseEventBridge } from '@/lib/cron/eventbridge/parser';
import { rateNextRuns } from '@/lib/cron/eventbridge/rate';
import { RateSchedule } from '@/lib/cron/types';

describe('AWS EventBridge Parser and Rate Scheduler', () => {
  it('parses valid and invalid cron() expressions', () => {
    // Valid cron(m h dom mon dow year)
    const r1 = parseEventBridge('cron(0 12 * * ? *)');
    expect(r1.ok).toBe(true);
    if (r1.ok && r1.schedule.kind === 'quartz') {
      expect(r1.schedule.seconds).toEqual([0]);
      expect(r1.schedule.minutes).toEqual([0]);
      expect(r1.schedule.hours).toEqual([12]);
      expect(r1.schedule.dom).toEqual({ type: 'all' });
      expect(r1.schedule.dow).toEqual({ type: 'any' });
    }

    // Bare 6-field without cron(...) wrapper is also accepted
    const rBare = parseEventBridge('0 12 * * ? *');
    expect(rBare.ok).toBe(true);

    // Invalid: both dom and dow are '*'
    const r2 = parseEventBridge('cron(0 12 * * * *)');
    expect(r2.ok).toBe(false);
    expect(r2.issues.some((i) => i.field === 'dayOfWeek' || i.message.includes('?'))).toBe(true);
  });

  it('validates rate(N unit) expressions with singular and plural units', () => {
    // rate(5 minutes) ok
    const r5m = parseEventBridge('rate(5 minutes)');
    expect(r5m.ok).toBe(true);
    if (r5m.ok && r5m.schedule.kind === 'rate') {
      expect(r5m.schedule.every).toBe(5);
      expect(r5m.schedule.unit).toBe('minute');
    }

    // rate(1 minutes) error (must be singular "minute")
    const r1ms = parseEventBridge('rate(1 minutes)');
    expect(r1ms.ok).toBe(false);

    // rate(5 minute) error (must be plural "minutes")
    const r5ms = parseEventBridge('rate(5 minute)');
    expect(r5ms.ok).toBe(false);

    // rate(1 minute) ok
    const r1m = parseEventBridge('rate(1 minute)');
    expect(r1m.ok).toBe(true);
    if (r1m.ok && r1m.schedule.kind === 'rate') {
      expect(r1m.schedule.every).toBe(1);
      expect(r1m.schedule.unit).toBe('minute');
    }

    // Other valid units: hour, hours, day, days
    expect(parseEventBridge('rate(1 hour)').ok).toBe(true);
    expect(parseEventBridge('rate(2 hours)').ok).toBe(true);
    expect(parseEventBridge('rate(1 day)').ok).toBe(true);
    expect(parseEventBridge('rate(7 days)').ok).toBe(true);

    // Invalid rates
    expect(parseEventBridge('rate(0 minutes)').ok).toBe(false);
    expect(parseEventBridge('rate(-5 minutes)').ok).toBe(false);
    expect(parseEventBridge('rate(5 weeks)').ok).toBe(false);
    expect(parseEventBridge('rate(invalid)').ok).toBe(false);
  });

  it('rateNextRuns generates scheduled runs at interval steps', () => {
    const s: RateSchedule = {
      kind: 'rate',
      raw: 'rate(15 minutes)',
      every: 15,
      unit: 'minute',
    };
    const from = new Date('2026-10-16T00:00:00Z');
    const runs = rateNextRuns(s, { from, count: 3 });
    expect(runs).toHaveLength(3);
    expect(runs[0].toISOString()).toBe('2026-10-16T00:15:00.000Z');
    expect(runs[1].toISOString()).toBe('2026-10-16T00:30:00.000Z');
    expect(runs[2].toISOString()).toBe('2026-10-16T00:45:00.000Z');

    // With until
    const until = new Date('2026-10-16T00:20:00Z');
    const limitedRuns = rateNextRuns(s, { from, count: 5, until });
    expect(limitedRuns).toHaveLength(1);
    expect(limitedRuns[0].toISOString()).toBe('2026-10-16T00:15:00.000Z');

    // Hour and day units
    const sHour: RateSchedule = { kind: 'rate', raw: 'rate(2 hours)', every: 2, unit: 'hour' };
    const runsHour = rateNextRuns(sHour, { from, count: 2 });
    expect(runsHour[0].toISOString()).toBe('2026-10-16T02:00:00.000Z');

    const sDay: RateSchedule = { kind: 'rate', raw: 'rate(1 day)', every: 1, unit: 'day' };
    const runsDay = rateNextRuns(sDay, { from, count: 2 });
    expect(runsDay[0].toISOString()).toBe('2026-10-17T00:00:00.000Z');

    // Count <= 0 or every <= 0
    expect(rateNextRuns(s, { from, count: 0 })).toEqual([]);
    expect(rateNextRuns({ ...s, every: 0 }, { from, count: 2 })).toEqual([]);
  });

  it('parseEventBridge handles non-string, empty strings, and invalid counts', () => {
    expect(parseEventBridge(123 as unknown as string).ok).toBe(false);
    expect(parseEventBridge('').ok).toBe(false);
    expect(parseEventBridge('0 12 * * ?').ok).toBe(false); // 5 fields
  });
});
