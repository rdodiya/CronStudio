import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { FAQS } from '@/lib/seo/faqs';
import { FaqJsonLd } from '@/components/faq-jsonld';
import { Server, ArrowRight, HelpCircle, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Kubernetes CronJob Schedule Generator — batch/v1 Manifests',
  description:
    'Generate production-ready Kubernetes batch/v1 CronJob manifests with timeZone support, concurrency policies, and restart guarantees.',
  alternates: {
    canonical: '/kubernetes-cronjob-schedule-generator',
  },
};

export default function KubernetesCronjobGeneratorPage() {
  const faqs = FAQS['/kubernetes-cronjob-schedule-generator'] || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      <FaqJsonLd faqs={faqs} />

      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          <Server className="w-3.5 h-3.5" />
          <span>Kubernetes batch/v1</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Kubernetes CronJob Schedule Generator
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg">
          Configure bulletproof Kubernetes CronJobs with native timeZone specifications,
          concurrency policy selection, and zero-downtime schedule testing.
        </p>
      </header>

      {/* Featured Patterns */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Standard Cloud Native Schedules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { expr: '0 2 * * *', title: 'Nightly Database Backup', text: 'At 02:00 AM off-peak maintenance' },
            { expr: '0 * * * *', title: 'Hourly Log Archival', text: 'Top of each hour container sweep' },
            { expr: '*/15 * * * *', title: 'Queue Reconciliation', text: 'Every 15 minutes health ping' },
            { expr: '0 0 1 * *', title: 'Monthly Billing Batch', text: 'Midnight on the 1st of every month' },
          ].map((item, idx) => (
            <div key={idx} className="p-4 border rounded-xl bg-card space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{item.title}</span>
                <Link
                  href={`/?expr=${encodeURIComponent(item.expr)}&dialect=kubernetes&format=kubernetes`}
                  className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
                >
                  Generate YAML <ArrowRight className="w-3 h-3" />
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
        <h2 className="text-lg font-bold">Export YAML with Custom Timezone</h2>
        <p className="text-sm text-muted-foreground">
          Generate complete, copy-pasteable YAML manifests with `concurrencyPolicy: Forbid`,
          `historyLimits`, and custom container commands in seconds.
        </p>
        <Link
          href="/?format=kubernetes"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Open Manifest Generator <ArrowRight className="w-4 h-4" />
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
