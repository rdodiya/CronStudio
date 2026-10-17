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
}

const UNIX_FIELDS: FieldConfig[] = [
  { id: 'minute', label: 'Minute', placeholder: '0-59' },
  { id: 'hour', label: 'Hour', placeholder: '0-23' },
  { id: 'dom', label: 'Day (Month)', placeholder: '1-31' },
  { id: 'month', label: 'Month', placeholder: '1-12' },
  { id: 'dow', label: 'Day (Week)', placeholder: '0-6' },
];

const QUARTZ_FIELDS: FieldConfig[] = [
  { id: 'second', label: 'Second', placeholder: '0-59' },
  { id: 'minute', label: 'Minute', placeholder: '0-59' },
  { id: 'hour', label: 'Hour', placeholder: '0-23' },
  { id: 'dom', label: 'Day (Month)', placeholder: '1-31, ? L W' },
  { id: 'month', label: 'Month', placeholder: '1-12' },
  { id: 'dow', label: 'Day (Week)', placeholder: '1-7, ? L #' },
  { id: 'year', label: 'Year (Opt)', placeholder: '1970-2099' },
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
    <div className="flex flex-col gap-4 p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
      {/* Raw Expression Input */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="cron-raw-input" className="text-sm font-semibold flex items-center gap-2">
            <span>Cron Expression</span>
            {pending && (
              <span
                data-testid="calculating"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground animate-pulse font-normal"
              >
                <Loader2 className="w-3 h-3 animate-spin" />
                Calculating...
              </span>
            )}
          </label>
          {meta?.docUrl && (
            <a
              href={meta.docUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>{meta.label} Docs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        <div className="relative">
          <Input
            id="cron-raw-input"
            ref={rawInputRef}
            data-testid="cron-input"
            value={state.expr}
            onChange={handleRawChange}
            placeholder="e.g. 0 9 * * 1-5"
            className="font-mono text-base tracking-wider py-5"
          />
        </div>

        {/* Global Syntax Error from liveParse */}
        {!liveParse.ok && liveParse.issues.length > 0 && (
          <div className="flex flex-col gap-1 text-xs text-destructive mt-1">
            {liveParse.issues.map((issue, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{issue.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Per-field Inputs (hidden for Rate expressions) */}
      {!isRate && (
        <div className="grid grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2 pt-1 border-t">
          {fields.map((f, i) => {
            const val = tokens[i] || '';
            const err = getFieldError(f.id);

            return (
              <div key={f.id} className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-muted-foreground truncate">
                  {f.label}
                </span>
                <Input
                  data-testid={`field-${f.id}`}
                  value={val}
                  onChange={(e) => handleFieldChange(i, e.target.value)}
                  placeholder={f.placeholder}
                  className={`font-mono text-xs text-center px-1 h-8 ${
                    err ? 'border-destructive focus-visible:ring-destructive' : ''
                  }`}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Preset Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-xs text-muted-foreground mr-1">Presets:</span>
        {PRESETS.filter((p) => p.id !== 'custom').map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handlePresetClick(p.expr)}
            className="text-xs px-2 py-1 rounded bg-secondary/80 hover:bg-secondary text-secondary-foreground font-mono transition-colors"
          >
            {p.expr}
          </button>
        ))}
      </div>

      {/* Optional Override for "Now" Time */}
      <div className="flex flex-col gap-1 pt-2 border-t">
        <label htmlFor="now-input-id" className="text-xs text-muted-foreground">
          Simulate Current Time (Now Override)
        </label>
        <Input
          id="now-input-id"
          data-testid="now-input"
          value={state.nowOverride || ''}
          onChange={handleNowChange}
          placeholder="e.g. 2026-10-16T00:00:00Z"
          className="text-xs font-mono max-w-sm h-8"
        />
        {nowIssue && (
          <span className="text-xs text-amber-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {nowIssue}
          </span>
        )}
      </div>
    </div>
  );
}
