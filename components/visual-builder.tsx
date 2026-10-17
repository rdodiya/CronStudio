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

const WEEKDAYS = [
  { val: 1, label: 'Mon' },
  { val: 2, label: 'Tue' },
  { val: 3, label: 'Wed' },
  { val: 4, label: 'Thu' },
  { val: 5, label: 'Fri' },
  { val: 6, label: 'Sat' },
  { val: 0, label: 'Sun' },
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

  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Visual Builder & Presets</h2>
      </div>

      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.filter((p) => p.id !== 'custom').map((p) => (
          <Button
            key={p.id}
            variant="outline"
            size="sm"
            data-testid={getPresetTestId(p)}
            onClick={() => handlePresetClick(p.expr)}
            className="text-xs"
          >
            {p.label}
          </Button>
        ))}
      </div>

      {/* Frequency selector */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2 border-t">
        <div className="flex items-center gap-2">
          <label htmlFor="frequency-select" className="text-xs font-medium text-muted-foreground">
            Schedule:
          </label>
          <select
            id="frequency-select"
            data-testid="frequency-select"
            value={builderState.frequency}
            onChange={(e) =>
              handleFrequencyChange(e.target.value as BuilderState['frequency'])
            }
            className="text-xs h-8 px-2.5 rounded-md border bg-background font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
          <div className="flex items-center gap-2 text-xs">
            <span>Every</span>
            <Input
              type="number"
              min={1}
              max={59}
              value={builderState.everyN}
              onChange={(e) => updateBuilder({ everyN: Number(e.target.value) || 1 })}
              className="w-16 h-8 text-xs text-center"
            />
            <span>minutes</span>
          </div>
        )}

        {/* Hourly controls */}
        {builderState.frequency === 'hourly' && (
          <div className="flex items-center gap-2 text-xs">
            <span>At minute</span>
            <Input
              type="number"
              min={0}
              max={59}
              value={builderState.minute}
              onChange={(e) => updateBuilder({ minute: Number(e.target.value) || 0 })}
              className="w-16 h-8 text-xs text-center"
            />
            <span>every</span>
            <Input
              type="number"
              min={1}
              max={23}
              value={builderState.everyN}
              onChange={(e) => updateBuilder({ everyN: Number(e.target.value) || 1 })}
              className="w-16 h-8 text-xs text-center"
            />
            <span>hour(s)</span>
          </div>
        )}

        {/* Daily controls */}
        {builderState.frequency === 'daily' && (
          <div className="flex items-center gap-2 text-xs">
            <span>At</span>
            <Input
              type="number"
              min={0}
              max={23}
              value={builderState.hour}
              onChange={(e) => updateBuilder({ hour: Number(e.target.value) || 0 })}
              className="w-16 h-8 text-xs text-center"
            />
            <span>:</span>
            <Input
              type="number"
              min={0}
              max={59}
              value={builderState.minute}
              onChange={(e) => updateBuilder({ minute: Number(e.target.value) || 0 })}
              className="w-16 h-8 text-xs text-center"
            />
          </div>
        )}

        {/* Monthly controls */}
        {builderState.frequency === 'monthly' && (
          <div className="flex items-center gap-2 text-xs">
            <span>On day</span>
            <Input
              type="number"
              min={1}
              max={31}
              value={builderState.dayOfMonth}
              onChange={(e) => updateBuilder({ dayOfMonth: Number(e.target.value) || 1 })}
              className="w-16 h-8 text-xs text-center"
            />
            <span>at</span>
            <Input
              type="number"
              min={0}
              max={23}
              value={builderState.hour}
              onChange={(e) => updateBuilder({ hour: Number(e.target.value) || 0 })}
              className="w-16 h-8 text-xs text-center"
            />
            <span>:</span>
            <Input
              type="number"
              min={0}
              max={59}
              value={builderState.minute}
              onChange={(e) => updateBuilder({ minute: Number(e.target.value) || 0 })}
              className="w-16 h-8 text-xs text-center"
            />
          </div>
        )}
      </div>

      {/* Weekly weekday checkboxes */}
      {builderState.frequency === 'weekly' && (
        <div data-testid="weekday-checkboxes" className="flex flex-col gap-2 pt-2 border-t">
          <div className="flex items-center gap-2 text-xs">
            <span>At</span>
            <Input
              type="number"
              min={0}
              max={23}
              value={builderState.hour}
              onChange={(e) => updateBuilder({ hour: Number(e.target.value) || 0 })}
              className="w-16 h-8 text-xs text-center"
            />
            <span>:</span>
            <Input
              type="number"
              min={0}
              max={59}
              value={builderState.minute}
              onChange={(e) => updateBuilder({ minute: Number(e.target.value) || 0 })}
              className="w-16 h-8 text-xs text-center"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs text-muted-foreground mr-1">On days:</span>
            {WEEKDAYS.map((day) => {
              const isChecked = builderState.weekdays.includes(day.val);
              return (
                <button
                  key={day.val}
                  type="button"
                  data-testid={`weekday-checkbox-${day.val}`}
                  onClick={() => toggleWeekday(day.val)}
                  className={`text-xs px-2.5 py-1 rounded border font-medium transition-colors ${
                    isChecked
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-accent text-foreground'
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
