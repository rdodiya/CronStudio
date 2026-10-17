'use client';

import React, { useMemo } from 'react';
import { useCron } from '@/hooks/useCron';
import { explain } from '@/lib/cron/formatter';
import { Info, HelpCircle } from 'lucide-react';

export function ExplanationPanel() {
  const { state, liveParse } = useCron();

  const explanation = useMemo(() => {
    if (!liveParse.ok || !('schedule' in liveParse)) return null;
    return explain(liveParse.schedule, state.dialect, state.tz);
  }, [liveParse, state.dialect, state.tz]);

  if (!state.expr.trim()) {
    return (
      <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
        <h2 className="text-sm font-semibold mb-2">Plain-English Translation</h2>
        <p className="text-xs text-muted-foreground">Empty expression. Enter a cron expression above.</p>
      </div>
    );
  }

  if (!liveParse.ok || !explanation) {
    return (
      <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
        <h2 className="text-sm font-semibold mb-2">Plain-English Translation</h2>
        <p className="text-xs text-destructive">Invalid cron expression syntax.</p>
      </div>
    );
  }

  const { summary, fields, notes } = explanation;

  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider text-[11px] mb-1">
          Plain-English Translation
        </h2>
        <div
          data-testid="explanation-summary"
          className="text-base sm:text-lg font-medium text-foreground tracking-tight"
        >
          {summary}
        </div>
      </div>

      {/* Field breakdown */}
      {fields.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2 border-t">
          {fields.map((f) => {
            const fieldKey = f.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            return (
              <div
                key={f.name}
                data-testid={`explanation-field-${fieldKey}`}
                className="flex flex-col p-2 rounded-lg bg-muted/40 border border-border/50 text-xs"
              >
                <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground mb-0.5">
                  <span>{f.name}</span>
                  <span className="font-semibold text-foreground px-1 rounded bg-background border">
                    {f.raw}
                  </span>
                </div>
                <div className="text-foreground/90 font-medium">{f.text}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Notes & Special Symbols Help */}
      {notes.length > 0 && (
        <div className="flex flex-col gap-1.5 pt-2 border-t">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Info className="w-3.5 h-3.5" />
            <span>Notes & Symbols</span>
          </div>
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            {notes.map((note, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 shrink-0 text-primary mt-0.5" />
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
