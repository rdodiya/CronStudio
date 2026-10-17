import { describe, it, expect } from 'vitest';
import { parseQuartz } from '@/lib/cron/quartz/parser';
import { quartzNextRuns, quartzDayMatches } from '@/lib/cron/quartz/scheduler';
import { QuartzSchedule } from '@/lib/cron/types';

describe('Quartz Scheduler', () => {
  const getQuartz = (expr: string): QuartzSchedule => {
    const res = parseQuartz(expr);
    if (!res.ok || res.schedule.kind !== 'quartz') {
      throw new Error(`Failed to parse Quartz expression: ${expr}`);
    }
    return res.schedule;
  };

  it('0 0 12 L * ? from 2026-10-16 → runs[0] = 2026-10-31T12:00Z', () => {
    const s = getQuartz('0 0 12 L * ?');
    const from = new Date('2026-10-16T00:00:00Z');
    const runs = quartzNextRuns(s, { tz: 'UTC', from, count: 1 });
    expect(runs).toHaveLength(1);
    expect(runs[0].toISOString()).toBe('2026-10-31T12:00:00.000Z');
  });

  it('0 0 12 L-3 * ? from 2026-10-16 → runs[0] = 2026-10-28T12:00Z', () => {
    const s = getQuartz('0 0 12 L-3 * ?');
    const from = new Date('2026-10-16T00:00:00Z');
    const runs = quartzNextRuns(s, { tz: 'UTC', from, count: 1 });
    expect(runs).toHaveLength(1);
    expect(runs[0].toISOString()).toBe('2026-10-28T12:00:00.000Z');
  });

  it('0 0 12 LW * ? from 2026-10-16 → runs[0] = 2026-10-30T12:00Z (Oct 31 is Saturday)', () => {
    const s = getQuartz('0 0 12 LW * ?');
    const from = new Date('2026-10-16T00:00:00Z');
    const runs = quartzNextRuns(s, { tz: 'UTC', from, count: 1 });
    expect(runs).toHaveLength(1);
    expect(runs[0].toISOString()).toBe('2026-10-30T12:00:00.000Z');
  });

  it('0 0 12 15W * ? from 2026-10-16 → runs[0] = 2026-11-16T12:00Z (Nov 15 is Sunday → Monday)', () => {
    const s = getQuartz('0 0 12 15W * ?');
    const from = new Date('2026-10-16T00:00:00Z');
    const runs = quartzNextRuns(s, { tz: 'UTC', from, count: 1 });
    expect(runs).toHaveLength(1);
    expect(runs[0].toISOString()).toBe('2026-11-16T12:00:00.000Z');
  });

  it('0 0 12 1W * ? from 2026-07-02 → runs[0] = 2026-08-03T12:00Z (Aug 1 is Saturday → Monday, same month)', () => {
    const s = getQuartz('0 0 12 1W * ?');
    const from = new Date('2026-07-02T00:00:00Z');
    const runs = quartzNextRuns(s, { tz: 'UTC', from, count: 1 });
    expect(runs).toHaveLength(1);
    expect(runs[0].toISOString()).toBe('2026-08-03T12:00:00.000Z');
  });

  it('0 0 12 ? * 6#3 from 2026-10-16T00:00Z → runs[0] = 2026-10-16T12:00Z', () => {
    const s = getQuartz('0 0 12 ? * 6#3');
    const from = new Date('2026-10-16T00:00:00Z');
    const runs = quartzNextRuns(s, { tz: 'UTC', from, count: 1 });
    expect(runs).toHaveLength(1);
    expect(runs[0].toISOString()).toBe('2026-10-16T12:00:00.000Z');
  });

  it('0 0 12 ? * 6#5 from 2026-10-16, count 2 → [2026-10-30T12:00Z, 2027-01-29T12:00Z]', () => {
    const s = getQuartz('0 0 12 ? * 6#5');
    const from = new Date('2026-10-16T00:00:00Z');
    const runs = quartzNextRuns(s, { tz: 'UTC', from, count: 2 });
    expect(runs).toHaveLength(2);
    expect(runs[0].toISOString()).toBe('2026-10-30T12:00:00.000Z');
    expect(runs[1].toISOString()).toBe('2027-01-29T12:00:00.000Z');
  });

  it('0 0 12 ? * 6L from 2026-10-16 → runs[0] = 2026-10-30T12:00Z', () => {
    const s = getQuartz('0 0 12 ? * 6L');
    const from = new Date('2026-10-16T00:00:00Z');
    const runs = quartzNextRuns(s, { tz: 'UTC', from, count: 1 });
    expect(runs).toHaveLength(1);
    expect(runs[0].toISOString()).toBe('2026-10-30T12:00:00.000Z');
  });

  it('*/10 * * * * ? count 25 → 25 runs, 10 s apart', () => {
    const s = getQuartz('*/10 * * * * ?');
    const from = new Date('2026-10-16T00:00:00Z');
    const runs = quartzNextRuns(s, { tz: 'UTC', from, count: 25 });
    expect(runs).toHaveLength(25);
    for (let i = 1; i < runs.length; i++) {
      const diffSec = (runs[i].getTime() - runs[i - 1].getTime()) / 1000;
      expect(diffSec).toBe(10);
    }
  });

  it('0 0 0 31 4 ? → [] in < 1000 ms', () => {
    const s = getQuartz('0 0 0 31 4 ?');
    const from = new Date('2026-10-16T00:00:00Z');
    const start = Date.now();
    const runs = quartzNextRuns(s, { tz: 'UTC', from, count: 10 });
    const elapsed = Date.now() - start;
    expect(runs).toEqual([]);
    expect(elapsed).toBeLessThan(1000);
  });

  it('0 30 2 * * ? tz America/New_York around 2026-03-08 and 2026-11-01', () => {
    // Gap: local 02:30 does not exist on 2026-03-08 in America/New_York
    const sGap = getQuartz('0 30 2 * * ?');
    const runsGap = quartzNextRuns(sGap, {
      tz: 'America/New_York',
      from: new Date('2026-03-07T00:00:00Z'),
      count: 4,
      until: new Date('2026-03-10T00:00:00Z'),
    });
    // Ruling: The nonexistent-local-time case (02:30 in a gap) is dropped, not shifted.
    const runOnMarch8 = runsGap.find((r) => {
      const d = r.toLocaleDateString('en-US', { timeZone: 'America/New_York' });
      return d.startsWith('3/8/2026');
    });
    expect(runOnMarch8).toBeUndefined();

    // Overlap: local 01:30 happens during fall-back on 2026-11-01 in America/New_York
    const sOverlap = getQuartz('0 30 1 * * ?');
    const runsOverlap = quartzNextRuns(sOverlap, {
      tz: 'America/New_York',
      from: new Date('2026-10-31T00:00:00Z'),
      count: 4,
      until: new Date('2026-11-03T00:00:00Z'),
    });
    const nov1Runs = runsOverlap.filter((r) => {
      const d = r.toLocaleDateString('en-US', { timeZone: 'America/New_York' });
      return d.startsWith('11/1/2026');
    });
    expect(nov1Runs).toHaveLength(1);
  });

  it('quartzDayMatches tests edge cases and month boundaries', () => {
    const s = getQuartz('0 0 12 L * ?');
    expect(quartzDayMatches(s, 2026, 10, 31)).toBe(true);
    expect(quartzDayMatches(s, 2026, 10, 30)).toBe(false);
    expect(quartzDayMatches(s, 2026, 2, 28)).toBe(true); // 2026 is non-leap
    expect(quartzDayMatches(s, 2028, 2, 29)).toBe(true); // 2028 is leap year
    expect(quartzDayMatches(s, 2028, 2, 28)).toBe(false);

    // DOM 'all'
    const sDomAll = getQuartz('0 0 12 * * ?');
    expect(quartzDayMatches(sDomAll, 2026, 10, 15)).toBe(true);

    // DOW 'all'
    const sDowAll = getQuartz('0 0 12 ? * *');
    expect(quartzDayMatches(sDowAll, 2026, 10, 15)).toBe(true);

    // DOW 'lastDay' (L = Saturday in Quartz = 7)
    const sLastDay = getQuartz('0 0 12 ? * L');
    expect(quartzDayMatches(sLastDay, 2026, 10, 17)).toBe(true); // Oct 17, 2026 is Saturday
    expect(quartzDayMatches(sLastDay, 2026, 10, 18)).toBe(false); // Oct 18, 2026 is Sunday
  });

  it('quartzNextRuns handles count <= 0, invalid timezones, and until bounds', () => {
    const s = getQuartz('0 0 12 ? * *');
    const from = new Date('2026-10-16T00:00:00Z');

    expect(quartzNextRuns(s, { tz: 'UTC', from, count: 0 })).toEqual([]);
    expect(quartzNextRuns(s, { tz: 'Invalid/Zone', from, count: 5 })).toEqual([]);

    // until before any run
    const until = new Date('2026-10-16T06:00:00Z');
    expect(quartzNextRuns(s, { tz: 'UTC', from, count: 5, until })).toEqual([]);
  });
});
