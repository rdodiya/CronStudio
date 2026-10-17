'use client';

import React, { useMemo } from 'react';
import { useCron } from '@/hooks/useCron';
import { listTzs } from '@/lib/timezone';
import { DIALECTS } from '@/lib/cron/dialects';
import { Input } from './ui/input';

export function TimezoneSelector() {
  const { state, dispatch } = useCron();
  const allTzs = useMemo(() => listTzs(), []);
  const meta = DIALECTS[state.dialect];

  const handleTzChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_TZ', tz: e.target.value });
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor="timezone-selector" className="text-xs font-medium text-muted-foreground">
          Timezone
        </label>
        {meta?.utcOnly && (
          <span className="text-[10px] text-amber-500 font-medium">
            (Target enforces UTC)
          </span>
        )}
      </div>
      <div className="relative">
        <Input
          id="timezone-selector"
          data-testid="tz-input"
          list="timezones-list"
          value={state.tz}
          onChange={handleTzChange}
          placeholder="e.g. UTC, America/New_York"
          className="w-[220px]"
        />
        <datalist id="timezones-list">
          {allTzs.map((tz) => (
            <option key={tz} value={tz} />
          ))}
        </datalist>
      </div>
    </div>
  );
}
