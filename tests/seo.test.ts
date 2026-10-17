import { describe, it, expect } from 'vitest';
import { SEO_EXPRESSIONS, SeoExpression } from '@/lib/seo/expressions';
import { FAQS } from '@/lib/seo/faqs';
import sitemap from '@/app/sitemap';
import { parse, nextRuns } from '@/lib/cron/index';
import fs from 'fs';
import path from 'path';

describe('Task 13: SEO expressions and metadata', () => {
  it('SEO_EXPRESSIONS has exactly 30 unique kebab-case slugs', () => {
    expect(SEO_EXPRESSIONS).toHaveLength(30);
    const slugs = SEO_EXPRESSIONS.map((e) => e.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(30);

    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('every entry parses successfully and yields upcoming runs', () => {
    const fixedNow = new Date('2026-10-16T00:00:00Z');
    for (const item of SEO_EXPRESSIONS) {
      const p = parse(item.expr, item.dialect);
      expect(p.ok, `Failed parsing ${item.expr} for dialect ${item.dialect}`).toBe(true);

      if (p.ok && 'schedule' in p) {
        const runs = nextRuns(p.schedule, {
          tz: 'UTC',
          from: fixedNow,
          count: 5,
        });
        expect(runs.length, `Expected runs > 0 for ${item.slug}`).toBeGreaterThan(0);
      }
    }
  });

  it('contains all 5 strictly required expressions', () => {
    const exprs = SEO_EXPRESSIONS.map((e) => e.expr);
    expect(exprs).toContain('*/15 9-18 * * 1-5');
    expect(exprs).toContain('0 9 * * 1');
    expect(exprs).toContain('0 0 1 * *');
    expect(exprs).toContain('0 9 * * 1-5');
    expect(exprs).toContain('0 0 1 1 *');
  });

  it('every FAQ answer is non-empty and answers cover landing pages', () => {
    const paths = Object.keys(FAQS);
    expect(paths.length).toBeGreaterThanOrEqual(5);

    for (const p of paths) {
      const faqs = FAQS[p];
      expect(faqs.length).toBeGreaterThan(0);
      for (const faq of faqs) {
        expect(faq.q.trim().length).toBeGreaterThan(5);
        expect(faq.a.trim().length).toBeGreaterThan(10);
      }
    }
  });

  it('sitemap returns 36 URLs and every landing path exists on disk', () => {
    const entries = sitemap();
    expect(entries).toHaveLength(36); // 1 root + 5 landing + 30 slug pages

    const appDir = path.resolve(process.cwd(), 'app');

    const expectedLandingDirs = [
      'cron-expression-explainer',
      'quartz-cron-generator',
      'kubernetes-cronjob-schedule-generator',
      'cron-next-run-calculator',
      'aws-eventbridge-cron-expression',
    ];

    for (const dir of expectedLandingDirs) {
      const pagePath = path.join(appDir, dir, 'page.tsx');
      expect(fs.existsSync(pagePath), `Page file ${pagePath} should exist`).toBe(true);
    }
  });
});
