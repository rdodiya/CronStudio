import { describe, it, expect } from 'vitest';
import { parse } from '@/lib/cron/index';
import { explain } from '@/lib/cron/formatter';
import { QUARTZ_SYMBOL_HELP } from '@/lib/cron/quartz/symbols';

describe('Task 7: Plain-English formatter', () => {
  it('formats standard unix expressions', () => {
    const p1 = parse('0 9 * * 1-5', 'unix');
    expect(p1.ok).toBe(true);
    if (p1.ok) {
      const exp = explain(p1.schedule, 'unix', 'UTC');
      expect(exp.summary).toBe('At 09:00, Monday through Friday');
      expect(exp.fields).toHaveLength(5);
    }

    const p2 = parse('*/15 9-18 * * *', 'unix');
    expect(p2.ok).toBe(true);
    if (p2.ok) {
      const exp = explain(p2.schedule, 'unix', 'UTC');
      expect(exp.summary.toLowerCase()).toContain('every 15 minutes');
      expect(exp.summary).toMatch(/(?:9|09).*18/);
    }

    const p3 = parse('0 0 1 * *', 'unix');
    expect(p3.ok).toBe(true);
    if (p3.ok) {
      const exp = explain(p3.schedule, 'unix', 'UTC');
      expect(exp.summary.toLowerCase()).toContain('day 1 of the month');
    }

    // Additional unix branches
    const p4 = parse('* * * * *', 'unix');
    if (p4.ok) {
      const exp = explain(p4.schedule, 'unix', 'UTC');
      expect(exp.summary).toContain('Every minute');
    }

    const p5 = parse('30 */2 1,15 1,6 0,6', 'unix');
    if (p5.ok) {
      const exp = explain(p5.schedule, 'unix', 'UTC');
      expect(exp.fields[0].text).toBe('At minute 30');
      expect(exp.fields[1].text).toBe('Every 2 hours');
      expect(exp.fields[2].text).toBe('On day 1,15 of the month');
      expect(exp.fields[3].text).toContain('January, June');
      expect(exp.fields[4].text).toBe('Saturday and Sunday');
    }

    const p6 = parse('0 9-17 * * 2', 'unix');
    if (p6.ok) {
      const exp = explain(p6.schedule, 'unix', 'UTC');
      expect(exp.fields[1].text).toContain('Between 09:00 and 17:59');
      expect(exp.fields[4].text).toContain('Tuesday');
    }
  });

  it('formats quartz expressions and notes special symbols', () => {
    const p1 = parse('0 0 9 ? * 2', 'quartz');
    expect(p1.ok).toBe(true);
    if (p1.ok) {
      const exp = explain(p1.schedule, 'quartz', 'UTC');
      expect(exp.summary).toContain('Monday');
      expect(
        exp.notes.some(
          (n) => n.includes('Quartz weekday numbering') && n.includes('1 = Sunday')
        )
      ).toBe(true);
      expect(exp.fields.length).toBeGreaterThanOrEqual(6);
    }

    const pL = parse('0 0 12 L * ?', 'quartz');
    if (pL.ok) {
      const exp = explain(pL.schedule, 'quartz', 'UTC');
      expect(exp.notes).toContain(QUARTZ_SYMBOL_HELP.L);
      expect(exp.fields[3].text).toBe('Last day of the month');
    }

    const pLW = parse('0 0 12 LW * ?', 'quartz');
    if (pLW.ok) {
      const exp = explain(pLW.schedule, 'quartz', 'UTC');
      expect(exp.fields[3].text).toBe('Last weekday of the month');
    }

    const pW = parse('0 0 12 15W * ?', 'quartz');
    if (pW.ok) {
      const exp = explain(pW.schedule, 'quartz', 'UTC');
      expect(exp.notes).toContain(QUARTZ_SYMBOL_HELP.W);
      expect(exp.fields[3].text).toContain('Nearest weekday to day 15');
    }

    const pHash = parse('0 0 12 ? * 6#3', 'quartz');
    if (pHash.ok) {
      const exp = explain(pHash.schedule, 'quartz', 'UTC');
      expect(exp.notes).toContain(QUARTZ_SYMBOL_HELP['#']);
      expect(exp.fields[5].text).toContain('3rd Friday');
    }

    const pHash1 = parse('0 0 12 ? * 1#1', 'quartz');
    if (pHash1.ok) {
      const exp = explain(pHash1.schedule, 'quartz', 'UTC');
      expect(exp.fields[5].text).toContain('1st Sunday');
    }

    const pHash2 = parse('0 0 12 ? * 2#2', 'quartz');
    if (pHash2.ok) {
      const exp = explain(pHash2.schedule, 'quartz', 'UTC');
      expect(exp.fields[5].text).toContain('2nd Monday');
    }

    const pHash4 = parse('0 0 12 ? * 5#4', 'quartz');
    if (pHash4.ok) {
      const exp = explain(pHash4.schedule, 'quartz', 'UTC');
      expect(exp.fields[5].text).toContain('4th Thursday');
    }

    const pLastDow = parse('0 0 12 ? * 6L', 'quartz');
    if (pLastDow.ok) {
      const exp = explain(pLastDow.schedule, 'quartz', 'UTC');
      expect(exp.fields[5].text).toContain('Last Friday');
    }

    const pQ = parse('0 0 12 1 * ?', 'quartz');
    if (pQ.ok) {
      const exp = explain(pQ.schedule, 'quartz', 'UTC');
      expect(exp.notes).toContain(QUARTZ_SYMBOL_HELP['?']);
    }

    const pSec = parse('*/10 * * * * ?', 'quartz');
    if (pSec.ok) {
      const exp = explain(pSec.schedule, 'quartz', 'UTC');
      expect(exp.notes.some((n) => n.toLowerCase().includes('second'))).toBe(true);
    }

    const pSecFixed = parse('5 0 0 ? * *', 'quartz');
    if (pSecFixed.ok) {
      const exp = explain(pSecFixed.schedule, 'quartz', 'UTC');
      expect(exp.fields[0].text).toBe('At second 5');
    }

    const pSecAll = parse('* * * ? * *', 'quartz');
    if (pSecAll.ok) {
      const exp = explain(pSecAll.schedule, 'quartz', 'UTC');
      expect(exp.fields[0].text).toBe('Every second');
    }

    const pYear = parse('0 0 12 1 1 ? 2026-2030', 'quartz');
    if (pYear.ok) {
      const exp = explain(pYear.schedule, 'quartz', 'UTC');
      expect(exp.notes.some((n) => n.toLowerCase().includes('year'))).toBe(true);
      expect(exp.fields).toHaveLength(7);
      expect(exp.fields[6].text).toContain('2026-2030');
    }

    const pYearAll = parse('0 0 12 1 1 ? *', 'quartz');
    if (pYearAll.ok) {
      const exp = explain(pYearAll.schedule, 'quartz', 'UTC');
      expect(exp.fields[6].text).toBe('Every year');
    }

    const pQuartzDows = parse('0 0 12 ? * 2-6', 'quartz');
    if (pQuartzDows.ok) {
      const exp = explain(pQuartzDows.schedule, 'quartz', 'UTC');
      expect(exp.fields[5].text).toBe('Monday through Friday');
    }

    const pQuartzMultiHours = parse('0 */2 */3 ? 1,2 *', 'quartz');
    if (pQuartzMultiHours.ok) {
      const exp = explain(pQuartzMultiHours.schedule, 'quartz', 'UTC');
      expect(exp.fields[1].text).toBe('Every 2 minutes');
      expect(exp.fields[2].text).toBe('Every 3 hours');
      expect(exp.fields[4].text).toContain('January, February');
    }

    const pQuartzHourRange = parse('0 0 9-17 ? * *', 'quartz');
    if (pQuartzHourRange.ok) {
      const exp = explain(pQuartzHourRange.schedule, 'quartz', 'UTC');
      expect(exp.fields[2].text).toContain('Between 09:00 and 17:59');
    }
  });

  it('formats rate expressions', () => {
    const pRate = parse('rate(5 minutes)', 'eventbridge');
    expect(pRate.ok).toBe(true);
    if (pRate.ok) {
      const exp = explain(pRate.schedule, 'eventbridge', 'UTC');
      expect(exp.summary).toBe('Every 5 minutes');
      expect(exp.fields).toHaveLength(1);
    }

    const pRateHour = parse('rate(1 hour)', 'eventbridge');
    if (pRateHour.ok) {
      const exp = explain(pRateHour.schedule, 'eventbridge', 'UTC');
      expect(exp.summary).toBe('Every 1 hour');
    }
  });
});
