import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { FAQS } from '@/lib/seo/faqs';
import { FaqJsonLd } from '@/components/faq-jsonld';
import { Calendar, ArrowRight, HelpCircle, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cron Next Run Calculator — Calculate Upcoming Execution Times',
  description:
    'Calculate the next 25, 50, or 100 execution dates for any cron schedule with local and UTC times side-by-side and Daylight Saving Time shift warnings.',
  alternates: {
    canonical: '/cron-next-run-calculator',
  },
};

export default function CronNextRunCalculatorPage() {
  const faqs = FAQS['/cron-next-run-calculator'] || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      <FaqJsonLd faqs={faqs} />

      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          <Calendar className="w-3.5 h-3.5" />
          <span>Execution Date Calculator</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Cron Next Run Calculator
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg">
          Accurately project upcoming execution dates up to 100 runs into the future across any
          world timezone with side-by-side UTC comparison.
        </p>
      </header>

      {/* Featured Calculations */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Frequently Calculated Schedules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { expr: '0 9 * * 1-5', title: 'Weekdays At 9 AM', text: 'Daily business morning triggers' },
            { expr: '*/30 * * * *', title: 'Half-Hourly Jobs', text: 'Twice an hour cadence' },
            { expr: '0 0 1 1 *', title: 'Annual New Year Run', text: 'Jan 1 midnight execution' },
            { expr: '0 12 * * 6,0', title: 'Weekend Midday Tasks', text: 'Noon on Saturday and Sunday' },
          ].map((item, idx) => (
            <div key={idx} className="p-4 border rounded-xl bg-card space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{item.title}</span>
                <Link
                  href={`/?expr=${encodeURIComponent(item.expr)}&dialect=unix`}
                  className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
                >
                  Calculate Runs <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <code className="text-xs font-mono block bg-muted/50 p-1.5 rounded">{item.expr}</code>
              <p className="text-xs text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="p-6 border rounded-xl bg-primary/5 space-y-4">
        <h2 className="text-lg font-bold">Inspect Interactive Timeline & Calendar</h2>
        <p className="text-sm text-muted-foreground">
          See your execution schedule projected onto a 7, 14, or 30-day timeline graph and monthly
          calendar matrix to verify there are no unintended gaps or excessive run spikes.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Open Calculator <ArrowRight className="w-4 h-4" />
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
