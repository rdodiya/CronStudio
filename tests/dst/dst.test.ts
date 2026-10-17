import { describe, it, expect } from 'vitest';
import {
  transitions,
  flagRun,
  dstWarnings,
} from '@/lib/dst';
import {
  browserTz,
  isValidTz,
  listTzs,
  formatLocal,
  formatUtc,
} from '@/lib/timezone';
import { parse } from '@/lib/cron/index';

describe('Task 6: Timezone and DST utilities', () => {
  const from = new Date('2026-01-01T00:00:00Z');
  const to = new Date('2027-01-01T00:00:00Z');

  it('detects transitions for America/New_York', () => {
    const trs = transitions('America/New_York', from, to);
    expect(trs).toHaveLength(2);
    expect(trs[0]).toEqual({
      at: new Date('2026-03-08T07:00:00.000Z'),
      kind: 'gap',
      offsetBeforeMin: -300,
      offsetAfterMin: -240,
    });
    expect(trs[1]).toEqual({
      at: new Date('2026-11-01T06:00:00.000Z'),
      kind: 'overlap',
      offsetBeforeMin: -240,
      offsetAfterMin: -300,
    });
  });

  it('detects transitions for Europe/London', () => {
    const trs = transitions('Europe/London', from, to);
    expect(trs).toHaveLength(2);
    expect(trs[0]).toEqual({
      at: new Date('2026-03-29T01:00:00.000Z'),
      kind: 'gap',
      offsetBeforeMin: 0,
      offsetAfterMin: 60,
    });
    expect(trs[1]).toEqual({
      at: new Date('2026-10-25T01:00:00.000Z'),
      kind: 'overlap',
      offsetBeforeMin: 60,
      offsetAfterMin: 0,
    });
  });

  it('detects transitions for Australia/Sydney', () => {
    const trs = transitions('Australia/Sydney', from, to);
    expect(trs).toHaveLength(2);
    expect(trs[0]).toEqual({
      at: new Date('2026-04-04T16:00:00.000Z'),
      kind: 'overlap',
      offsetBeforeMin: 660,
      offsetAfterMin: 600,
    });
    expect(trs[1]).toEqual({
      at: new Date('2026-10-03T16:00:00.000Z'),
      kind: 'gap',
      offsetBeforeMin: 600,
      offsetAfterMin: 660,
    });
  });

  it('detects transitions for Pacific/Auckland', () => {
    const trs = transitions('Pacific/Auckland', from, to);
    expect(trs).toHaveLength(2);
    expect(trs[0]).toEqual({
      at: new Date('2026-04-04T14:00:00.000Z'),
      kind: 'overlap',
      offsetBeforeMin: 780,
      offsetAfterMin: 720,
    });
    expect(trs[1]).toEqual({
      at: new Date('2026-09-26T14:00:00.000Z'),
      kind: 'gap',
      offsetBeforeMin: 720,
      offsetAfterMin: 780,
    });
  });

  it('returns empty transitions for non-DST zones', () => {
    expect(transitions('Asia/Kolkata', from, to)).toEqual([]);
    expect(transitions('Asia/Tokyo', from, to)).toEqual([]);
    expect(transitions('UTC', from, to)).toEqual([]);
  });

  it('flagRun detects runs within overlap window', () => {
    const trs = transitions('America/New_York', from, to);
    // Overlap at 2026-11-01T06:00:00Z, delta is 60 min.
    // 2026-11-01T05:30:00Z is in [at - delta, at + delta)
    const runInOverlap = new Date('2026-11-01T05:30:00Z');
    expect(flagRun(runInOverlap, trs)).toBe('dst-overlap');

    const runOutside = new Date('2026-11-01T08:00:00Z');
    expect(flagRun(runOutside, trs)).toBeNull();
  });

  it('dstWarnings catches missing and repeated hours', () => {
    const ny = 'America/New_York';
    const pGap = parse('30 2 * * *', 'unix');
    expect(pGap.ok).toBe(true);
    if (pGap.ok) {
      const w = dstWarnings(pGap.schedule, ny, from, to);
      expect(w.some((issue) => issue.message.includes('does not exist'))).toBe(true);
    }

    const pOverlap = parse('30 1 * * *', 'unix');
    expect(pOverlap.ok).toBe(true);
    if (pOverlap.ok) {
      const w = dstWarnings(pOverlap.schedule, ny, from, to);
      expect(w.some((issue) => issue.message.includes('twice'))).toBe(true);
    }

    // Wildcard hour -> no warning
    const pWild = parse('*/30 * * * *', 'unix');
    if (pWild.ok) {
      expect(dstWarnings(pWild.schedule, ny, from, to)).toEqual([]);
    }

    // No DST zone -> no warning
    if (pGap.ok) {
      expect(dstWarnings(pGap.schedule, 'Asia/Tokyo', from, to)).toEqual([]);
    }
  });

  it('timezone helpers', () => {
    expect(isValidTz('Not/AZone')).toBe(false);
    expect(isValidTz('Asia/Kolkata')).toBe(true);
    expect(isValidTz('America/New_York')).toBe(true);

    const bTz = browserTz();
    expect(typeof bTz).toBe('string');
    expect(isValidTz(bTz)).toBe(true);

    const tzs = listTzs();
    expect(tzs).toContain('UTC');
    expect(tzs).toContain('America/New_York');

    const d = new Date('2026-10-16T12:00:00Z');
    expect(formatLocal(d, 'America/New_York')).toContain('2026-10-16 08:00:00');
    expect(formatUtc(d)).toBe('2026-10-16 12:00:00 UTC');
  });
});
