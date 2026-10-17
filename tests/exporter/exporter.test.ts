import { describe, it, expect } from 'vitest';
import { parse, explain } from '@/lib/cron/index';
import { exportAs, ExportFormat } from '@/lib/cron/exporter';

describe('Task 9: Exporters', () => {
  const pUnix = parse('0 9 * * 1-5', 'unix');
  if (!pUnix.ok) throw new Error('Failed to parse test fixture');
  const expUnix = explain(pUnix.schedule, 'unix', 'Asia/Kolkata');

  it('exports kubernetes CronJob manifest', () => {
    const res = exportAs('kubernetes', {
      expr: '0 9 * * 1-5',
      dialect: 'unix',
      tz: 'Asia/Kolkata',
      schedule: pUnix.schedule,
      explanation: expUnix,
    });
    expect(res.text).toContain('schedule: "0 9 * * 1-5"');
    expect(res.text).toContain('timeZone: "Asia/Kolkata"');
    expect(res.text).toContain('concurrencyPolicy: Forbid');
  });

  it('exports github actions workflow with UTC check', () => {
    const resKolkata = exportAs('github', {
      expr: '0 9 * * 1-5',
      dialect: 'unix',
      tz: 'Asia/Kolkata',
      schedule: pUnix.schedule,
      explanation: expUnix,
    });
    expect(resKolkata.text).toContain("- cron: '0 9 * * 1-5'");
    expect(resKolkata.text).toContain('workflow_dispatch');
    expect(resKolkata.warnings.some((w) => w.includes('UTC'))).toBe(true);

    const resUtc = exportAs('github', {
      expr: '0 9 * * 1-5',
      dialect: 'unix',
      tz: 'UTC',
      schedule: pUnix.schedule,
      explanation: expUnix,
    });
    expect(resUtc.warnings).toHaveLength(0);
  });

  it('exports vercel cron json', () => {
    const res = exportAs('vercel', {
      expr: '0 9 * * 1-5',
      dialect: 'unix',
      tz: 'UTC',
      schedule: pUnix.schedule,
      explanation: expUnix,
    });
    const parsed = JSON.parse(res.text);
    expect(parsed.crons[0].schedule).toBe('0 9 * * 1-5');
  });

  it('exports eventbridge cron and rate when applicable', () => {
    const p5Min = parse('*/5 * * * *', 'unix');
    if (!p5Min.ok) throw new Error('fixture error');
    const exp5Min = explain(p5Min.schedule, 'unix', 'UTC');

    const res5 = exportAs('eventbridge', {
      expr: '*/5 * * * *',
      dialect: 'unix',
      tz: 'UTC',
      schedule: p5Min.schedule,
      explanation: exp5Min,
    });
    expect(res5.text).toContain('cron(*/5 * * * ? *)');
    expect(res5.text).toContain('rate(5 minutes)');

    const p7Min = parse('*/7 * * * *', 'unix');
    if (!p7Min.ok) throw new Error('fixture error');
    const exp7Min = explain(p7Min.schedule, 'unix', 'UTC');
    const res7 = exportAs('eventbridge', {
      expr: '*/7 * * * *',
      dialect: 'unix',
      tz: 'UTC',
      schedule: p7Min.schedule,
      explanation: exp7Min,
    });
    expect(res7.text).toContain('cron(*/7 * * * ? *)');
    expect(res7.text).not.toContain('rate(');

    // Hour rate
    const pHour = parse('0 */2 * * *', 'unix');
    if (pHour.ok) {
      const expHour = explain(pHour.schedule, 'unix', 'UTC');
      const resHour = exportAs('eventbridge', {
        expr: '0 */2 * * *',
        dialect: 'unix',
        tz: 'UTC',
        schedule: pHour.schedule,
        explanation: expHour,
      });
      expect(resHour.text).toContain('rate(2 hours)');
    }

    // Day rate
    const pDay = parse('0 0 * * *', 'unix');
    if (pDay.ok) {
      const expDay = explain(pDay.schedule, 'unix', 'UTC');
      const resDay = exportAs('eventbridge', {
        expr: '0 0 * * *',
        dialect: 'unix',
        tz: 'UTC',
        schedule: pDay.schedule,
        explanation: expDay,
      });
      expect(resDay.text).toContain('rate(1 day)');
    }

    // EventBridge with non-UTC tz
    const resEbNonUtc = exportAs('eventbridge', {
      expr: '0 9 * * *',
      dialect: 'unix',
      tz: 'America/New_York',
      schedule: pUnix.schedule,
      explanation: expUnix,
    });
    expect(resEbNonUtc.warnings.some((w) => w.includes('UTC'))).toBe(true);

    // Vercel with non-UTC tz
    const resVercelNonUtc = exportAs('vercel', {
      expr: '0 9 * * *',
      dialect: 'unix',
      tz: 'America/New_York',
      schedule: pUnix.schedule,
      explanation: expUnix,
    });
    expect(resVercelNonUtc.warnings.some((w) => w.includes('UTC'))).toBe(true);

    // Cloudflare with non-UTC tz
    const resCfNonUtc = exportAs('cloudflare-toml', {
      expr: '0 9 * * *',
      dialect: 'unix',
      tz: 'America/New_York',
      schedule: pUnix.schedule,
      explanation: expUnix,
    });
    expect(resCfNonUtc.warnings.some((w) => w.includes('UTC'))).toBe(true);

    const resCfJsoncNonUtc = exportAs('cloudflare-jsonc', {
      expr: '0 9 * * *',
      dialect: 'unix',
      tz: 'America/New_York',
      schedule: pUnix.schedule,
      explanation: expUnix,
    });
    expect(resCfJsoncNonUtc.warnings.some((w) => w.includes('UTC'))).toBe(true);
  });

  it('handles unsafe quartz to unix conversion', () => {
    const pQuartz = parse('0 0 12 L * ?', 'quartz');
    if (!pQuartz.ok) throw new Error('fixture error');
    const expQuartz = explain(pQuartz.schedule, 'quartz', 'UTC');

    const res = exportAs('kubernetes', {
      expr: '0 0 12 L * ?',
      dialect: 'quartz',
      tz: 'UTC',
      schedule: pQuartz.schedule,
      explanation: expQuartz,
    });
    expect(res.text).toBe('');
    expect(res.warnings.some((w) => w.includes('Conversion requires manual review'))).toBe(true);
  });

  it('exports cloudflare toml and jsonc', () => {
    const resToml = exportAs('cloudflare-toml', {
      expr: '0 9 * * 1-5',
      dialect: 'unix',
      tz: 'UTC',
      schedule: pUnix.schedule,
      explanation: expUnix,
    });
    expect(resToml.text).toContain('crons = ["0 9 * * 1-5"]');

    const resJsonc = exportAs('cloudflare-jsonc', {
      expr: '0 9 * * 1-5',
      dialect: 'unix',
      tz: 'UTC',
      schedule: pUnix.schedule,
      explanation: expUnix,
    });
    const stripped = resJsonc.text.replace(/\/\/.*$/gm, '');
    const parsed = JSON.parse(stripped);
    expect(parsed.triggers.crons[0]).toBe('0 9 * * 1-5');
  });

  it('exports raw expression and explanation', () => {
    const resExpr = exportAs('expression', {
      expr: '0 9 * * 1-5',
      dialect: 'unix',
      tz: 'UTC',
      schedule: pUnix.schedule,
      explanation: expUnix,
    });
    expect(resExpr.text).toBe('0 9 * * 1-5');

    const resExp = exportAs('explanation', {
      expr: '0 9 * * 1-5',
      dialect: 'unix',
      tz: 'UTC',
      schedule: pUnix.schedule,
      explanation: expUnix,
    });
    expect(resExp.text).toBe(expUnix.summary);
  });
});
