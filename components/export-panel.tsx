'use client';

import React, { useMemo } from 'react';
import { useCron } from '@/hooks/useCron';
import { exportAs, ExportFormat } from '@/lib/cron/exporter';
import { CopyButton } from './copy-button';
import { AlertTriangle, Terminal } from 'lucide-react';

const FORMATS: { id: ExportFormat; label: string }[] = [
  { id: 'kubernetes', label: 'KUBERNETES' },
  { id: 'github', label: 'GITHUB ACTIONS' },
  { id: 'vercel', label: 'VERCEL' },
  { id: 'eventbridge', label: 'AWS EVENTBRIDGE' },
  { id: 'cloudflare-toml', label: 'CLOUDFLARE (TOML)' },
  { id: 'cloudflare-jsonc', label: 'CLOUDFLARE (JSONC)' },
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
      <div className="border-2 border-border bg-card p-4 shadow-[4px_4px_0px_var(--border)] font-mono">
        <div className="flex items-center gap-2 mb-2 pb-1.5 border-b-2 border-border">
          <Terminal className="w-4 h-4 text-foreground" />
          <h2 className="text-xs font-black uppercase tracking-wider text-foreground">
            PRODUCTION EXPORTER SNIPPETS
          </h2>
        </div>
        <p className="text-xs text-muted-foreground">Empty expression. Enter a cron expression above.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col border-2 border-border bg-card shadow-[4px_4px_0px_var(--border)]">
      {/* Header */}
      <div className="p-3 border-b-2 border-border bg-paper flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-foreground" />
          <h2 className="font-mono text-xs font-black uppercase tracking-wider text-foreground">
            PRODUCTION EXPORTER SNIPPETS
          </h2>
        </div>
        {exported.text && (
          <CopyButton
            text={exported.text}
            label={`COPY_${state.format.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`}
            testId={`copy-${state.format}`}
          />
        )}
      </div>

      <div className="p-4 flex flex-col gap-3 font-mono">
        {/* Target Format Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {FORMATS.map((f) => {
            const isSelected = state.format === f.id;
            return (
              <button
                key={f.id}
                type="button"
                data-testid={`export-tab-${f.id}`}
                onClick={() => handleTabClick(f.id)}
                className={`px-2.5 py-1 text-xs font-black uppercase border-2 border-border shadow-[2px_2px_0px_var(--border)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-none ${
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-foreground hover:bg-muted'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Warnings */}
        {exported.warnings.length > 0 && (
          <div
            data-testid="export-warning"
            className="flex flex-col gap-1 p-2.5 bg-secondary/15 border-2 border-secondary text-foreground text-xs"
          >
            {exported.warnings.map((w, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-secondary shrink-0" />
                <span className="font-bold">{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* Code Output Inset Well */}
        <div className="relative border-2 border-border bg-paper-dark p-3 overflow-x-auto shadow-[inset_2px_2px_0px_rgba(0,0,0,0.6)]">
          <pre
            data-testid="export-output"
            className="font-mono text-xs text-foreground leading-relaxed selection:bg-primary selection:text-primary-foreground"
          >
            {exported.text}
          </pre>
        </div>
      </div>
    </div>
  );
}
