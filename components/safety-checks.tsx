'use client';

import React from 'react';
import { useCron } from '@/hooks/useCron';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Scale,
} from 'lucide-react';

export function SafetyChecks() {
  const { analysis, state } = useCron();

  if (!state.expr.trim()) {
    return (
      <div className="border-2 border-border bg-card p-4 shadow-[4px_4px_0px_var(--border)] font-mono">
        <div className="flex items-center gap-2 mb-2 pb-1.5 border-b-2 border-border">
          <Scale className="w-4 h-4 text-foreground" />
          <h2 className="text-xs font-black uppercase tracking-wider text-foreground">
            SAFETY & COMPATIBILITY DIAGNOSTICS
          </h2>
        </div>
        <p className="text-xs text-muted-foreground">Empty expression. Enter a cron expression above.</p>
      </div>
    );
  }

  const { safety, badges } = analysis;
  const criticalCount = safety.filter((s) => s.severity === 'error').length;

  return (
    <div className="flex flex-col border-2 border-border bg-card shadow-[4px_4px_0px_var(--border)]">
      {/* Header Bar */}
      <div className="p-3 border-b-2 border-border bg-paper flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-foreground" />
          <h2 className="font-mono text-xs font-black uppercase tracking-wider text-foreground">
            SAFETY & COMPATIBILITY DIAGNOSTICS
          </h2>
        </div>
        <span
          className={`font-mono text-[10px] font-black uppercase border-2 border-border px-1.5 py-0.2 shadow-[1px_1px_0px_var(--border)] ${
            criticalCount > 0
              ? 'bg-destructive text-destructive-foreground'
              : 'bg-primary text-primary-foreground'
          }`}
        >
          {criticalCount} CRITICAL FAILS
        </span>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Safety Diagnostic Plates */}
        <div className="flex flex-col gap-2.5">
          {safety.length === 0 ? (
            <div className="flex items-center gap-2.5 p-3 bg-card border-2 border-border shadow-[2px_2px_0px_var(--border)] font-mono text-xs">
              <CheckCircle2 className="w-4 h-4 text-signal-green shrink-0" />
              <div>
                <span className="font-black uppercase text-foreground block">
                  PRODUCTION CONFINEMENT VERIFIED
                </span>
                <span className="text-muted-foreground">
                  Schedule passes all automated safety boundaries and rate limit policies.
                </span>
              </div>
            </div>
          ) : (
            safety.map((issue, idx) => {
              const isError = issue.severity === 'error';
              const isWarning = issue.severity === 'warning';

              return (
                <div
                  key={idx}
                  data-testid={`safety-${issue.severity}`}
                  className={`p-3 border-2 font-mono text-xs shadow-[2px_2px_0px_var(--border)] flex flex-col gap-1.5 ${
                    isError
                      ? 'bg-destructive/10 border-destructive text-destructive'
                      : isWarning
                      ? 'bg-secondary/15 border-secondary text-foreground'
                      : 'bg-card border-border text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between pb-1 border-b border-border/30">
                    <span
                      className={`font-black uppercase text-[10px] px-1.5 py-0.2 border ${
                        isError
                          ? 'bg-destructive text-destructive-foreground border-destructive'
                          : isWarning
                          ? 'bg-secondary text-secondary-foreground border-secondary'
                          : 'bg-primary text-primary-foreground border-border'
                      }`}
                    >
                      {issue.severity.toUpperCase()} ALERT
                    </span>
                    <span className="font-bold text-[10px] text-muted-foreground uppercase">
                      FIELD: {issue.field}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 pt-0.5">
                    {isError ? (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-destructive" />
                    ) : isWarning ? (
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-secondary" />
                    ) : (
                      <Info className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
                    )}
                    <span className="font-medium leading-relaxed">{issue.message}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Dialect Compatibility Badges Grid */}
        {badges.length > 0 && (
          <div className="p-3 bg-paper border-2 border-border shadow-[2px_2px_0px_var(--border)] flex flex-col gap-2">
            <span className="font-mono text-[10px] font-black uppercase text-muted-foreground block">
              ENGINE COMPATIBILITY MATRIX:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {badges.map((b, idx) => (
                <div
                  key={idx}
                  data-testid={b.ok ? 'badge-ok' : 'badge-bad'}
                  className="flex items-center justify-between bg-card border-2 border-border p-2 font-mono text-xs shadow-[1px_1px_0px_var(--border)]"
                >
                  <span className="font-bold text-foreground">{b.label}</span>
                  <span
                    className={`font-mono text-[9px] font-black uppercase px-1.5 py-0.2 border ${
                      b.ok
                        ? 'bg-primary text-primary-foreground border-border'
                        : 'bg-destructive text-destructive-foreground border-destructive'
                    }`}
                  >
                    {b.ok ? 'COMPATIBLE' : 'INCOMPATIBLE'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
