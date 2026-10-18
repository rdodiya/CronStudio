'use client';

import React from 'react';
import { useCron } from '@/hooks/useCron';
import { Gauge } from 'lucide-react';

export function FrequencySummary() {
  const { analysis, state } = useCron();
  const freq = analysis.frequency;

  if (!state.expr.trim() || !freq) {
    return null;
  }

  const fmt = (n: number, decimals = 1) => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: n % 1 === 0 ? 0 : decimals,
    }).format(n);
  };

  const densityPercent = Math.min(100, Math.round((freq.matchingDays / 365) * 100));

  return (
    <div className="flex flex-col md:flex-row items-stretch justify-between gap-3 p-4 bg-paper border-2 border-border shadow-[4px_4px_0px_var(--border)]">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-1">
        <div className="bg-card border-2 border-border p-2.5 shadow-[2px_2px_0px_var(--border)]">
          <span className="font-mono text-[10px] font-black uppercase text-muted-foreground block">
            FREQUENCY
          </span>
          <div className="flex items-baseline gap-1 my-0.5">
            <span className="font-mono text-xl sm:text-2xl font-black text-foreground">
              {fmt(freq.perDay)}
            </span>
            <span className="font-mono text-[11px] font-bold text-muted-foreground">/ DAY avg</span>
          </div>
          <span className="font-mono text-[9px] text-muted-foreground uppercase">Calculated rate</span>
        </div>

        <div className="bg-card border-2 border-border p-2.5 shadow-[2px_2px_0px_var(--border)]">
          <span className="font-mono text-[10px] font-black uppercase text-muted-foreground block">
            WEEKLY RUNS
          </span>
          <div className="flex items-baseline gap-1 my-0.5">
            <span className="font-mono text-xl sm:text-2xl font-black text-foreground">
              {fmt(freq.perWeek)}
            </span>
            <span className="font-mono text-[11px] font-bold text-muted-foreground">/ WEEK runs</span>
          </div>
          <span className="font-mono text-[9px] text-muted-foreground uppercase">Aggregated cycle</span>
        </div>

        <div className="bg-card border-2 border-border p-2.5 shadow-[2px_2px_0px_var(--border)]">
          <span className="font-mono text-[10px] font-black uppercase text-muted-foreground block">
            MONTHLY VOLUME
          </span>
          <div className="flex items-baseline gap-1 my-0.5">
            <span className="font-mono text-xl sm:text-2xl font-black text-foreground">
              {fmt(freq.perMonth)}
            </span>
            <span className="font-mono text-[11px] font-bold text-muted-foreground">/ MONTH avg</span>
          </div>
          <span className="font-mono text-[9px] text-muted-foreground uppercase">Active cadence</span>
        </div>

        <div className="bg-card border-2 border-border p-2.5 shadow-[2px_2px_0px_var(--border)]">
          <span className="font-mono text-[10px] font-black uppercase text-muted-foreground block">
            ANNUAL ESTIMATE
          </span>
          <div className="flex items-baseline gap-1 my-0.5">
            <span className="font-mono text-xl sm:text-2xl font-black text-primary">
              {fmt(freq.perYear, 0)}
            </span>
            <span className="font-mono text-[11px] font-bold text-muted-foreground">/ YEAR total</span>
          </div>
          <span className="font-mono text-[9px] text-muted-foreground uppercase">Next 365 days</span>
        </div>
      </div>

      {/* Density Gauge Badge */}
      <div className="bg-card border-2 border-border p-3 shadow-[2px_2px_0px_var(--border)] flex items-center gap-3 shrink-0">
        <div className="w-12 h-12 bg-primary text-primary-foreground border-2 border-border flex items-center justify-center font-mono font-black text-lg shadow-[2px_2px_0px_var(--border)]">
          {densityPercent}%
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1 font-mono text-[11px] font-black uppercase text-foreground">
            <Gauge className="w-3.5 h-3.5 text-primary" />
            <span>SCHEDULE DENSITY</span>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground">
            Matches <strong className="text-foreground">{freq.matchingDays} days</strong> in next 365d ({densityPercent}% coverage)
          </span>
        </div>
      </div>
    </div>
  );
}
