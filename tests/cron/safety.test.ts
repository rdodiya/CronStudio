import { describe, it, expect } from 'vitest';
import { analyze, safetyChecks } from '@/lib/cron/safety';
import { parse } from '@/lib/cron/index';

describe('Task 8: Safety checks and analysis pipeline', () => {
  const now = new Date('2026-10-16T00:00:00Z');

  it('OR logic warning on unix DOM+DOW both restricted', () => {
    const res = analyze({
      expr: '0 0 13 * 5',
      dialect: 'unix',
      tz: 'UTC',
      now,
      runCount: 5,
    });
    expect(res.safety.some((s) => s.message.includes('OR'))).toBe(true);
    const runIsoDates = res.runs.map((r) => r.toISOString().slice(0, 10));
    expect(runIsoDates).toContain('2026-11-06'); // Friday
    expect(runIsoDates).toContain('2026-11-13'); // 13th (also Friday)
  });

  it('reports error when schedule never matches', () => {
    const res = analyze({
      expr: '0 0 31 2 *',
      dialect: 'unix',
      tz: 'UTC',
      now,
      runCount: 5,
    });
    expect(res.safety.some((s) => s.message.includes('never matches'))).toBe(true);
    expect(res.runs).toHaveLength(0);
    expect(res.explanation).not.toBeNull();
  });

  it('reports excessively frequent for sub-minute schedules', () => {
    const res = analyze({
      expr: '* * * * * ?',
      dialect: 'quartz',
      tz: 'UTC',
      now,
      runCount: 10,
    });
    expect(res.safety.some((s) => s.message.includes('excessively frequent'))).toBe(true);
  });

  it('reports warning for GitHub Actions minimum interval violation', () => {
    const res = analyze({
      expr: '*/1 * * * *',
      dialect: 'github',
      tz: 'UTC',
      now,
      runCount: 5,
    });
    expect(res.safety.some((s) => s.message.includes('5 minutes'))).toBe(true);
  });

  it('reports UTC-only warning when non-UTC timezone is selected for utcOnly dialects', () => {
    const resNy = analyze({
      expr: '0 9 * * *',
      dialect: 'vercel',
      tz: 'America/New_York',
      now,
      runCount: 5,
    });
    expect(resNy.safety.some((s) => s.message.includes('UTC'))).toBe(true);

    const resUtc = analyze({
      expr: '0 9 * * *',
      dialect: 'vercel',
      tz: 'UTC',
      now,
      runCount: 5,
    });
    expect(resUtc.safety.some((s) => s.message.includes('UTC'))).toBe(false);
  });

  it('reports business hours, weekday-only and weekend-only tags', () => {
    const resWeekday = analyze({
      expr: '0 9 * * 1-5',
      dialect: 'unix',
      tz: 'UTC',
      now,
      runCount: 5,
    });
    expect(resWeekday.safety.some((s) => s.message.includes('weekday-only'))).toBe(true);

    const resBiz = analyze({
      expr: '*/15 9-17 * * 1-5',
      dialect: 'unix',
      tz: 'UTC',
      now,
      runCount: 10,
    });
    expect(resBiz.safety.some((s) => s.message.includes('business hours'))).toBe(true);

    const resWeekend = analyze({
      expr: '0 12 * * 0,6',
      dialect: 'unix',
      tz: 'UTC',
      now,
      runCount: 5,
    });
    expect(resWeekend.safety.some((s) => s.message.includes('weekend-only'))).toBe(true);
  });

  it('handles invalid timezone gracefully with UTC fallback', () => {
    const res = analyze({
      expr: '0 9 * * *',
      dialect: 'unix',
      tz: 'Not/AZone',
      now,
      runCount: 5,
    });
    expect(res.parse.ok).toBe(true);
    expect(res.safety.some((s) => s.message.toLowerCase().includes('fallback to utc'))).toBe(true);
    expect(res.runs).toHaveLength(5);
  });

  it('handles garbage expressions gracefully', () => {
    const res = analyze({
      expr: 'garbage',
      dialect: 'unix',
      tz: 'UTC',
      now,
      runCount: 5,
    });
    expect(res.parse.ok).toBe(false);
    expect(res.runs).toHaveLength(0);
    expect(res.explanation).toBeNull();
  });
});
