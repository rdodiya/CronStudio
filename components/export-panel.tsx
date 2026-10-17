'use client';

import React, { useMemo } from 'react';
import { useCron } from '@/hooks/useCron';
import { exportAs, ExportFormat } from '@/lib/cron/exporter';
import { CopyButton } from './copy-button';
import { AlertTriangle, FileCode } from 'lucide-react';

const FORMATS: { id: ExportFormat; label: string }[] = [
  { id: 'kubernetes', label: 'Kubernetes' },
  { id: 'github', label: 'GitHub Actions' },
  { id: 'vercel', label: 'Vercel' },
  { id: 'eventbridge', label: 'AWS EventBridge' },
  { id: 'cloudflare-toml', label: 'Cloudflare (TOML)' },
  { id: 'cloudflare-jsonc', label: 'Cloudflare (JSONC)' },
];

export function ExportPanel() {
  const { state, dispatch, liveParse, analysis } = useCron();

  const handleTabClick = (format: ExportFormat) => {
    dispatch({ type: 'SET_FORMAT', format });
  };

  const exported = useMemo(() => {
    if (!liveParse.ok || !analysis.explanation) {
      return { text: '', warnings: [] };
    }
    const currentSchedule =
      liveParse.ok && 'schedule' in liveParse ? liveParse.schedule : null;
    if (!currentSchedule) {
      return { text: '', warnings: [] };
    }

    return exportAs(state.format, {
      expr: state.expr,
      dialect: state.dialect,
      tz: state.tz,
      schedule: currentSchedule,
      explanation: analysis.explanation,
    });
  }, [state.format, state.expr, state.dialect, state.tz, liveParse, analysis.explanation]);

  if (!state.expr.trim()) {
    return (
      <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
        <h2 className="text-sm font-semibold mb-2">Export Configuration</h2>
        <p className="text-xs text-muted-foreground">Empty expression. Enter a cron expression above.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Production Exporters</h2>
        </div>
        {exported.text && (
          <CopyButton
            text={exported.text}
            label={state.format}
            testId={`copy-${state.format}`}
          />
        )}
      </div>

      {/* Format tabs */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-muted/50 rounded-lg border">
        {FORMATS.map((f) => (
          <button
            key={f.id}
            type="button"
            data-testid={`export-tab-${f.id}`}
            onClick={() => handleTabClick(f.id)}
            className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
              state.format === f.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Warnings if any */}
      {exported.warnings.length > 0 && (
        <div
          data-testid="export-warning"
          className="flex flex-col gap-1 text-xs text-amber-700 dark:text-amber-400 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20"
        >
          {exported.warnings.map((w, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Output code */}
      <div className="relative">
        <pre
          data-testid="export-output"
          className="font-mono text-xs p-3.5 rounded-lg bg-muted border overflow-x-auto text-foreground whitespace-pre-wrap min-h-[140px]"
        >
          {exported.text}
        </pre>
      </div>
    </div>
  );
}
