'use client';

import React, { useMemo } from 'react';
import { useCron } from '@/hooks/useCron';
import {
  builderToExpr,
  exprToBuilder,
  PRESETS,
  BuilderState,
} from '@/lib/cron/builder';
import { convertUnixToQuartz } from '@/lib/cron/compatibility';
import { DIALECTS } from '@/lib/cron/dialects';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { SlidersHorizontal } from 'lucide-react';

const WEEKDAYS = [
  { val: 1, label: 'MON', qtz: 2 },
  { val: 2, label: 'TUE', qtz: 3 },
  { val: 3, label: 'WED', qtz: 4 },
  { val: 4, label: 'THU', qtz: 5 },
  { val: 5, label: 'FRI', qtz: 6 },
  { val: 6, label: 'SAT', qtz: 7 },
  { val: 0, label: 'SUN', qtz: 1 },
];

function getPresetTestId(preset: { id: string; label: string }): string {
  if (preset.id === 'weekdays-9am' || preset.label.toLowerCase().includes('weekdays')) {
    return 'preset-weekdays-at-9-00-am';
  }
  const slug = preset.label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `preset-${slug}`;
}

export function VisualBuilder() {
  const { state, dispatch } = useCron();
  const isQuartz = DIALECTS[state.dialect]?.family === 'quartz';

  const builderState: BuilderState = useMemo(() => {
    const parsed = exprToBuilder(state.expr);
    if (parsed) {
      return parsed;
    }
    return {
      frequency: 'custom',
      everyN: 1,
      minute: 0,
      hour: 9,
      weekdays: [1, 2, 3, 4, 5],
      dayOfMonth: 1,
    };
  }, [state.expr]);

  const handleFrequencyChange = (freq: BuilderState['frequency']) => {
    if (freq === 'custom') {
      return;
    }
    const nextState: BuilderState = {
      ...builderState,
      frequency: freq,
    };
    let newExpr = builderToExpr(nextState);
    if (isQuartz) {
      newExpr = convertUnixToQuartz(newExpr);
    }
    dispatch({ type: 'SET_EXPR', expr: newExpr });
  };

  const updateBuilder = (patch: Partial<BuilderState>) => {
    const nextState: BuilderState = {
      ...builderState,
      ...patch,
    };
    let newExpr = builderToExpr(nextState);
    if (isQuartz) {
      newExpr = convertUnixToQuartz(newExpr);
    }
    dispatch({ type: 'SET_EXPR', expr: newExpr });
  };

  const handlePresetClick = (presetExpr: string) => {
    let expr = presetExpr;
    if (isQuartz) {
      expr = convertUnixToQuartz(presetExpr);
    }
    dispatch({ type: 'SET_EXPR', expr });
  };

  const toggleWeekday = (day: number) => {
    const current = builderState.weekdays;
    let next: number[];
    if (current.includes(day)) {
      next = current.filter((d) => d !== day);
    } else {
      next = [...current, day].sort((a, b) => a - b);
    }
    updateBuilder({ weekdays: next });
  };

  const cadenceTabs: { id: BuilderState['frequency']; label: string }[] = [
    { id: 'minutes', label: 'MINUTES' },
    { id: 'hourly', label: 'HOURLY' },
    { id: 'daily', label: 'DAILY' },
    { id: 'weekly', label: 'WEEKLY' },
    { id: 'monthly', label: 'MONTHLY' },
    { id: 'custom', label: 'CUSTOM' },
  ];

  return (
    <div className="flex flex-col border-2 border-border bg-card shadow-[4px_4px_0px_var(--border)]">
      {/* Header */}
      <div className="p-3 border-b-2 border-border bg-paper flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-foreground" />
          <h2 className="font-mono text-xs font-black uppercase tracking-wider text-foreground">
            QUARTZ-AWARE VISUAL BUILDER & SYNTHESIZER
          </h2>
        </div>
        <span className="font-mono text-[10px] font-black uppercase bg-primary text-primary-foreground border-2 border-border px-1.5 py-0.2 shadow-[1px_1px_0px_var(--border)]">
          INTERACTIVE COMPILER
        </span>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Preset Buttons */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground block">
            PRESET QUICK-SEED BANK
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.filter((p) => p.id !== 'custom').map((p) => {
              const isActive = state.expr.trim() === p.expr.trim();
              return (
                <Button
                  key={p.id}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  data-testid={getPresetTestId(p)}
                  onClick={() => handlePresetClick(p.expr)}
                  className={`font-mono text-[11px] font-bold ${
                    isActive ? 'bg-primary text-primary-foreground font-black' : ''
                  }`}
                >
                  {p.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Cadence Selection Tabs */}
        <div className="flex flex-col gap-1.5 pt-2 border-t-2 border-border">
          <label className="font-mono text-[10px] font-extrabold uppercase text-muted-foreground block">
            CADENCE SELECTION
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {cadenceTabs.map((tab) => {
              const isSelected = builderState.frequency === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleFrequencyChange(tab.id)}
                  className={`py-1.5 px-2 font-mono text-[11px] font-black uppercase border-2 border-border shadow-[2px_2px_0px_var(--border)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-none ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-foreground hover:bg-muted'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Hidden select for contract test compatibility */}
          <select
            id="frequency-select"
            data-testid="frequency-select"
            value={builderState.frequency}
            onChange={(e) =>
              handleFrequencyChange(e.target.value as BuilderState['frequency'])
            }
            className="sr-only"
            aria-label="Cadence frequency select"
          >
            <option value="minutes">Every N minutes</option>
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {/* Minutes controls */}
        {builderState.frequency === 'minutes' && (
          <div className="p-3 bg-paper border-2 border-border flex items-center gap-2 font-mono text-xs">
            <span className="font-bold">EVERY</span>
            <Input
              type="number"
              min={1}
              max={59}
              value={builderState.everyN}
              onChange={(e) => updateBuilder({ everyN: Number(e.target.value) || 1 })}
              className="w-16 h-8 text-center font-black"
            />
            <span className="font-bold">MINUTES</span>
          </div>
        )}

        {/* Hourly controls */}
        {builderState.frequency === 'hourly' && (
          <div className="p-3 bg-paper border-2 border-border flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="font-bold">AT MINUTE</span>
            <Input
              type="number"
              min={0}
              max={59}
              value={builderState.minute}
              onChange={(e) => updateBuilder({ minute: Number(e.target.value) || 0 })}
              className="w-16 h-8 text-center font-black"
            />
            <span className="font-bold">EVERY</span>
            <Input
              type="number"
              min={1}
              max={23}
              value={builderState.everyN}
              onChange={(e) => updateBuilder({ everyN: Number(e.target.value) || 1 })}
              className="w-16 h-8 text-center font-black"
            />
            <span className="font-bold">HOUR(S)</span>
          </div>
        )}

        {/* Daily execution time */}
        {builderState.frequency === 'daily' && (
          <div className="p-3 bg-paper border-2 border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-mono text-[11px] font-black uppercase text-foreground block">
                TRIGGER EXECUTION TIME
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                24-hour timestamp specification ({state.tz})
              </span>
            </div>
            <div className="flex items-center gap-1 font-mono text-lg font-black bg-card border-2 border-border p-1 shadow-[2px_2px_0px_var(--border)]">
              <Input
                type="number"
                min={0}
                max={23}
                value={builderState.hour}
                onChange={(e) => updateBuilder({ hour: Number(e.target.value) || 0 })}
                className="w-12 h-7 text-center font-black border-none shadow-none text-base p-0"
              />
              <span>:</span>
              <Input
                type="number"
                min={0}
                max={59}
                value={builderState.minute}
                onChange={(e) => updateBuilder({ minute: Number(e.target.value) || 0 })}
                className="w-12 h-7 text-center font-black border-none shadow-none text-base p-0"
              />
            </div>
          </div>
        )}

        {/* Monthly controls */}
        {builderState.frequency === 'monthly' && (
          <div className="p-3 bg-paper border-2 border-border flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="font-bold">ON DAY</span>
            <Input
              type="number"
              min={1}
              max={31}
              value={builderState.dayOfMonth}
              onChange={(e) => updateBuilder({ dayOfMonth: Number(e.target.value) || 1 })}
              className="w-16 h-8 text-center font-black"
            />
            <span className="font-bold">AT</span>
            <Input
              type="number"
              min={0}
              max={23}
              value={builderState.hour}
              onChange={(e) => updateBuilder({ hour: Number(e.target.value) || 0 })}
              className="w-14 h-8 text-center font-black"
            />
            <span className="font-black">:</span>
            <Input
              type="number"
              min={0}
              max={59}
              value={builderState.minute}
              onChange={(e) => updateBuilder({ minute: Number(e.target.value) || 0 })}
              className="w-14 h-8 text-center font-black"
            />
          </div>
        )}

        {/* Weekly Day-of-Week strip */}
        {builderState.frequency === 'weekly' && (
          <div data-testid="weekday-checkboxes" className="flex flex-col gap-3 pt-2 border-t-2 border-border">
            <div className="p-3 bg-paper border-2 border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-mono text-[11px] font-black uppercase text-foreground block">
                  TRIGGER EXECUTION TIME
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  Executed on selected active days ({state.tz})
                </span>
              </div>
              <div className="flex items-center gap-1 font-mono text-lg font-black bg-card border-2 border-border p-1 shadow-[2px_2px_0px_var(--border)]">
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={builderState.hour}
                  onChange={(e) => updateBuilder({ hour: Number(e.target.value) || 0 })}
                  className="w-12 h-7 text-center font-black border-none shadow-none text-base p-0"
                />
                <span>:</span>
                <Input
                  type="number"
                  min={0}
                  max={59}
                  value={builderState.minute}
                  onChange={(e) => updateBuilder({ minute: Number(e.target.value) || 0 })}
                  className="w-12 h-7 text-center font-black border-none shadow-none text-base p-0"
                />
              </div>
            </div>

            {/* 7-Day Tactile Switch Row */}
            <div className="p-3 bg-paper border-2 border-border flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-black uppercase text-foreground">
                  WEEKDAY SELECTION ({isQuartz ? 'QUARTZ 1=SUN..7=SAT' : 'UNIX 0=SUN..6=SAT'})
                </span>
                <span className="font-mono text-[10px] font-bold bg-card border border-border px-1.5 py-0.2">
                  {builderState.weekdays.length} Active Days
                </span>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {WEEKDAYS.map((day) => {
                  const isChecked = builderState.weekdays.includes(day.val);
                  return (
                    <button
                      key={day.val}
                      type="button"
                      data-testid={`weekday-checkbox-${day.val}`}
                      onClick={() => toggleWeekday(day.val)}
                      className={`p-2 border-2 border-border flex flex-col items-center shadow-[2px_2px_0px_var(--border)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-none ${
                        isChecked
                          ? 'bg-primary text-primary-foreground font-black'
                          : 'bg-card text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <span className="font-mono text-[9px] font-bold uppercase opacity-70">
                        {isQuartz ? day.qtz : day.val}
                      </span>
                      <span className="font-mono text-xs font-black">{day.label}</span>
                      <span className="font-mono text-[8px] uppercase font-bold mt-0.5">
                        {isChecked ? 'ACTIVE' : 'OFF'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
