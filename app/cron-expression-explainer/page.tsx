import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { FAQS } from '@/lib/seo/faqs';
import { FaqJsonLd } from '@/components/faq-jsonld';
import { Clock, ArrowRight, HelpCircle, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cron Expression Explainer — Translate Cron to Plain English',
  description:
    'Free developer-grade cron expression explainer. Translate any standard Unix or Quartz cron syntax into plain English with Daylight Saving Time safety checks.',
  alternates: {
    canonical: '/cron-expression-explainer',
  },
};

export default function CronExpressionExplainerPage() {
  const faqs = FAQS['/cron-expression-explainer'] || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      <FaqJsonLd faqs={faqs} />

      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          <Clock className="w-3.5 h-3.5" />
          <span>Interactive Explainer</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Cron Expression Explainer
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg">
          Decode complex cron schedules into clear, human-readable English descriptions with
          automatic timezone, syntax, and DST conflict analysis.
        </p>
      </header>

      {/* Featured Examples */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Popular Schedule Patterns</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { expr: '*/15 9-18 * * 1-5', title: 'Business Hours', text: 'Every 15 min, Mon–Fri 9am–6pm' },
            { expr: '0 0 * * *', title: 'Daily Midnight', text: 'At 00:00 every day' },
            { expr: '0 9 * * 1', title: 'Weekly Monday', text: 'At 09:00 on Monday' },
            { expr: '0 0 1 * *', title: 'Monthly 1st', text: 'At 00:00 on day 1 of month' },
          ].map((item, idx) => (
            <div key={idx} className="p-4 border rounded-xl bg-card space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{item.title}</span>
                <Link
                  href={`/?expr=${encodeURIComponent(item.expr)}&dialect=unix`}
                  className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
                >
                  Test <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <code className="text-xs font-mono block bg-muted/50 p-1.5 rounded">{item.expr}</code>
              <p className="text-xs text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Launch CTA */}
      <section className="p-6 border rounded-xl bg-primary/5 space-y-4">
        <h2 className="text-lg font-bold">Analyze Your Custom Schedule</h2>
        <p className="text-sm text-muted-foreground">
          Paste your cron expression into Cron Studio to inspect upcoming runtimes across any IANA
          timezone, view visual execution timelines, and export directly to Kubernetes or GitHub
          Actions.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Open in Cron Studio <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* FAQs */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Frequently Asked Questions</h2>
        </div>
        <div className="divide-y border rounded-xl bg-card">
          {faqs.map((f, i) => (
            <div key={i} className="p-5 space-y-2">
              <h3 className="text-sm font-semibold flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{f.q}</span>
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-6">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
