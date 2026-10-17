'use client';

import React from 'react';
import { useCron } from '@/hooks/useCron';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  ShieldCheck,
} from 'lucide-react';

export function SafetyChecks() {
  const { analysis, state } = useCron();

  if (!state.expr.trim()) {
    return (
      <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
        <h2 className="text-sm font-semibold mb-2">Safety & Compatibility</h2>
        <p className="text-xs text-muted-foreground">Empty expression. Enter a cron expression above.</p>
      </div>
    );
  }

  const { safety, badges } = analysis;

  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold">Safety & Compatibility Analysis</h2>
      </div>

      {/* Safety issues */}
      <div className="flex flex-col gap-2">
        {safety.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 bg-green-500/10 p-2.5 rounded-lg border border-green-500/20">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>No safety concerns detected. Schedule passes all validation rules.</span>
          </div>
        ) : (
          safety.map((issue, idx) => {
            const isError = issue.severity === 'error';
            const isWarning = issue.severity === 'warning';

            return (
              <div
                key={idx}
                data-testid={`safety-${issue.severity}`}
                className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs ${
                  isError
                    ? 'bg-destructive/10 border-destructive/30 text-destructive'
                    : isWarning
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
                    : 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400'
                }`}
              >
                {isError ? (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                ) : isWarning ? (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold capitalize">
                    {issue.severity}: {issue.field}
                  </span>
                  <span>{issue.message}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Compatibility badges */}
      {badges.length > 0 && (
        <div className="flex flex-col gap-2 pt-2 border-t">
          <span className="text-xs font-semibold text-muted-foreground">
            Dialect Compatibility Badges
          </span>
          <div className="flex flex-wrap gap-1.5">
            {badges.map((b, idx) => (
              <span
                key={idx}
                data-testid={b.ok ? 'badge-ok' : 'badge-bad'}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border ${
                  b.ok
                    ? 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300'
                    : 'bg-destructive/10 border-destructive/20 text-destructive'
                }`}
              >
                {b.ok ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-destructive" />
                )}
                <span>{b.label}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
