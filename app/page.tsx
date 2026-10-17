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
import { Clock, ShieldCheck, Share2, AlertCircle } from 'lucide-react';

function CronStudioMain() {
  const { state, nowIssue } = useCron();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg tracking-tight">Cron Studio</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Developer-grade cron schedule builder, explainer & safety validator
              </p>
            </div>
          </div>

          {/* Global Header Controls */}
          <div className="flex items-center gap-2">
            <DialectSelector />
            <TimezoneSelector />
            <ShareUrl />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Share Hydration Banner */}
        {state.fromShare && (
          <div
            data-testid="share-banner"
            className="flex items-center gap-2.5 p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary font-medium"
          >
            <Share2 className="w-4 h-4 shrink-0" />
            <span>
              Schedule loaded from shared link ({state.dialect} dialect &middot; timezone:{' '}
              {state.tz})
            </span>
          </div>
        )}

        {/* Invalid Now Override Alert */}
        {nowIssue && (
          <div className="flex items-center gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{nowIssue}</span>
          </div>
        )}

        {/* Primary Interactive Panels: 2 columns on lg, 1 column on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Expression Input, Builder, Explanation, Safety, Export */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <CronInput />
            <VisualBuilder />
            <ExplanationPanel />
            <SafetyChecks />
            <ExportPanel />
          </div>

          {/* Right Column: Frequency Summary, Visual Timeline, Calendar, Next Runs Table */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <FrequencySummary />
            <Timeline />
            <Calendar />
            <NextRunsTable />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 mt-12 bg-muted/20 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>100% Client-Side Privacy: Schedules and data never leave your browser.</span>
          </div>
          <p>
            Cron Studio &middot; MIT License &middot; Multi-dialect engine supporting Unix, Quartz,
            EventBridge, GitHub, Kubernetes & Vercel.
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
