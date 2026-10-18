'use client';

import React, { useMemo } from 'react';
import { useCron } from '@/hooks/useCron';
import { explain } from '@/lib/cron/formatter';
import { Megaphone, Info } from 'lucide-react';

export function ExplanationPanel() {
  const { state, liveParse } = useCron();

  const explanation = useMemo(() => {
    if (!liveParse.ok || !('schedule' in liveParse)) return null;
    return explain(liveParse.schedule, state.dialect, state.tz);
  }, [liveParse, state.dialect, state.tz]);

  if (!state.expr.trim()) {
    return (
      <div className="border-2 border-border bg-card p-4 shadow-[4px_4px_0px_var(--border)] font-mono">
        <span className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1">
          {`//`} NATURAL LANGUAGE SPECIFICATION
        </span>
        <p className="text-sm text-muted-foreground">Empty expression. Enter a cron expression above.</p>
      </div>
    );
  }

  if (!liveParse.ok || !explanation) {
    return (
      <div className="border-2 border-destructive bg-destructive/10 p-4 shadow-[4px_4px_0px_var(--border)] font-mono">
        <span className="text-xs font-black uppercase tracking-wider text-destructive block mb-1">
          {`//`} NATURAL LANGUAGE SPECIFICATION ERROR
        </span>
        <p className="text-sm font-bold text-destructive">Invalid cron expression syntax.</p>
      </div>
    );
  }

  const { summary, fields, notes } = explanation;

  return (
    <div className="flex flex-col border-2 border-border shadow-[4px_4px_0px_var(--border)] overflow-hidden">
      {/* Tier 2 Acid Volt Shouting Banner */}
      <div className="p-4 lg:p-5 bg-primary border-b-2 border-border text-primary-foreground">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Megaphone className="w-4 h-4 text-primary-foreground shrink-0" />
              <span className="font-mono text-[11px] font-black tracking-widest uppercase bg-card text-foreground px-2 py-0.5 border-2 border-border shadow-[2px_2px_0px_var(--border)]">
                {`//`} NATURAL LANGUAGE SPECIFICATION
              </span>
            </div>
            <h1
              data-testid="explanation-summary"
              className="text-xl sm:text-2xl lg:text-3xl font-extrabold uppercase tracking-tight text-primary-foreground leading-tight"
            >
              {summary}
            </h1>
          </div>
          <div className="font-mono text-xs font-bold bg-card text-foreground border-2 border-border px-3 py-1.5 shadow-[2px_2px_0px_var(--border)] shrink-0 self-start md:self-auto">
            Timezone: {state.tz} &middot; Deterministic Schedule
          </div>
        </div>
      </div>

      {/* Field Breakdown Ledger */}
      {fields.length > 0 && (
        <div className="p-4 bg-card flex flex-col gap-2">
          <span className="font-mono text-[10px] font-black uppercase text-muted-foreground">
            FIELD-BY-FIELD BREAKDOWN:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {fields.map((f) => {
              const fieldKey = f.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              return (
                <div
                  key={f.name}
                  data-testid={`explanation-field-${fieldKey}`}
                  className="flex flex-col p-2.5 bg-paper border-2 border-border shadow-[2px_2px_0px_var(--border)] font-mono text-xs"
                >
                  <div className="flex items-center justify-between pb-1 mb-1 border-b border-border/40">
                    <span className="font-black text-[11px] text-muted-foreground uppercase">{f.name}</span>
                    <span className="font-black bg-card border-2 border-border px-1.5 py-0.2 text-foreground">
                      {f.raw}
                    </span>
                  </div>
                  <div className="font-bold text-foreground text-[11px]">{f.text}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dialect Notes */}
      {notes.length > 0 && (
        <div className="p-3 bg-paper border-t-2 border-border font-mono text-xs flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 font-black uppercase text-muted-foreground">
            <Info className="w-3.5 h-3.5 text-foreground" />
            <span>DIALECT SPEC NOTES & SYMBOLS:</span>
          </div>
          <div className="flex flex-col gap-1 text-muted-foreground font-medium">
            {notes.map((note, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-primary font-black">&bull;</span>
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
