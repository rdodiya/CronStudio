import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { FAQS } from '@/lib/seo/faqs';
import { FaqJsonLd } from '@/components/faq-jsonld';
import { Sparkles, ArrowRight, HelpCircle, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Quartz Cron Generator — Sub-Second & Enterprise Scheduling',
  description:
    'Generate and validate 6 or 7 field Quartz cron expressions. Supports seconds, L, W, # symbols, and bidirectional conversion with Unix cron.',
  alternates: {
    canonical: '/quartz-cron-generator',
  },
};

export default function QuartzCronGeneratorPage() {
  const faqs = FAQS['/quartz-cron-generator'] || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      <FaqJsonLd faqs={faqs} />

      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Quartz Java & Spring Scheduler</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Quartz Cron Generator & Explainer
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg">
          Build, validate, and convert enterprise Quartz cron expressions with full support for
          seconds, question marks (?), nearest weekdays (W), last days (L), and nth weekdays (#).
        </p>
      </header>

      {/* Featured Quartz Schedules */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Common Quartz Patterns</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { expr: '*/10 * * * * ?', title: 'Every 10 Seconds', text: 'Sub-minute precision execution' },
            { expr: '0 0 12 L * ?', title: 'Last Day Of Month', text: 'At noon on the final calendar day' },
            { expr: '0 0 12 15W * ?', title: 'Nearest Weekday to 15th', text: 'Closest business day to the 15th' },
            { expr: '0 0 12 ? * 6#3', title: 'Third Friday of Month', text: 'At 12:00 on the 3rd Friday' },
          ].map((item, idx) => (
            <div key={idx} className="p-4 border rounded-xl bg-card space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{item.title}</span>
                <Link
                  href={`/?expr=${encodeURIComponent(item.expr)}&dialect=quartz`}
                  className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
                >
                  Inspect <ArrowRight className="w-3 h-3" />
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
        <h2 className="text-lg font-bold">Convert Between Unix and Quartz</h2>
        <p className="text-sm text-muted-foreground">
          Use Cron Studio to seamlessly translate Quartz schedules into standard Unix crons or
          vice-versa with automatic conflict detection and warning guidance.
        </p>
        <Link
          href="/?dialect=quartz"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Open Quartz Generator <ArrowRight className="w-4 h-4" />
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
