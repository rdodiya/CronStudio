'use client';

import React from 'react';
import { useCron } from '@/hooks/useCron';
import { Gauge, CalendarCheck } from 'lucide-react';

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

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="flex items-center gap-2">
        <Gauge className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold">Frequency & Estimated Volume</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="flex flex-col p-3 rounded-lg bg-muted/30 border border-border/50">
          <span className="text-[11px] font-medium text-muted-foreground">Per Day</span>
          <span className="text-lg font-bold text-foreground tracking-tight font-mono">
            {fmt(freq.perDay)}
          </span>
          <span className="text-[10px] text-muted-foreground">average</span>
        </div>

        <div className="flex flex-col p-3 rounded-lg bg-muted/30 border border-border/50">
          <span className="text-[11px] font-medium text-muted-foreground">Per Week</span>
          <span className="text-lg font-bold text-foreground tracking-tight font-mono">
            {fmt(freq.perWeek)}
          </span>
          <span className="text-[10px] text-muted-foreground">average</span>
        </div>

        <div className="flex flex-col p-3 rounded-lg bg-muted/30 border border-border/50">
          <span className="text-[11px] font-medium text-muted-foreground">Per Month</span>
          <span className="text-lg font-bold text-foreground tracking-tight font-mono">
            {fmt(freq.perMonth)}
          </span>
          <span className="text-[10px] text-muted-foreground">average</span>
        </div>

        <div className="flex flex-col p-3 rounded-lg bg-primary/5 border border-primary/20">
          <span className="text-[11px] font-medium text-primary">Per Year</span>
          <span className="text-lg font-bold text-primary tracking-tight font-mono">
            {fmt(freq.perYear, 0)}
          </span>
          <span className="text-[10px] text-primary/80">total runs</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t">
        <CalendarCheck className="w-3.5 h-3.5 text-primary" />
        <span>
          Matches <strong className="text-foreground">{freq.matchingDays}</strong> days in the next 365 days.
        </span>
      </div>
    </div>
  );
}
