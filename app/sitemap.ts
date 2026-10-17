import { MetadataRoute } from 'next';
import { SEO_EXPRESSIONS } from '@/lib/seo/expressions';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://cronstudio.dev';

  const landingPages = [
    '',
    '/cron-expression-explainer',
    '/quartz-cron-generator',
    '/kubernetes-cronjob-schedule-generator',
    '/cron-next-run-calculator',
    '/aws-eventbridge-cron-expression',
  ];

  const staticEntries: MetadataRoute.Sitemap = landingPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date('2026-10-16T00:00:00Z'),
    changeFrequency: 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));

  const slugEntries: MetadataRoute.Sitemap = SEO_EXPRESSIONS.map((item) => ({
    url: `${baseUrl}/cron-expression/${item.slug}`,
    lastModified: new Date('2026-10-16T00:00:00Z'),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticEntries, ...slugEntries];
}
