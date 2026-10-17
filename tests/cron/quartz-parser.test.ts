import { describe, it, expect } from 'vitest';
import { parseQuartz } from '@/lib/cron/quartz/parser';
import { validateQuartz } from '@/lib/cron/quartz/validator';
import { getQuartzDowName } from '@/lib/cron/quartz/symbols';

describe('Quartz Parser and Validator', () => {
  it('parses 0 0 12 ? * MON-FRI', () => {
    const r = parseQuartz('0 0 12 ? * MON-FRI');
    expect(r.ok).toBe(true);
    if (r.ok && r.schedule.kind === 'quartz') {
      expect(r.schedule.seconds).toEqual([0]);
      expect(r.schedule.minutes).toEqual([0]);
      expect(r.schedule.hours).toEqual([12]);
      expect(r.schedule.dom).toEqual({ type: 'any' });
      expect(r.schedule.months).toHaveLength(12);
      expect(r.schedule.dow).toEqual({ type: 'values', values: [2, 3, 4, 5, 6] });
      expect(r.schedule.years).toBeNull();
    }
  });

  it('fails with error on dayOfWeek containing "?" when both DOM and DOW are unspecified (* * *)', () => {
    const r = parseQuartz('0 0 12 * * *');
    expect(r.ok).toBe(false);
    const dowIssue = r.issues.find((i) => i.field === 'dayOfWeek');
    expect(dowIssue).toBeDefined();
    expect(dowIssue?.message).toContain('?');
  });

  it('fails with error mentioning "?" when both DOM and DOW are specified (1 * 2)', () => {
    const r = parseQuartz('0 0 12 1 * 2');
    expect(r.ok).toBe(false);
    expect(r.issues.some((i) => i.message.includes('?'))).toBe(true);
  });

  it('parses special quartz expressions: L-3, LW, 15W, 6#3, 6L, */10, years', () => {
    // L-3
    const rL3 = parseQuartz('0 0 12 L-3 * ?');
    expect(rL3.ok).toBe(true);
    if (rL3.ok && rL3.schedule.kind === 'quartz') {
      expect(rL3.schedule.dom).toEqual({ type: 'lastOffset', offset: 3 });
    }

    // LW
    const rLW = parseQuartz('0 0 12 LW * ?');
    expect(rLW.ok).toBe(true);
    if (rLW.ok && rLW.schedule.kind === 'quartz') {
      expect(rLW.schedule.dom).toEqual({ type: 'lastWeekday' });
    }

    // 15W
    const r15W = parseQuartz('0 0 12 15W * ?');
    expect(r15W.ok).toBe(true);
    if (r15W.ok && r15W.schedule.kind === 'quartz') {
      expect(r15W.schedule.dom).toEqual({ type: 'nearestWeekday', day: 15 });
    }

    // 6#3
    const r63 = parseQuartz('0 0 12 ? * 6#3');
    expect(r63.ok).toBe(true);
    if (r63.ok && r63.schedule.kind === 'quartz') {
      expect(r63.schedule.dow).toEqual({ type: 'nthDayOfWeek', day: 6, nth: 3 });
    }

    // 6L
    const r6L = parseQuartz('0 0 12 ? * 6L');
    expect(r6L.ok).toBe(true);
    if (r6L.ok && r6L.schedule.kind === 'quartz') {
      expect(r6L.schedule.dow).toEqual({ type: 'lastDayOfWeek', day: 6 });
    }

    // */10 seconds
    const rSec = parseQuartz('*/10 * * * * ?');
    expect(rSec.ok).toBe(true);
    if (rSec.ok && rSec.schedule.kind === 'quartz') {
      expect(rSec.schedule.seconds).toEqual([0, 10, 20, 30, 40, 50]);
    }

    // Year range 2026-2030 (7 fields)
    const rYear = parseQuartz('0 0 12 ? * * 2026-2030');
    expect(rYear.ok).toBe(true);
    if (rYear.ok && rYear.schedule.kind === 'quartz') {
      expect(rYear.schedule.years).toEqual([2026, 2027, 2028, 2029, 2030]);
    }
  });

  it('rejects out of range values', () => {
    const rDom = parseQuartz('0 0 12 32 * ?');
    expect(rDom.ok).toBe(false);
    expect(rDom.issues.some((i) => i.field === 'dayOfMonth')).toBe(true);

    const rDow = parseQuartz('0 0 12 ? * 8');
    expect(rDow.ok).toBe(false);
    expect(rDow.issues.some((i) => i.field === 'dayOfWeek')).toBe(true);

    const rNth = parseQuartz('0 0 12 ? * 6#6');
    expect(rNth.ok).toBe(false);
    expect(rNth.issues.some((i) => i.field === 'dayOfWeek')).toBe(true);
  });

  it('parses weekday 2 and confirms it means Monday in Quartz', () => {
    const r = parseQuartz('0 0 12 ? * 2');
    expect(r.ok).toBe(true);
    if (r.ok && r.schedule.kind === 'quartz') {
      expect(r.schedule.dow).toEqual({ type: 'values', values: [2] });
      expect(getQuartzDowName(2)).toBe('Monday');
    }
  });

  it('0 0 0 31 4 ? parses ok but validateQuartz reports issue "never matches"', () => {
    const r = parseQuartz('0 0 0 31 4 ?');
    expect(r.ok).toBe(true);
    if (r.ok && r.schedule.kind === 'quartz') {
      const issues = validateQuartz(r.schedule);
      expect(issues.some((i) => i.severity === 'error' && i.message.includes('never matches'))).toBe(true);
    }
  });

  it('parse_never_throws_on_garbage', () => {
    for (const s of ['', '   ', 'x'.repeat(10000), '😀 😀 😀 😀 😀', '<script>alert(1)</script>']) {
      expect(() => parseQuartz(s)).not.toThrow();
      const r = parseQuartz(s);
      expect(r.ok).toBe(false);
      expect(r.issues.length).toBeGreaterThan(0);
      expect(r.issues[0].field).toBeDefined();
    }
  });

  it('rejects macros, wrong field counts, both ? and non-string inputs', () => {
    expect(parseQuartz('@daily').ok).toBe(false);
    expect(parseQuartz('0 0 12 * *').ok).toBe(false); // 5 fields
    expect(parseQuartz('0 0 12 * * * 2026 extra').ok).toBe(false); // 8 fields
    expect(parseQuartz('0 0 12 ? * ?').ok).toBe(false); // both ?
    expect(parseQuartz(null as unknown as string).ok).toBe(false);
  });

  it('handles year wildcards and special year ranges', () => {
    const rStar = parseQuartz('0 0 12 ? * * *');
    expect(rStar.ok).toBe(true);
    if (rStar.ok && rStar.schedule.kind === 'quartz') {
      expect(rStar.schedule.years).toBeNull();
    }

    const rQ = parseQuartz('0 0 12 ? * * ?');
    expect(rQ.ok).toBe(true);
    if (rQ.ok && rQ.schedule.kind === 'quartz') {
      expect(rQ.schedule.years).toBeNull();
    }
  });

  it('rejects invalid step and range syntax in number lists', () => {
    expect(parseQuartz('0/0 0 12 ? * *').ok).toBe(false);
    expect(parseQuartz('0/1/2 0 12 ? * *').ok).toBe(false);
    expect(parseQuartz('*/abc 0 12 ? * *').ok).toBe(false);
    expect(parseQuartz('1-2-3/5 0 12 ? * *').ok).toBe(false);
    expect(parseQuartz('70-80/5 0 12 ? * *').ok).toBe(false);
    expect(parseQuartz('10-5/2 0 12 ? * *').ok).toBe(false);
    expect(parseQuartz('99/5 0 12 ? * *').ok).toBe(false);
    expect(parseQuartz('1-2-3 0 12 ? * *').ok).toBe(false);
    expect(parseQuartz('70-80 0 12 ? * *').ok).toBe(false);
    expect(parseQuartz('10-5 0 12 ? * *').ok).toBe(false);
    expect(parseQuartz('0,,15 0 12 ? * *').ok).toBe(false);
    expect(parseQuartz('FOO 0 12 ? * *').ok).toBe(false);
  });

  it('handles invalid DOM and DOW expressions', () => {
    expect(parseQuartz('0 0 12 L-0 * ?').ok).toBe(false);
    expect(parseQuartz('0 0 12 L-50 * ?').ok).toBe(false);
    expect(parseQuartz('0 0 12 0W * ?').ok).toBe(false);
    expect(parseQuartz('0 0 12 35W * ?').ok).toBe(false);
    expect(parseQuartz('0 0 12 LW5 * ?').ok).toBe(false);

    expect(parseQuartz('0 0 12 ? * 8L').ok).toBe(false);
    expect(parseQuartz('0 0 12 ? * 8#2').ok).toBe(false);
    expect(parseQuartz('0 0 12 ? * 6#0').ok).toBe(false);
    expect(parseQuartz('0 0 12 ? * 6#').ok).toBe(false);
  });

  it('validateQuartz handles empty schedules, impossible nearestWeekday and past years', () => {
    const emptyS = {
      kind: 'quartz' as const,
      raw: '',
      seconds: [],
      minutes: [0],
      hours: [12],
      dom: { type: 'any' as const },
      months: [1],
      dow: { type: 'any' as const },
      years: null,
    };
    expect(validateQuartz(emptyS).some((i) => i.field === 'expression')).toBe(true);

    const impossibleW = {
      kind: 'quartz' as const,
      raw: '',
      seconds: [0],
      minutes: [0],
      hours: [12],
      dom: { type: 'nearestWeekday' as const, day: 31 },
      months: [4], // April has 30 days
      dow: { type: 'any' as const },
      years: null,
    };
    expect(validateQuartz(impossibleW).some((i) => i.field === 'dayOfMonth')).toBe(true);

    const pastYear = {
      kind: 'quartz' as const,
      raw: '',
      seconds: [0],
      minutes: [0],
      hours: [12],
      dom: { type: 'any' as const },
      months: [1],
      dow: { type: 'values' as const, values: [2] },
      years: [1960],
    };
    expect(validateQuartz(pastYear).some((i) => i.field === 'year')).toBe(true);

    expect(getQuartzDowName(99)).toBe('Day 99');
  });
});
