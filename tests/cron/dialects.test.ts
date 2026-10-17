import { describe, it, expect } from 'vitest';
import {
  parse,
  frequency,
  nextRuns,
  dayMatches,
  timeSets,
  Dialect,
} from '@/lib/cron/index';
import {
  convertQuartzToUnix,
  convertUnixToQuartz,
  compatibility,
} from '@/lib/cron/compatibility';

describe('Task 5: Dialect layer, API, Conversion and Compatibility', () => {
  it('convertQuartzToUnix conversions', () => {
    // Safe conversion
    expect(convertQuartzToUnix('0 0 9 ? * 2')).toEqual({
      ok: true,
      expr: '0 9 * * 1',
    });

    // Unsafe: special symbol L
    expect(convertQuartzToUnix('0 0 12 L * ?')).toEqual({
      ok: false,
      reason: expect.any(String),
    });

    // Unsafe: seconds not 0
    expect(convertQuartzToUnix('*/10 * * * * ?')).toEqual({
      ok: false,
      reason: expect.any(String),
    });

    // Invalid length
    expect(convertQuartzToUnix('0 0 12')).toEqual({
      ok: false,
      reason: expect.any(String),
    });

    // Year specified
    expect(convertQuartzToUnix('0 0 12 ? * 2 2026')).toEqual({
      ok: false,
      reason: expect.any(String),
    });

    // Both ?
    expect(convertQuartzToUnix('0 0 12 ? * ?')).toEqual({
      ok: false,
      reason: expect.any(String),
    });
  });

  it('convertUnixToQuartz conversions', () => {
    expect(convertUnixToQuartz('0 9 * * 1-5')).toBe('0 0 9 ? * 2-6');
    expect(convertUnixToQuartz('0 9 15 * *')).toBe('0 0 9 15 * ?');
    expect(convertUnixToQuartz('0 9 * * *')).toBe('0 0 9 * * ?');
    expect(convertUnixToQuartz('0 9 1 1 1')).toBe('0 0 9 1 1 ?');
    expect(convertUnixToQuartz('invalid')).toBe('invalid');
  });

  it('parse across dialects', () => {
    expect(parse('0 9 * * *', 'unix').ok).toBe(true);
    expect(parse('0 0 9 * * ?', 'quartz').ok).toBe(true);
    expect(parse('rate(5 minutes)', 'eventbridge').ok).toBe(true);
    expect(parse('cron(0 9 * * ? *)', 'eventbridge').ok).toBe(true);
    expect(parse('0 9 * * *', 'unknown' as Dialect).ok).toBe(false);
  });

  it('nextRuns, dayMatches, and timeSets routing', () => {
    const unixP = parse('0 9 * * *', 'unix');
    expect(unixP.ok).toBe(true);
    if (unixP.ok) {
      const runs = nextRuns(unixP.schedule, {
        tz: 'UTC',
        from: new Date('2026-10-16T00:00:00Z'),
        count: 2,
      });
      expect(runs.length).toBe(2);
      expect(dayMatches(unixP.schedule, 2026, 10, 16)).toBe(true);
      expect(timeSets(unixP.schedule)).toEqual({
        seconds: [0],
        minutes: [0],
        hours: [9],
      });
    }

    const quartzP = parse('0 30 14 ? * *', 'quartz');
    expect(quartzP.ok).toBe(true);
    if (quartzP.ok) {
      const runs = nextRuns(quartzP.schedule, {
        tz: 'UTC',
        from: new Date('2026-10-16T00:00:00Z'),
        count: 1,
      });
      expect(runs.length).toBe(1);
      expect(dayMatches(quartzP.schedule, 2026, 10, 16)).toBe(true);
      expect(timeSets(quartzP.schedule)).toEqual({
        seconds: [0],
        minutes: [30],
        hours: [14],
      });
    }

    const rateP = parse('rate(2 hours)', 'eventbridge');
    expect(rateP.ok).toBe(true);
    if (rateP.ok) {
      const runs = nextRuns(rateP.schedule, {
        tz: 'UTC',
        from: new Date('2026-10-16T00:00:00Z'),
        count: 3,
      });
      expect(runs.length).toBe(3);
      expect(dayMatches(rateP.schedule, 2026, 10, 16)).toBe(true);
      expect(timeSets(rateP.schedule)).toEqual({
        seconds: [0],
        minutes: [],
        hours: [],
      });
    }
  });

  it('frequency calculations', () => {
    const p1 = parse('*/5 * * * *', 'unix');
    expect(p1.ok).toBe(true);
    if (p1.ok) {
      const freq = frequency(p1.schedule, 'UTC', new Date('2026-10-16T00:00:00Z'));
      // 12 runs/hour * 24 hours * 365 days = 105,120 runs/year
      expect(freq.perYear).toBe(105120);
    }

    const p2 = parse('0 9 * * 1-5', 'unix');
    expect(p2.ok).toBe(true);
    if (p2.ok) {
      const from = new Date('2026-10-16T00:00:00Z');
      const freq = frequency(p2.schedule, 'UTC', from);
      let expectedWeekdays = 0;
      for (let i = 0; i < 365; i++) {
        const d = new Date(from.getTime() + i * 86400 * 1000);
        const dow = d.getUTCDay();
        if (dow >= 1 && dow <= 5) {
          expectedWeekdays++;
        }
      }
      expect(expectedWeekdays).toBe(261);
      expect(freq.matchingDays).toBe(261);
    }

    const pRateMinute = parse('rate(5 minutes)', 'eventbridge');
    if (pRateMinute.ok) {
      const freq = frequency(pRateMinute.schedule, 'UTC', new Date());
      expect(freq.perYear).toBe(525600 / 5);
      expect(freq.matchingDays).toBe(365);
    }

    const pRateHour = parse('rate(2 hours)', 'eventbridge');
    if (pRateHour.ok) {
      const freq = frequency(pRateHour.schedule, 'UTC', new Date());
      expect(freq.perYear).toBe(525600 / 120);
    }

    const pRateDay = parse('rate(1 day)', 'eventbridge');
    if (pRateDay.ok) {
      const freq = frequency(pRateDay.schedule, 'UTC', new Date());
      expect(freq.perYear).toBe(365);
    }
  });

  it('compatibility badges', () => {
    // 0 9 * * 1-5 from unix converts safely to all
    const badges1 = compatibility('0 9 * * 1-5', 'unix');
    const quartzBadge = badges1.find((b) => b.label === 'Quartz compatible');
    expect(quartzBadge).toEqual({ label: 'Quartz compatible', ok: true });
    const reviewBadge1 = badges1.find((b) => b.label === 'Conversion requires manual review');
    expect(reviewBadge1).toBeUndefined();

    // 0 0 12 L * ? from quartz cannot convert to unix
    const badges2 = compatibility('0 0 12 L * ?', 'quartz');
    const unixBadge = badges2.find((b) => b.label === 'Unix compatible');
    expect(unixBadge).toEqual({ label: 'Unix compatible', ok: false });
    const reviewBadge2 = badges2.find((b) => b.label === 'Conversion requires manual review');
    expect(reviewBadge2).toEqual({ label: 'Conversion requires manual review', ok: false });

    // Eventbridge cron
    const badgesEb = compatibility('cron(0 12 * * ? *)', 'eventbridge');
    expect(badgesEb.find((b) => b.label === 'AWS EventBridge compatible')?.ok).toBe(true);

    // Eventbridge rate
    const badgesEbRate = compatibility('rate(5 minutes)', 'eventbridge');
    expect(badgesEbRate.find((b) => b.label === 'AWS EventBridge compatible')?.ok).toBe(true);
    expect(badgesEbRate.find((b) => b.label === 'Unix compatible')?.ok).toBe(false);

    // Quartz to EB
    const badgesQuartzSafe = compatibility('0 0 12 ? * MON-FRI', 'quartz');
    expect(badgesQuartzSafe.find((b) => b.label === 'AWS EventBridge compatible')?.ok).toBe(true);
  });
});
