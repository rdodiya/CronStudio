import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SEO_EXPRESSIONS } from '@/lib/seo/expressions';
import { parse, explain, nextRuns } from '@/lib/cron/index';
import { FaqJsonLd } from '@/components/faq-jsonld';
import { Clock, ArrowRight, Calendar, Info, ShieldCheck } from 'lucide-react';

interface Props {
  params: {
    slug: string;
  };
}

export const dynamicParams = false;

export function generateStaticParams() {
  return SEO_EXPRESSIONS.map((item) => ({
    slug: item.slug,
  }));
}

export function generateMetadata({ params }: Props): Metadata {
  const item = SEO_EXPRESSIONS.find((e) => e.slug === params.slug);
  if (!item) return { title: 'Schedule Not Found' };

  return {
    title: `${item.title} — Schedule Explainer & Next Runs`,
    description: `${item.blurb} Full plain-English breakdown, next execution dates in UTC and local time, and platform exporters for ${item.expr}.`,
    alternates: {
      canonical: `/cron-expression/${item.slug}`,
    },
  };
}

export default function CronExpressionSlugPage({ params }: Props) {
  const item = SEO_EXPRESSIONS.find((e) => e.slug === params.slug);
  if (!item) {
    notFound();
  }

  const p = parse(item.expr, item.dialect);
  const exp = p.ok && 'schedule' in p ? explain(p.schedule, item.dialect, 'UTC') : null;

  const fixedNow = new Date('2026-10-16T00:00:00Z');
  const sampleRuns: Date[] =
    p.ok && 'schedule' in p
      ? nextRuns(p.schedule, {
          tz: 'UTC',
          from: fixedNow,
          count: 5,
        })
      : [];

  const faqs = [
    {
      q: `What does the cron schedule "${item.expr}" mean?`,
      a: exp?.summary || item.blurb,
    },
    {
      q: `Which dialect and platforms support "${item.expr}"?`,
      a: `This expression is configured for the ${item.dialect} dialect and is fully compatible with modern schedulers including standard Unix, Kubernetes, GitHub Actions, AWS, and Cloudflare Workers.`,
    },
    {
      q: 'Does this schedule account for Daylight Saving Time?',
      a: 'When evaluated in local timezones that observe daylight saving shifts, runs occurring during spring-forward hour skips or fall-back repeated hours will be highlighted by Cron Studio safety checks.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
      <FaqJsonLd faqs={faqs} />

      {/* Header */}
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          <Clock className="w-3.5 h-3.5" />
          <span>{item.dialect.toUpperCase()} Dialect Pattern</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          {item.title}
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg">{item.blurb}</p>
      </header>

      {/* Expression Display Card */}
      <div className="p-6 border rounded-xl bg-card shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Expression
            </span>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-foreground">
              {item.expr}
            </div>
          </div>
          <Link
            href={`/?expr=${encodeURIComponent(item.expr)}&dialect=${item.dialect}`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shrink-0"
          >
            Open in Cron Studio <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {exp && (
          <div className="pt-4 border-t space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Plain English Summary
            </span>
            <p className="text-base font-medium text-foreground">{exp.summary}</p>
          </div>
        )}
      </div>

      {/* Field-by-Field Breakdown */}
      {exp && exp.fields.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            Field-by-Field Analysis
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {exp.fields.map((f, idx) => (
              <div key={idx} className="p-3.5 border rounded-lg bg-card space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    {f.name}
                  </span>
                  <code className="text-xs font-mono font-bold bg-muted/60 px-1.5 py-0.5 rounded">
                    {f.raw}
                  </code>
                </div>
                <p className="text-xs text-foreground/90">{f.text}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Next Upcoming Runs */}
      {sampleRuns.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Sample Next Execution Times (UTC)
          </h2>
          <div className="border rounded-xl bg-card divide-y">
            {sampleRuns.map((run, idx) => (
              <div key={idx} className="p-3 text-xs font-mono flex items-center justify-between">
                <span className="text-muted-foreground">Run #{idx + 1}</span>
                <span className="font-semibold">{run.toISOString().replace('.000Z', ' UTC')}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Want to see these in your local timezone?{' '}
            <Link
              href={`/?expr=${encodeURIComponent(item.expr)}&dialect=${item.dialect}`}
              className="text-primary underline font-medium"
            >
              Open in Cron Studio
            </Link>{' '}
            to select any IANA timezone.
          </p>
        </section>
      )}

      {/* Privacy Notice */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-4 border-t">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        <span>100% Client-Side Evaluation &middot; Zero Data Sent To Remote Servers</span>
      </div>
    </div>
  );
}
