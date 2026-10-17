'use client';

import React from 'react';
import { useCron } from '@/hooks/useCron';
import { Dialect } from '@/lib/cron/types';
import { DIALECTS } from '@/lib/cron/dialects';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

export function DialectSelector() {
  const { state, dispatch } = useCron();

  const handleChange = (val: string) => {
    dispatch({ type: 'SET_DIALECT', dialect: val as Dialect });
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="dialect-selector" className="text-xs font-medium text-muted-foreground">
        Dialect
      </label>
      <Select value={state.dialect} onValueChange={handleChange}>
        <SelectTrigger id="dialect-selector" data-testid="dialect-select" className="w-[200px]">
          <SelectValue placeholder="Select dialect" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(DIALECTS).map(([key, meta]) => (
            <SelectItem key={key} value={key}>
              <div className="flex items-center gap-2">
                <span>{meta.label}</span>
                {meta.utcOnly && (
                  <span className="text-[10px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-600 font-mono">
                    UTC
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
