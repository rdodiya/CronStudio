import { describe, it, expect } from 'vitest';
import { parseUnix } from '@/lib/cron/unix/parser';
import { unixNextRuns, unixDayMatches } from '@/lib/cron/unix/scheduler';
import { validateUnix } from '@/lib/cron/unix/validator';
import { UnixSchedule } from '@/lib/cron/types';

describe('Unix Scheduler and Validator', () => {
  const getSchedule = (expr: string): UnixSchedule => {
    const res = parseUnix(expr);
    if (!res.ok || res.schedule.kind !== 'unix') {
      throw new Error(`Failed to parse: ${expr}`);
    }
    return res.schedule;
  };

  it('0 9 * * 1-5 tz Asia/Kolkata → runs[0] = 2026-10-16T03:30:00Z, runs[1] = 2026-10-19T03:30:00Z', () => {
    const s = getSchedule('0 9 * * 1-5');
    const from = new Date('2026-10-16T00:00:00Z');
    const runs = unixNextRuns(s, { tz: 'Asia/Kolkata', from, count: 2 });
    expect(runs).toHaveLength(2);
    expect(runs[0].toISOString()).toBe('2026-10-16T03:30:00.000Z');
    expect(runs[1].toISOString()).toBe('2026-10-19T03:30:00.000Z');
  });

  it('0 12 * * * tz UTC → every run at 12:00Z, including across 2026-11-01', () => {
    const s = getSchedule('0 12 * * *');
    const from = new Date('2026-10-30T00:00:00Z');
    const runs = unixNextRuns(s, { tz: 'UTC', from, count: 5 });
    expect(runs).toHaveLength(5);
    for (const run of runs) {
      expect(run.getUTCHours()).toBe(12);
      expect(run.getUTCMinutes()).toBe(0);
      expect(run.toISOString().endsWith('12:00:00.000Z')).toBe(true);
    }
  });

  it('0 12 * * * tz America/New_York → 2026-10-30 run = 16:00Z; 2026-11-02 run = 17:00Z', () => {
    const s = getSchedule('0 12 * * *');
    const from = new Date('2026-10-29T00:00:00Z');
    const runs = unixNextRuns(s, { tz: 'America/New_York', from, count: 6 });
    // runs[0] = 2026-10-29T16:00:00Z
    // runs[1] = 2026-10-30T16:00:00Z
    // runs[2] = 2026-10-31T16:00:00Z
    // runs[3] = 2026-11-01T17:00:00Z
    // runs[4] = 2026-11-02T17:00:00Z
    const runOct30 = runs.find((r) => r.toISOString().startsWith('2026-10-30'));
    const runNov02 = runs.find((r) => r.toISOString().startsWith('2026-11-02'));
    expect(runOct30?.toISOString()).toBe('2026-10-30T16:00:00.000Z');
    expect(runNov02?.toISOString()).toBe('2026-11-02T17:00:00.000Z');
  });

  it('30 2 * * * NY from 2026-03-07T00:00Z until 2026-03-10Z → no run whose NY local time is 02:30 on 2026-03-08', () => {
    const s = getSchedule('30 2 * * *');
    const from = new Date('2026-03-07T00:00:00Z');
    const until = new Date('2026-03-10T00:00:00Z');
    const runs = unixNextRuns(s, { tz: 'America/New_York', from, count: 5, until });
    // Ruling: In America/New_York on 2026-03-08 (spring-forward gap), croner fires at 03:30 local time (2026-03-08T07:30:00Z);
    // no run exists whose NY local time is 02:30 on 2026-03-08.
    const runOnMarch8 = runs.find((r) => {
      const localDateStr = r.toLocaleDateString('en-US', { timeZone: 'America/New_York' });
      return localDateStr.startsWith('3/8/2026');
    });
    if (runOnMarch8) {
      const localTimeStr = runOnMarch8.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: false });
      expect(localTimeStr.startsWith('02:30')).toBe(false);
    }
  });

  it('30 1 * * * NY from 2026-10-31T00:00Z until 2026-11-03Z → exactly one run on local date 2026-11-01', () => {
    const s = getSchedule('30 1 * * *');
    const from = new Date('2026-10-31T00:00:00Z');
    const until = new Date('2026-11-03T00:00:00Z');
    const runs = unixNextRuns(s, { tz: 'America/New_York', from, count: 5, until });
    // Ruling: In America/New_York on 2026-11-01 (fall-back overlap), croner produces exactly one run at 2026-11-01T05:30:00Z.
    const nov1Runs = runs.filter((r) => {
      const localDateStr = r.toLocaleDateString('en-US', { timeZone: 'America/New_York' });
      return localDateStr.startsWith('11/1/2026');
    });
    expect(nov1Runs).toHaveLength(1);
    expect(nov1Runs[0].toISOString()).toBe('2026-11-01T05:30:00.000Z');
  });

  it('London 30 1 * * *: gap 2026-03-29, overlap 2026-10-25', () => {
    const s = getSchedule('30 1 * * *');
    // Gap: 2026-03-29 (spring-forward)
    const runsGap = unixNextRuns(s, {
      tz: 'Europe/London',
      from: new Date('2026-03-28T00:00:00Z'),
      count: 3,
      until: new Date('2026-03-31T00:00:00Z'),
    });
    const march29Run = runsGap.find((r) => {
      const d = r.toLocaleDateString('en-GB', { timeZone: 'Europe/London' });
      return d.startsWith('29/03/2026');
    });
    if (march29Run) {
      const t = march29Run.toLocaleTimeString('en-GB', { timeZone: 'Europe/London', hour12: false });
      expect(t.startsWith('01:30')).toBe(false);
    }

    // Overlap: 2026-10-25 (fall-back)
    const runsOverlap = unixNextRuns(s, {
      tz: 'Europe/London',
      from: new Date('2026-10-24T00:00:00Z'),
      count: 3,
      until: new Date('2026-10-27T00:00:00Z'),
    });
    const oct25Runs = runsOverlap.filter((r) => {
      const d = r.toLocaleDateString('en-GB', { timeZone: 'Europe/London' });
      return d.startsWith('25/10/2026');
    });
    expect(oct25Runs).toHaveLength(1);
    // Ruling: London overlap run fires once at 2026-10-25T00:30:00Z (pre-transition BST)
    expect(oct25Runs[0].toISOString()).toBe('2026-10-25T00:30:00.000Z');
  });

  it('Sydney 30 2 * * *: gap 2026-10-04, overlap 2026-04-05; Auckland: gap 2026-09-27, overlap 2026-04-05', () => {
    const s = getSchedule('30 2 * * *');
    // Sydney gap
    const sydGap = unixNextRuns(s, {
      tz: 'Australia/Sydney',
      from: new Date('2026-10-03T00:00:00Z'),
      count: 3,
      until: new Date('2026-10-06T00:00:00Z'),
    });
    const sydOct4 = sydGap.find((r) => {
      const d = r.toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney' });
      return d.startsWith('4/10/2026') || d.startsWith('04/10/2026');
    });
    if (sydOct4) {
      const t = sydOct4.toLocaleTimeString('en-AU', { timeZone: 'Australia/Sydney', hour12: false });
      expect(t.startsWith('02:30')).toBe(false);
    }

    // Sydney overlap
    const sydOverlap = unixNextRuns(s, {
      tz: 'Australia/Sydney',
      from: new Date('2026-04-04T00:00:00Z'),
      count: 3,
      until: new Date('2026-04-07T00:00:00Z'),
    });
    const sydApr5 = sydOverlap.filter((r) => {
      const d = r.toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney' });
      return d.startsWith('5/4/2026') || d.startsWith('05/04/2026');
    });
    expect(sydApr5).toHaveLength(1);

    // Auckland gap
    const auckGap = unixNextRuns(s, {
      tz: 'Pacific/Auckland',
      from: new Date('2026-09-26T00:00:00Z'),
      count: 3,
      until: new Date('2026-09-29T00:00:00Z'),
    });
    const auckSep27 = auckGap.find((r) => {
      const d = r.toLocaleDateString('en-NZ', { timeZone: 'Pacific/Auckland' });
      return d.startsWith('27/09/2026') || d.startsWith('27/9/2026');
    });
    if (auckSep27) {
      const t = auckSep27.toLocaleTimeString('en-NZ', { timeZone: 'Pacific/Auckland', hour12: false });
      expect(t.startsWith('02:30')).toBe(false);
    }

    // Auckland overlap
    const auckOverlap = unixNextRuns(s, {
      tz: 'Pacific/Auckland',
      from: new Date('2026-04-04T00:00:00Z'),
      count: 3,
      until: new Date('2026-04-07T00:00:00Z'),
    });
    const auckApr5 = auckOverlap.filter((r) => {
      const d = r.toLocaleDateString('en-NZ', { timeZone: 'Pacific/Auckland' });
      return d.startsWith('5/04/2026') || d.startsWith('5/4/2026') || d.startsWith('05/04/2026');
    });
    expect(auckApr5).toHaveLength(1);
  });

  it('Asia/Tokyo and Asia/Kolkata: 0 9 * * * local hour is 9 for all 25 runs', () => {
    const s = getSchedule('0 9 * * *');
    const from = new Date('2026-10-16T00:00:00Z');

    const tokyoRuns = unixNextRuns(s, { tz: 'Asia/Tokyo', from, count: 25 });
    expect(tokyoRuns).toHaveLength(25);
    for (const r of tokyoRuns) {
      const h = parseInt(r.toLocaleTimeString('en-US', { timeZone: 'Asia/Tokyo', hour12: false, hour: '2-digit' }), 10);
      expect(h).toBe(9);
    }

    const kolkataRuns = unixNextRuns(s, { tz: 'Asia/Kolkata', from, count: 25 });
    expect(kolkataRuns).toHaveLength(25);
    for (const r of kolkataRuns) {
      const h = parseInt(r.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit' }), 10);
      expect(h).toBe(9);
    }
  });

  it('0 0 13 * 5 UTC from 2026-11-01: runs include 2026-11-06 AND 2026-11-13 AND 2026-11-20', () => {
    const s = getSchedule('0 0 13 * 5');
    const from = new Date('2026-11-01T00:00:00Z');
    const runs = unixNextRuns(s, { tz: 'UTC', from, count: 5 });
    const runIsoList = runs.map((r) => r.toISOString());
    expect(runIsoList).toContain('2026-11-06T00:00:00.000Z');
    expect(runIsoList).toContain('2026-11-13T00:00:00.000Z');
    expect(runIsoList).toContain('2026-11-20T00:00:00.000Z');

    // Also verify unixDayMatches for November 2026
    expect(unixDayMatches(s, 2026, 11, 6)).toBe(true); // Friday
    expect(unixDayMatches(s, 2026, 11, 13)).toBe(true); // Friday and 13th
    expect(unixDayMatches(s, 2026, 11, 20)).toBe(true); // Friday
    expect(unixDayMatches(s, 2026, 12, 13)).toBe(true); // 13th (Sunday) - matches DOM
    expect(unixDayMatches(s, 2026, 11, 7)).toBe(false); // Saturday, not 13th
  });

  it('0 0 31 2 * → [] and call finishes in < 1000 ms; validateUnix returns an error issue', () => {
    const s = getSchedule('0 0 31 2 *');
    const issues = validateUnix(s);
    expect(issues.some((i) => i.severity === 'error')).toBe(true);

    const start = Date.now();
    const runs = unixNextRuns(s, { tz: 'UTC', from: new Date('2026-10-16T00:00:00Z'), count: 25 });
    const duration = Date.now() - start;

    expect(runs).toEqual([]);
    expect(duration).toBeLessThan(1000);
  });

  it('0 0 29 2 * → runs[0] = 2028-02-29T00:00:00Z, runs[1] = 2032-02-29T00:00:00Z', () => {
    const s = getSchedule('0 0 29 2 *');
    const from = new Date('2026-10-16T00:00:00Z');
    const issues = validateUnix(s);
    expect(issues.filter((i) => i.severity === 'error')).toHaveLength(0);

    const runs = unixNextRuns(s, { tz: 'UTC', from, count: 2 });
    expect(runs).toHaveLength(2);
    expect(runs[0].toISOString()).toBe('2028-02-29T00:00:00.000Z');
    expect(runs[1].toISOString()).toBe('2032-02-29T00:00:00.000Z');
  });

  it('validateUnix reports error for empty field selections', () => {
    const emptySchedule: UnixSchedule = {
      kind: 'unix',
      raw: '',
      minutes: [],
      hours: [0],
      doms: [1],
      months: [1],
      dows: [0],
      domRestricted: false,
      dowRestricted: false,
    };
    const issues = validateUnix(emptySchedule);
    expect(issues.some((i) => i.field === 'expression')).toBe(true);
  });

  it('unixDayMatches handles month mismatch, impossible dates, and single restrictions', () => {
    const sMonthly = getSchedule('0 0 1 1 *'); // Jan 1 only
    expect(unixDayMatches(sMonthly, 2026, 2, 1)).toBe(false); // wrong month

    const sEveryDay = getSchedule('0 0 * * *');
    expect(unixDayMatches(sEveryDay, 2026, 2, 30)).toBe(false); // Feb 30 does not exist
    expect(unixDayMatches(sEveryDay, 2026, 4, 31)).toBe(false); // April 31 does not exist
    expect(unixDayMatches(sEveryDay, 2026, 1, 15)).toBe(true); // neither restricted

    const sDomOnly = getSchedule('0 0 15 * *');
    expect(unixDayMatches(sDomOnly, 2026, 1, 15)).toBe(true);
    expect(unixDayMatches(sDomOnly, 2026, 1, 16)).toBe(false);

    const sDowOnly = getSchedule('0 0 * * 1'); // Monday only
    expect(unixDayMatches(sDowOnly, 2026, 10, 19)).toBe(true); // Monday
    expect(unixDayMatches(sDowOnly, 2026, 10, 20)).toBe(false); // Tuesday
  });

  it('unixNextRuns handles count <= 0 and invalid timezones gracefully', () => {
    const s = getSchedule('0 9 * * *');
    const from = new Date('2026-10-16T00:00:00Z');

    expect(unixNextRuns(s, { tz: 'UTC', from, count: 0 })).toEqual([]);
    expect(unixNextRuns(s, { tz: 'UTC', from, count: -5 })).toEqual([]);
    expect(unixNextRuns(s, { tz: 'Invalid/NonExistentTimeZone_123', from, count: 5 })).toEqual([]);
  });
});
