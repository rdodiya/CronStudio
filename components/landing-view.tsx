'use client';

import React from 'react';
import {
  Terminal,
  Clock,
  Shield,
  Globe,
  ArrowRight,
  SlidersHorizontal,
  Code2,
  Calendar,
  Layers,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { ThemeToggle } from './theme-toggle';

interface LandingViewProps {
  onOpenWorkbench: (expr?: string) => void;
}

export function LandingView({ onOpenWorkbench }: LandingViewProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground font-sans">
      {/* Top running header */}
      <header className="w-full bg-card border-b-2 border-border sticky top-0 z-50">
        <div className="max-w-[1720px] mx-auto px-4 lg:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 px-2.5 bg-primary text-primary-foreground border-2 border-border flex items-center gap-1.5 shadow-[2px_2px_0px_var(--border)]">
              <Terminal className="w-4 h-4" />
              <span className="font-mono font-black text-sm tracking-tight">CRON_STUDIO</span>
            </div>
            <span className="font-mono text-[11px] font-black px-2 py-0.5 bg-foreground text-background">
              v1.2 // PRO
            </span>
            <span className="hidden md:inline-block font-mono text-[11px] font-bold text-muted-foreground pl-2 border-l-2 border-border">
              Deterministic Schedule Compiler, Explainer & Safety Linter
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              data-testid="landing-launch-btn"
              onClick={() => onOpenWorkbench()}
              className="flex items-center gap-1.5 px-3.5 py-1 bg-primary text-primary-foreground border-2 border-border font-mono text-xs font-black uppercase shadow-[2px_2px_0px_var(--border)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:opacity-95 transition-none"
            >
              <span>LAUNCH WORKBENCH</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Landing Page Content */}
      <main className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 flex flex-col gap-12">
        {/* HERO SECTION */}
        <section className="flex flex-col lg:flex-row items-stretch gap-6 border-2 border-border bg-card p-6 lg:p-10 shadow-[6px_6px_0px_var(--border)]">
          <div className="lg:w-7/12 flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs font-bold">
                <span className="px-2 py-0.5 bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)]">
                  100% CLIENT-SIDE
                </span>
                <span className="px-2 py-0.5 bg-secondary text-secondary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)]">
                  MULTI-DIALECT COMPILER
                </span>
                <span className="px-2 py-0.5 bg-tertiary text-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)]">
                  ZERO DRIFT
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-none text-foreground">
                DETERMINISTIC CRON COMPILER &amp; SAFETY BENCH
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed font-medium">
                The authoritative developer toolkit for <strong>Unix</strong>, <strong>Quartz</strong>, <strong>AWS EventBridge</strong>, and <strong>Kubernetes</strong>.
                Convert ambiguous cron tokens into crisp plain English, simulate daylight saving transitions, inspect visual execution barcodes, and export production-ready manifests.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-4 border-t-2 border-border font-mono">
              <button
                type="button"
                data-testid="hero-explain-btn"
                onClick={() => onOpenWorkbench('0 9 * * 1-5')}
                className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground border-2 border-border text-sm font-black uppercase shadow-[4px_4px_0px_var(--border)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:opacity-95 transition-none"
              >
                <Sparkles className="w-4 h-4" />
                <span>EXPLAIN IN DETAIL IN WORKBENCH</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onOpenWorkbench('0 0 1 * *')}
                className="flex items-center gap-2 px-4 py-3 bg-card hover:bg-muted text-foreground border-2 border-border text-sm font-bold uppercase shadow-[2px_2px_0px_var(--border)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-none"
              >
                <Code2 className="w-4 h-4" />
                <span>TRY &ldquo;0 0 1 * *&rdquo;</span>
              </button>
            </div>
          </div>

          {/* Interactive Live Teaser Cassette */}
          <div className="lg:w-5/12 flex flex-col justify-between bg-paper p-5 border-2 border-border shadow-[4px_4px_0px_var(--border)]">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b-2 border-border">
                <span className="font-mono text-xs font-black uppercase text-muted-foreground">
                  {`//`} CRON SPECIFICATION BREAKDOWN
                </span>
                <span className="font-mono text-[10px] font-black bg-primary text-primary-foreground border border-border px-1.5 py-0.2">
                  VERIFIED PASS
                </span>
              </div>

              <div className="p-3 bg-card border-2 border-border shadow-[inset_2px_2px_0px_rgba(0,0,0,0.5)] font-mono">
                <span className="text-[10px] font-black uppercase text-muted-foreground block mb-1">
                  SAMPLE EXPRESSION:
                </span>
                <div className="text-xl sm:text-2xl font-black text-foreground tracking-widest">
                  0 9 * * 1-5
                </div>
              </div>

              {/* Plain English Translation Highlight */}
              <div className="p-3.5 bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)] flex flex-col gap-1">
                <span className="font-mono text-[10px] font-black uppercase bg-card text-foreground px-1.5 py-0.2 border border-border self-start">
                  PLAIN-ENGLISH TRANSLATION
                </span>
                <div className="text-base sm:text-lg font-black uppercase tracking-tight leading-tight">
                  &ldquo;At 09:00, Monday through Friday&rdquo;
                </div>
                <span className="font-mono text-[10px] font-bold text-primary-foreground/90 mt-1">
                  Runs every weekday at 9:00 AM in your selected timezone with zero schedule drift.
                </span>
              </div>

              {/* 5 Token Anatomy Preview */}
              <div className="grid grid-cols-5 gap-1.5 text-center font-mono">
                <div className="bg-card border-2 border-border p-1.5 shadow-[1px_1px_0px_var(--border)]">
                  <span className="text-[9px] font-bold text-muted-foreground block">MIN</span>
                  <span className="text-sm font-black">0</span>
                </div>
                <div className="bg-card border-2 border-border p-1.5 shadow-[1px_1px_0px_var(--border)]">
                  <span className="text-[9px] font-bold text-muted-foreground block">HOUR</span>
                  <span className="text-sm font-black">9</span>
                </div>
                <div className="bg-card border-2 border-border p-1.5 shadow-[1px_1px_0px_var(--border)]">
                  <span className="text-[9px] font-bold text-muted-foreground block">DOM</span>
                  <span className="text-sm font-black">*</span>
                </div>
                <div className="bg-card border-2 border-border p-1.5 shadow-[1px_1px_0px_var(--border)]">
                  <span className="text-[9px] font-bold text-muted-foreground block">MON</span>
                  <span className="text-sm font-black">*</span>
                </div>
                <div className="bg-primary/20 border-2 border-border p-1.5 shadow-[1px_1px_0px_var(--border)]">
                  <span className="text-[9px] font-bold text-foreground block">DOW</span>
                  <span className="text-sm font-black text-foreground">1-5</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenWorkbench('0 9 * * 1-5')}
              className="mt-4 w-full py-2.5 bg-card hover:bg-primary hover:text-primary-foreground border-2 border-border font-mono text-xs font-black uppercase shadow-[2px_2px_0px_var(--border)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center justify-center gap-2"
            >
              <span>OPEN THIS IN WORKBENCH</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* CORE PRODUCT CAPABILITIES GRID */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b-2 border-border">
            <div className="flex items-center gap-2 font-mono">
              <Layers className="w-5 h-5 text-primary" />
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-foreground">
                CORE SYSTEM CAPABILITIES
              </h2>
            </div>
            <span className="font-mono text-xs font-bold text-muted-foreground">
              ALL FEATURES RUN 100% IN YOUR BROWSER
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Feature 1 */}
            <div className="border-2 border-border bg-card p-5 flex flex-col justify-between gap-4 shadow-[4px_4px_0px_var(--border)]">
              <div className="flex flex-col gap-2">
                <div className="w-10 h-10 bg-primary text-primary-foreground border-2 border-border flex items-center justify-center shadow-[2px_2px_0px_var(--border)]">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="font-mono text-base font-black uppercase text-foreground">
                  PLAIN-ENGLISH TRANSLATOR
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Instant natural language decomposition. Every token (seconds, minutes, hours, day of month, month, day of week, year) is resolved into deterministic human English with precise dialect nuances.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenWorkbench('*/15 9-18 * * 1-5')}
                className="font-mono text-xs font-bold text-foreground hover:text-primary flex items-center gap-1 pt-2 border-t border-border/40"
              >
                <span>Inspect Business Hours</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Feature 2 */}
            <div className="border-2 border-border bg-card p-5 flex flex-col justify-between gap-4 shadow-[4px_4px_0px_var(--border)]">
              <div className="flex flex-col gap-2">
                <div className="w-10 h-10 bg-secondary text-secondary-foreground border-2 border-border flex items-center justify-center shadow-[2px_2px_0px_var(--border)]">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="font-mono text-base font-black uppercase text-foreground">
                  DST BISECTION & SAFETY LINTER
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Detect dangerous Daylight Saving Time gaps (non-existent wall-clock hours) and fallback ambiguities (doubled hours). Validates production thresholds to prevent sub-minute API throttling.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenWorkbench('30 2 * * *')}
                className="font-mono text-xs font-bold text-foreground hover:text-secondary flex items-center gap-1 pt-2 border-t border-border/40"
              >
                <span>Inspect DST Gap Case</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Feature 3 */}
            <div className="border-2 border-border bg-card p-5 flex flex-col justify-between gap-4 shadow-[4px_4px_0px_var(--border)]">
              <div className="flex flex-col gap-2">
                <div className="w-10 h-10 bg-tertiary text-foreground border-2 border-border flex items-center justify-center shadow-[2px_2px_0px_var(--border)]">
                  <Globe className="w-5 h-5" />
                </div>
                <h3 className="font-mono text-base font-black uppercase text-foreground">
                  MULTI-DIALECT TRANSPILER
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Effortlessly switch between Unix 5-field, Quartz 6/7-field, AWS EventBridge, and Kubernetes CronJob syntax. Automatically handles Quartz mutual exclusion (<code className="font-bold">?</code>) and 0 vs 1 weekday indexing.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenWorkbench('0 0 9 ? * 2-6 *')}
                className="font-mono text-xs font-bold text-foreground hover:text-primary flex items-center gap-1 pt-2 border-t border-border/40"
              >
                <span>Inspect Quartz Expression</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Feature 4 */}
            <div className="border-2 border-border bg-card p-5 flex flex-col justify-between gap-4 shadow-[4px_4px_0px_var(--border)]">
              <div className="flex flex-col gap-2">
                <div className="w-10 h-10 bg-primary text-primary-foreground border-2 border-border flex items-center justify-center shadow-[2px_2px_0px_var(--border)]">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <h3 className="font-mono text-base font-black uppercase text-foreground">
                  VISUAL BUILDER &amp; PRESETS
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Hardware test-bench ergonomics with tactile cadence tabs (Minutes, Hourly, Daily, Weekly, Monthly) and individual weekday micro-switches. Bi-directionally compiles to and from raw syntax.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenWorkbench('0 12 * * 1-5')}
                className="font-mono text-xs font-bold text-foreground hover:text-primary flex items-center gap-1 pt-2 border-t border-border/40"
              >
                <span>Launch Visual Builder</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Feature 5 */}
            <div className="border-2 border-border bg-card p-5 flex flex-col justify-between gap-4 shadow-[4px_4px_0px_var(--border)]">
              <div className="flex flex-col gap-2">
                <div className="w-10 h-10 bg-secondary text-secondary-foreground border-2 border-border flex items-center justify-center shadow-[2px_2px_0px_var(--border)]">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="font-mono text-base font-black uppercase text-foreground">
                  BARCODE TIMELINE & CALENDAR
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  View scheduled trigger dispersion across 7, 14, or 30 days. Monthly calendar heatmap shows active invocation days and density metrics with exact local and UTC comparisons.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenWorkbench('0 0 1,15 * *')}
                className="font-mono text-xs font-bold text-foreground hover:text-secondary flex items-center gap-1 pt-2 border-t border-border/40"
              >
                <span>Inspect Bi-Monthly Calendar</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Feature 6 */}
            <div className="border-2 border-border bg-card p-5 flex flex-col justify-between gap-4 shadow-[4px_4px_0px_var(--border)]">
              <div className="flex flex-col gap-2">
                <div className="w-10 h-10 bg-primary text-primary-foreground border-2 border-border flex items-center justify-center shadow-[2px_2px_0px_var(--border)]">
                  <Code2 className="w-5 h-5" />
                </div>
                <h3 className="font-mono text-base font-black uppercase text-foreground">
                  INFRASTRUCTURE EXPORTERS
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Export ready-to-commit configuration manifests for Kubernetes CronJobs, GitHub Actions workflows, AWS EventBridge rules, Vercel cron JSON, and Cloudflare Worker TOML.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenWorkbench('0 0 * * *')}
                className="font-mono text-xs font-bold text-foreground hover:text-primary flex items-center gap-1 pt-2 border-t border-border/40"
              >
                <span>Export Daily Midnight</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </section>

        {/* POPULAR CRON SCHEDULE PATTERNS TABLE */}
        <section className="flex flex-col gap-4 border-2 border-border bg-card p-6 shadow-[4px_4px_0px_var(--border)]">
          <div className="flex items-center justify-between pb-2 border-b-2 border-border">
            <h2 className="font-mono text-base font-black uppercase tracking-wider text-foreground">
              COMMONLY USED SCHEDULE FORMULAS
            </h2>
            <span className="font-mono text-xs font-bold text-muted-foreground">
              CLICK ANY ROW TO EXPLAIN IN WORKBENCH
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead className="bg-paper text-foreground border-b-2 border-border">
                <tr className="uppercase font-black">
                  <th className="py-2.5 px-3 border-r-2 border-border">CRON SYNTAX</th>
                  <th className="py-2.5 px-3 border-r-2 border-border">PLAIN-ENGLISH MEANING</th>
                  <th className="py-2.5 px-3 border-r-2 border-border">DIALECT</th>
                  <th className="py-2.5 px-3 border-r-2 border-border">EXECUTION FREQUENCY</th>
                  <th className="py-2.5 px-3 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-border/20">
                {[
                  {
                    expr: '0 9 * * 1-5',
                    meaning: 'At 09:00, Monday through Friday',
                    dialect: 'Unix',
                    frequency: '5 runs / week',
                  },
                  {
                    expr: '*/15 9-18 * * 1-5',
                    meaning: 'Every 15 minutes, between 09:00 and 18:59, Monday through Friday',
                    dialect: 'Unix',
                    frequency: '200 runs / week',
                  },
                  {
                    expr: '0 0 * * *',
                    meaning: 'At 00:00 (Midnight) every day',
                    dialect: 'Unix / K8s',
                    frequency: 'Daily (365/yr)',
                  },
                  {
                    expr: '0 0 1 * *',
                    meaning: 'At 00:00 on day 1 of the month',
                    dialect: 'Unix',
                    frequency: 'Monthly (12/yr)',
                  },
                  {
                    expr: '0 0 9 ? * 2-6 *',
                    meaning: 'At 09:00:00 AM, Monday through Friday',
                    dialect: 'Quartz',
                    frequency: '5 runs / week',
                  },
                  {
                    expr: '0 0 12 ? * MON *',
                    meaning: 'At 12:00:00 PM on Monday',
                    dialect: 'Quartz',
                    frequency: 'Weekly (52/yr)',
                  },
                  {
                    expr: '0 0 1 1 *',
                    meaning: 'At 00:00 on day 1 of January (Annual)',
                    dialect: 'Unix',
                    frequency: 'Yearly (1/yr)',
                  },
                ].map((row, idx) => (
                  <tr
                    key={idx}
                    onClick={() => onOpenWorkbench(row.expr)}
                    className="hover:bg-primary/20 cursor-pointer transition-none"
                  >
                    <td className="py-2.5 px-3 border-r-2 border-border/20 font-black text-foreground">
                      <code className="bg-paper px-1.5 py-0.5 border border-border">
                        {row.expr}
                      </code>
                    </td>
                    <td className="py-2.5 px-3 border-r-2 border-border/20 font-bold text-foreground">
                      {row.meaning}
                    </td>
                    <td className="py-2.5 px-3 border-r-2 border-border/20 text-muted-foreground">
                      {row.dialect}
                    </td>
                    <td className="py-2.5 px-3 border-r-2 border-border/20 text-muted-foreground">
                      {row.frequency}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenWorkbench(row.expr);
                        }}
                        className="px-2.5 py-1 bg-primary text-primary-foreground font-black uppercase border-2 border-border shadow-[1px_1px_0px_var(--border)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                      >
                        EXPLAIN
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* BOTTOM CTA BANNER */}
        <section className="p-8 lg:p-12 bg-primary text-primary-foreground border-2 border-border shadow-[6px_6px_0px_var(--border)] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs font-black uppercase bg-card text-foreground px-2 py-0.5 border-2 border-border shadow-[2px_2px_0px_var(--border)] self-start">
              READY FOR PRODUCTION DEPLOYMENT
            </span>
            <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight leading-tight">
              NEVER DEPLOY AN UNVERIFIED CRON SCHEDULE TO PRODUCTION
            </h2>
            <p className="text-xs sm:text-sm font-bold text-primary-foreground/90 max-w-2xl">
              Zero telemetry. Zero cookies. 100% deterministic local compiler engine built for DevOps engineers and backend architects.
            </p>
          </div>

          <button
            type="button"
            data-testid="bottom-launch-workbench"
            onClick={() => onOpenWorkbench()}
            className="px-6 py-4 bg-card text-foreground hover:bg-paper border-2 border-border font-mono text-sm font-black uppercase shadow-[4px_4px_0px_var(--border)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none shrink-0 flex items-center gap-2"
          >
            <span>LAUNCH CRON STUDIO WORKBENCH</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-border py-6 mt-12 bg-card font-mono text-xs text-muted-foreground">
        <div className="max-w-[1720px] mx-auto px-4 lg:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-foreground font-bold">
            <Shield className="w-4 h-4 text-signal-green" />
            <span>100% Client-Side Privacy: Schedules and data never leave your browser.</span>
          </div>
          <p className="font-medium">
            CRON STUDIO &middot; Neo-Brutalist Developer Workbench &middot; MIT License
          </p>
        </div>
      </footer>
    </div>
  );
}
