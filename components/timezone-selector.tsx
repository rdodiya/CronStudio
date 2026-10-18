'use client';

import React, { useMemo } from 'react';
import { useCron } from '@/hooks/useCron';
import { listTzs } from '@/lib/timezone';
import { DIALECTS } from '@/lib/cron/dialects';

export function TimezoneSelector() {
  const { state, dispatch } = useCron();
  const allTzs = useMemo(() => listTzs(), []);
  const meta = DIALECTS[state.dialect];

  const handleTzChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_TZ', tz: e.target.value });
  };

  return (
    <div className="flex items-center bg-card border-2 border-border shadow-[2px_2px_0px_var(--border)] px-2 py-1">
      <label
        htmlFor="timezone-selector"
        className="font-mono text-[10px] font-black text-muted-foreground uppercase mr-2 shrink-0 select-none"
      >
        TIMEZONE:
      </label>
      <span className="font-mono text-[10px] font-black bg-primary text-primary-foreground px-1.5 py-0.2 mr-2 border border-border shrink-0 select-none">
        {state.tz === 'UTC' ? 'UTC' : 'TZ'}
      </span>
      <input
        id="timezone-selector"
        data-testid="tz-input"
        list="timezones-list"
        value={state.tz}
        onChange={handleTzChange}
        placeholder="e.g. UTC, America/New_York"
        className="bg-transparent font-mono text-xs font-bold text-foreground focus:outline-none w-36 sm:w-44"
      />
      <datalist id="timezones-list">
        {allTzs.map((tz) => (
          <option key={tz} value={tz} />
        ))}
      </datalist>
      {meta?.utcOnly && (
        <span className="ml-1 text-[9px] font-mono font-bold bg-secondary text-secondary-foreground px-1 border border-border shrink-0">
          UTC ONLY
        </span>
      )}
    </div>
  );
}
