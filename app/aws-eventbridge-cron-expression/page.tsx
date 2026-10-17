import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { FAQS } from '@/lib/seo/faqs';
import { FaqJsonLd } from '@/components/faq-jsonld';
import { Cloud, ArrowRight, HelpCircle, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AWS EventBridge Cron & Rate Expression Generator',
  description:
    'Build and validate AWS EventBridge and CloudWatch cron(min hrs dom mon dow year) and rate(N unit) expressions with UTC compliance checks.',
  alternates: {
    canonical: '/aws-eventbridge-cron-expression',
  },
};

export default function AwsEventBridgeCronPage() {
  const faqs = FAQS['/aws-eventbridge-cron-expression'] || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      <FaqJsonLd faqs={faqs} />

      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          <Cloud className="w-3.5 h-3.5" />
          <span>Amazon EventBridge & CloudWatch</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          AWS EventBridge Cron Expression Generator
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg">
          Construct valid AWS 6-field cron and rate expressions. Ensure compliance with EventBridge
          rules, including mandatory question marks (?) and strict UTC execution semantics.
        </p>
      </header>

      {/* Featured Patterns */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Standard EventBridge Patterns</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { expr: 'rate(5 minutes)', title: 'Every 5 Minutes (Rate)', text: 'Periodic recurring interval' },
            { expr: 'cron(0 8 ? * * *)', title: 'Daily at 8:00 AM UTC', text: 'Morning UTC trigger' },
            { expr: 'cron(0 12 ? * MON-FRI *)', title: 'Weekdays at 12:00 UTC', text: 'Business hours noon run' },
            { expr: 'cron(0 0 1 * ? *)', title: '1st of Month UTC', text: 'Monthly reconciliation trigger' },
          ].map((item, idx) => (
            <div key={idx} className="p-4 border rounded-xl bg-card space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{item.title}</span>
                <Link
                  href={`/?expr=${encodeURIComponent(item.expr)}&dialect=eventbridge`}
                  className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
                >
                  Verify Rule <ArrowRight className="w-3 h-3" />
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
        <h2 className="text-lg font-bold">Generate CloudFormation & CLI Rules</h2>
        <p className="text-sm text-muted-foreground">
          Cron Studio formats AWS EventBridge cron rules with warnings whenever expressions conflict
          with AWS requirements or when non-UTC timezones are accidentally applied.
        </p>
        <Link
          href="/?dialect=eventbridge&format=eventbridge"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Open EventBridge Builder <ArrowRight className="w-4 h-4" />
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
