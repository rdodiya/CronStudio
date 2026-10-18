'use client';

import React from 'react';
import { CronProvider } from '@/context/CronContext';
import { useCron } from '@/hooks/useCron';
import { DialectSelector } from '@/components/dialect-selector';
import { TimezoneSelector } from '@/components/timezone-selector';
import { ThemeToggle } from '@/components/theme-toggle';
import { ShareUrl } from '@/components/share-url';
import { CronInput } from '@/components/cron-input';
import { VisualBuilder } from '@/components/visual-builder';
import { ExplanationPanel } from '@/components/explanation-panel';
import { SafetyChecks } from '@/components/safety-checks';
import { ExportPanel } from '@/components/export-panel';
import { FrequencySummary } from '@/components/frequency-summary';
import { Timeline } from '@/components/timeline';
import { Calendar } from '@/components/calendar';
import { NextRunsTable } from '@/components/next-runs-table';
import { Terminal, Shield, Share2, AlertCircle } from 'lucide-react';

function CronStudioMain() {
  const { state, nowIssue } = useCron();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground font-sans">
      {/* Top Running Header / Brand Bar */}
      <header className="w-full bg-card border-b-2 border-border sticky top-0 z-50">
        <div className="max-w-[1720px] mx-auto px-4 lg:px-6 h-14 flex items-center justify-between gap-4">
          {/* Left Brand & Status */}
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

          {/* Right Meta Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-paper border-2 border-border shadow-[2px_2px_0px_var(--border)]">
              <Shield className="w-3.5 h-3.5 text-foreground" />
              <span className="font-mono text-[11px] font-bold text-foreground">
                100% CLIENT-SIDE | ZERO TELEMETRY
              </span>
            </div>
            <ShareUrl />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Workbench Container */}
      <main className="max-w-[1720px] w-full mx-auto px-3 sm:px-4 lg:px-6 py-5 flex flex-col gap-6">
        {/* Share Hydration Banner */}
        {state.fromShare && (
          <div
            data-testid="share-banner"
            className="flex items-center gap-2.5 p-3 border-2 border-border bg-primary text-primary-foreground font-mono text-xs font-black shadow-[3px_3px_0px_var(--border)]"
          >
            <Share2 className="w-4 h-4 shrink-0" />
            <span>
              {`//`} SCHEDULE LOADED FROM SHARED LINK &middot; DIALECT: {state.dialect.toUpperCase()} &middot; TIMEZONE: {state.tz}
            </span>
          </div>
        )}

        {/* Invalid Now Override Alert */}
        {nowIssue && (
          <div className="flex items-center gap-2.5 p-3 border-2 border-secondary bg-secondary/15 text-foreground font-mono text-xs font-bold shadow-[3px_3px_0px_var(--border)]">
            <AlertCircle className="w-4 h-4 shrink-0 text-secondary" />
            <span>{nowIssue}</span>
          </div>
        )}

        {/* Global Control Bar Deck */}
        <section className="w-full bg-paper border-2 border-border p-3 lg:px-4 lg:py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-[4px_4px_0px_var(--border)]">
          <div className="flex flex-wrap items-center gap-3">
            <DialectSelector />
            <TimezoneSelector />
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] font-black">
            <span className="px-2 py-1 bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0px_var(--border)]">
              STATE: VERIFIED VALID
            </span>
          </div>
        </section>

        {/* Natural Language Specification Hero Banner */}
        <ExplanationPanel />

        {/* Raw Cron Input & Frequency KPIs Deck */}
        <div className="flex flex-col gap-6">
          <CronInput />
          <FrequencySummary />
        </div>

        {/* Two-Column Workbench Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Visual Builder, Safety & Diagnostics, Exporters */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <VisualBuilder />
            <SafetyChecks />
            <ExportPanel />
          </div>

          {/* Right Column: Visual Timeline, Calendar Matrix, Upcoming Runs Ledger */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <Timeline />
            <Calendar />
            <NextRunsTable />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-border py-5 mt-10 bg-card font-mono text-xs text-muted-foreground">
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

export default function Home() {
  return (
    <CronProvider>
      <CronStudioMain />
    </CronProvider>
  );
}
