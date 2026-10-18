'use client';

import React from 'react';
import { useCron } from '@/hooks/useCron';
import { Dialect } from '@/lib/cron/types';
import { DIALECTS } from '@/lib/cron/dialects';

export function DialectSelector() {
  const { state, dispatch } = useCron();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch({ type: 'SET_DIALECT', dialect: e.target.value as Dialect });
  };

  return (
    <div className="flex items-center bg-card border-2 border-border shadow-[2px_2px_0px_var(--border)] px-2 py-1">
      <label
        htmlFor="dialect-select-id"
        className="font-mono text-[10px] font-black text-muted-foreground uppercase mr-2 shrink-0 select-none"
      >
        DIALECT:
      </label>
      <select
        id="dialect-select-id"
        data-testid="dialect-select"
        value={state.dialect}
        onChange={handleChange}
        className="bg-transparent font-mono text-xs font-bold uppercase text-foreground focus:outline-none cursor-pointer"
      >
        {Object.entries(DIALECTS).map(([key, meta]) => (
          <option key={key} value={key} className="bg-popover text-popover-foreground">
            {meta.label} {meta.utcOnly ? '(UTC)' : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
