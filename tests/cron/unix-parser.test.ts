import { describe, it, expect } from 'vitest';
import { parseUnix } from '@/lib/cron/unix/parser';

describe('parseUnix', () => {
  it('parses 0 9 * * 1-5', () => {
    const r = parseUnix('0 9 * * 1-5');
    expect(r.ok && r.schedule.kind === 'unix' && r.schedule.dows).toEqual([1, 2, 3, 4, 5]);
    if (r.ok && r.schedule.kind === 'unix') {
      expect(r.schedule.minutes).toEqual([0]);
      expect(r.schedule.hours).toEqual([9]);
      expect(r.schedule.doms).toHaveLength(31);
      expect(r.schedule.months).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      expect(r.schedule.domRestricted).toBe(false);
      expect(r.schedule.dowRestricted).toBe(true);
    }
  });

  it('minute 60 error names field', () => {
    const r = parseUnix('60 * * * *');
    expect(!r.ok && r.issues[0]).toMatchObject({ field: 'minute' });
    expect(!r.ok && r.issues[0].message).toContain('0-59');
  });

  it('wrong field count', () => {
    const r = parseUnix('* * * *');
    expect(!r.ok && r.issues[0]).toMatchObject({ field: 'expression' });
    expect(!r.ok && r.issues[0].message).toContain('expected 5 fields, got 4');
  });

  it('names, steps, lists', () => {
    const r = parseUnix('*/15 9-17 * JAN-MAR MON,WED');
    expect(r.ok).toBe(true);
    if (r.ok && r.schedule.kind === 'unix') {
      expect(r.schedule.minutes).toEqual([0, 15, 30, 45]);
      expect(r.schedule.hours).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17]);
      expect(r.schedule.months).toEqual([1, 2, 3]);
      expect(r.schedule.dows).toEqual([1, 3]);
    }
    const r7 = parseUnix('0 0 * * 7');
    expect(r7.ok).toBe(true);
    if (r7.ok && r7.schedule.kind === 'unix') {
      expect(r7.schedule.dows).toEqual([0]);
    }
  });

  it('flags restriction', () => {
    const r1 = parseUnix('0 0 13 * 5');
    expect(r1.ok).toBe(true);
    if (r1.ok && r1.schedule.kind === 'unix') {
      expect(r1.schedule.domRestricted).toBe(true);
      expect(r1.schedule.dowRestricted).toBe(true);
    }
    const r2 = parseUnix('0 0 * * *');
    expect(r2.ok).toBe(true);
    if (r2.ok && r2.schedule.kind === 'unix') {
      expect(r2.schedule.domRestricted).toBe(false);
      expect(r2.schedule.dowRestricted).toBe(false);
    }
  });

  it('parse_never_throws_on_garbage', () => {
    for (const s of ['', '   ', 'x'.repeat(10000), '😀 😀 😀 😀 😀', '<script>alert(1)</script>']) {
      expect(() => parseUnix(s)).not.toThrow();
      const r = parseUnix(s);
      expect(r.ok).toBe(false);
      expect(r.issues.length).toBeGreaterThan(0);
      expect(r.issues[0].field).toBeDefined();
    }
  });

  it('rejects @macros with a message', () => {
    const r = parseUnix('@daily');
    expect(r.ok).toBe(false);
    expect(r.issues[0].field).toBe('expression');
    expect(r.issues[0].message).toContain('@');
  });

  it('handles invalid step expressions and values', () => {
    expect(parseUnix('*/* * * * *').ok).toBe(false);
    expect(parseUnix('*/0 * * * *').ok).toBe(false);
    expect(parseUnix('*/-5 * * * *').ok).toBe(false);
    expect(parseUnix('1-2-3/5 * * * *').ok).toBe(false);
    expect(parseUnix('70-80/5 * * * *').ok).toBe(false);
    expect(parseUnix('10-5/2 * * * *').ok).toBe(false);
    expect(parseUnix('99/5 * * * *').ok).toBe(false);
    expect(parseUnix('*/abc * * * *').ok).toBe(false);
  });

  it('handles invalid range expressions', () => {
    expect(parseUnix('1-2-3 * * * *').ok).toBe(false);
    expect(parseUnix('5-1 * * * *').ok).toBe(false);
    expect(parseUnix('0-70 * * * *').ok).toBe(false);
    expect(parseUnix('FOO-BAR * * * *').ok).toBe(false);
  });

  it('handles empty list elements, unknown values and non-string inputs', () => {
    expect(parseUnix('0,,15 * * * *').ok).toBe(false);
    expect(parseUnix('FOO * * * *').ok).toBe(false);
    expect(parseUnix(123 as unknown as string).ok).toBe(false);
  });
});
