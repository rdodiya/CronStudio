'use client';

import React, { ChangeEvent, useRef } from 'react';
import { useCron } from '@/hooks/useCron';
import { DIALECTS } from '@/lib/cron/dialects';
import { PRESETS } from '@/lib/cron/builder';
import { Input } from './ui/input';
import { ExternalLink, AlertCircle, Loader2 } from 'lucide-react';

interface FieldConfig {
  id: 'second' | 'minute' | 'hour' | 'dom' | 'month' | 'dow' | 'year';
  label: string;
  placeholder: string;
  subLabel?: string;
}

const UNIX_FIELDS: FieldConfig[] = [
  { id: 'minute', label: 'MIN', placeholder: '0-59', subLabel: 'Minute' },
  { id: 'hour', label: 'HOUR', placeholder: '0-23', subLabel: 'Hour' },
  { id: 'dom', label: 'DOM', placeholder: '1-31', subLabel: 'Day (Month)' },
  { id: 'month', label: 'MONTH', placeholder: '1-12', subLabel: 'Month' },
  { id: 'dow', label: 'DOW', placeholder: '0-6', subLabel: 'Day (Week)' },
];

const QUARTZ_FIELDS: FieldConfig[] = [
  { id: 'second', label: 'SEC', placeholder: '0-59', subLabel: 'Second' },
  { id: 'minute', label: 'MIN', placeholder: '0-59', subLabel: 'Minute' },
  { id: 'hour', label: 'HOUR', placeholder: '0-23', subLabel: 'Hour' },
  { id: 'dom', label: 'DOM', placeholder: '1-31, ? L W', subLabel: 'Day (Month)' },
  { id: 'month', label: 'MONTH', placeholder: '1-12', subLabel: 'Month' },
  { id: 'dow', label: 'DOW', placeholder: '1-7, ? L #', subLabel: 'Day (Week)' },
  { id: 'year', label: 'YEAR', placeholder: '1970-2099', subLabel: 'Year' },
];

export function CronInput() {
  const { state, dispatch, liveParse, pending, nowIssue } = useCron();
  const rawInputRef = useRef<HTMLInputElement>(null);

  const meta = DIALECTS[state.dialect];
  const isQuartz = meta?.family === 'quartz';
  const isRate = state.expr.trim().startsWith('rate(');

  const fields = isQuartz ? QUARTZ_FIELDS : UNIX_FIELDS;

  // Split raw tokens by whitespace
  const tokens = state.expr.trim().split(/\s+/);

  const handleRawChange = (e: ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_EXPR', expr: e.target.value });
  };

  const handleFieldChange = (fieldIndex: number, val: string) => {
    const currentTokens = state.expr.trim().split(/\s+/);
    while (currentTokens.length < fields.length && !isQuartz) {
      currentTokens.push('*');
    }
    while (currentTokens.length < 6 && isQuartz) {
      currentTokens.push(fieldIndex === 3 ? '?' : fieldIndex === 5 ? '?' : '*');
    }

    currentTokens[fieldIndex] = val;
    const newExpr = currentTokens.filter(Boolean).join(' ');
    dispatch({ type: 'SET_EXPR', expr: newExpr });
  };

  const handlePresetClick = (presetExpr: string) => {
    dispatch({ type: 'SET_EXPR', expr: presetExpr });
  };

  const handleNowChange = (e: ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_NOW', value: e.target.value || null });
  };

  // Field errors lookup from liveParse issues
  const getFieldError = (fieldId: string) => {
    if (liveParse.ok) return null;
    const normField =
      fieldId === 'dom'
        ? 'dayOfMonth'
        : fieldId === 'dow'
        ? 'dayOfWeek'
        : fieldId;
    return liveParse.issues.find((i) => i.field === normField || i.field === fieldId);
  };

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-5 border-2 border-border bg-card shadow-[4px_4px_0px_var(--border)]">
      {/* Raw Expression Input Bar */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b-2 border-border">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-black uppercase tracking-wider text-muted-foreground">
              RAW {meta?.label?.toUpperCase() || 'CRON'} EXPRESSION
            </span>
            {pending ? (
              <span
                data-testid="calculating"
                className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-muted-foreground animate-pulse"
              >
                <Loader2 className="w-3 h-3 animate-spin" />
                CALCULATING...
              </span>
            ) : liveParse.ok ? (
              <span className="font-mono text-[10px] font-black bg-primary text-primary-foreground border-2 border-border px-1.5 py-0.2 shadow-[1px_1px_0px_var(--border)]">
                SYNTAX_PASS ({tokens.length} TOKENS)
              </span>
            ) : (
              <span className="font-mono text-[10px] font-black bg-destructive text-destructive-foreground border-2 border-border px-1.5 py-0.2 shadow-[1px_1px_0px_var(--border)]">
                SYNTAX_ERROR
              </span>
            )}
          </div>
          {meta?.docUrl && (
            <a
              href={meta.docUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-foreground hover:bg-primary hover:text-primary-foreground px-2 py-0.5 border-2 border-border bg-card transition-none"
            >
              <span>{meta.label.toUpperCase()}_DOCS</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        <div className="relative">
          <input
            id="cron-raw-input"
            ref={rawInputRef}
            data-testid="cron-input"
            value={state.expr}
            onChange={handleRawChange}
            placeholder="e.g. 0 9 * * 1-5"
            spellCheck="false"
            className="w-full bg-paper p-3 border-2 border-border font-mono font-black text-xl lg:text-2xl text-foreground tracking-widest focus:outline-none focus:border-primary shadow-[inset_2px_2px_0px_rgba(0,0,0,0.5)] select-all"
          />
        </div>

        {/* Global Syntax Error from liveParse */}
        {!liveParse.ok && liveParse.issues.length > 0 && (
          <div className="flex flex-col gap-1.5 p-2.5 bg-destructive/10 border-2 border-destructive text-destructive font-mono text-xs">
            {liveParse.issues.map((issue, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="font-bold">{issue.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Per-field Cassette Breakdown Cells (hidden for Rate expressions) */}
      {!isRate && (
        <div className="flex flex-col gap-1.5 pt-2 border-t-2 border-border">
          <span className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground">
            TOKEN SEGMENT CASSETTES
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2">
            {fields.map((f, i) => {
              const val = tokens[i] || '';
              const err = getFieldError(f.id);
              const hasVal = Boolean(val && val !== '*');

              return (
                <div
                  key={f.id}
                  className={`border-2 p-2 flex flex-col justify-between text-center shadow-[2px_2px_0px_var(--border)] ${
                    err
                      ? 'border-destructive bg-destructive/10'
                      : hasVal
                      ? 'border-border bg-primary/20'
                      : 'border-border bg-paper'
                  }`}
                >
                  <span className="font-mono text-[10px] font-black uppercase border-b-2 border-border/40 pb-0.5 text-muted-foreground">
                    {f.label}
                  </span>
                  <div className="py-1">
                    <input
                      data-testid={`field-${f.id}`}
                      value={val}
                      onChange={(e) => handleFieldChange(i, e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full text-center bg-card border-2 border-border font-mono font-black text-lg text-foreground focus:outline-none focus:border-primary px-1 py-0.5"
                    />
                  </div>
                  <span className="font-mono text-[9px] font-bold text-muted-foreground truncate bg-card border border-border px-1">
                    {f.subLabel || f.placeholder}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Presets Quick-Seed Chips */}
      <div className="flex flex-col gap-1.5 pt-2 border-t-2 border-border">
        <span className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground">
          QUICK-SEED PRESETS:
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          {PRESETS.filter((p) => p.id !== 'custom').map((p) => {
            const isActive = state.expr.trim() === p.expr.trim();
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePresetClick(p.expr)}
                className={`px-2 py-1 font-mono text-[11px] font-bold border-2 border-border shadow-[2px_2px_0px_var(--border)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-none ${
                  isActive
                    ? 'bg-primary text-primary-foreground font-black'
                    : 'bg-card text-foreground hover:bg-muted'
                }`}
              >
                {p.expr}
              </button>
            );
          })}
        </div>
      </div>

      {/* Simulated "Now" Time Override */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t-2 border-border bg-paper p-3 border-2">
        <label
          htmlFor="now-input-id"
          className="font-mono text-[11px] font-black uppercase text-foreground shrink-0"
        >
          SIMULATE CURRENT TIME (NOW OVERRIDE):
        </label>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input
            id="now-input-id"
            data-testid="now-input"
            value={state.nowOverride || ''}
            onChange={handleNowChange}
            placeholder="e.g. 2026-10-16T00:00:00Z"
            className="text-xs font-mono max-w-sm h-8 bg-card border-2 border-border shadow-[inset_1px_1px_0px_rgba(0,0,0,0.5)]"
          />
          {state.nowOverride && (
            <button
              type="button"
              onClick={() => dispatch({ type: 'SET_NOW', value: null })}
              className="px-2 py-1 font-mono text-[10px] font-black uppercase bg-card border-2 border-border hover:bg-primary hover:text-primary-foreground shadow-[2px_2px_0px_var(--border)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none shrink-0"
            >
              RESET
            </button>
          )}
        </div>
      </div>
      {nowIssue && (
        <span className="font-mono text-xs text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5 p-2 bg-amber-500/10 border-2 border-amber-500/30">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {nowIssue}
        </span>
      )}
    </div>
  );
}
