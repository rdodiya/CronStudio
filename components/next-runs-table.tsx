'use client';

import React from 'react';
import { useCron } from '@/hooks/useCron';
import { formatLocal, formatUtc } from '@/lib/timezone';
import { flagRun } from '@/lib/dst';
import { formatDistanceToNowStrict } from 'date-fns';
import { Button } from './ui/button';
import { ReceiptText, CalendarDays } from 'lucide-react';

export function NextRunsTable() {
  const { state, dispatch, analysis } = useCron();
  const { runs, transitions } = analysis;

  return (
    <div className="flex flex-col border-2 border-border bg-card shadow-[4px_4px_0px_var(--border)]">
      {/* Header */}
      <div className="p-3 border-b-2 border-border bg-paper flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ReceiptText className="w-4 h-4 text-foreground" />
          <h2 className="font-mono text-xs font-black uppercase tracking-wider text-foreground">
            UPCOMING RUNS LEDGER ({runs.length} CALCULATED)
          </h2>
        </div>

        {/* Count toggle buttons */}
        <div className="flex items-center gap-1 font-mono">
          <Button
            variant={state.runCount === 25 ? 'default' : 'outline'}
            size="sm"
            onClick={() => dispatch({ type: 'SET_RUN_COUNT', n: 25 })}
            className="text-[10px] font-black h-6 px-2"
          >
            25
          </Button>
          <Button
            variant={state.runCount === 50 ? 'default' : 'outline'}
            size="sm"
            data-testid="show-50"
            onClick={() => dispatch({ type: 'SET_RUN_COUNT', n: 50 })}
            className="text-[10px] font-black h-6 px-2"
          >
            50
          </Button>
          <Button
            variant={state.runCount === 100 ? 'default' : 'outline'}
            size="sm"
            data-testid="show-100"
            onClick={() => dispatch({ type: 'SET_RUN_COUNT', n: 100 })}
            className="text-[10px] font-black h-6 px-2"
          >
            100
          </Button>
        </div>
      </div>

      {runs.length === 0 ? (
        <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2 font-mono">
          <CalendarDays className="w-8 h-8 text-muted-foreground/40" />
          <span>NO UPCOMING EXECUTION TIMES FOUND WITHIN LOOKUP HORIZON.</span>
        </div>
      ) : (
        <div className="max-h-[380px] overflow-y-auto">
          <table className="w-full text-left border-collapse font-mono text-[11px]">
            <thead className="sticky top-0 bg-paper-dark text-foreground z-10 border-b-2 border-border">
              <tr className="uppercase tracking-wider">
                <th className="py-2 px-2.5 border-r border-border w-10 text-center font-black">#</th>
                <th className="py-2 px-3 border-r border-border font-black">
                  LOCAL TIME ({state.tz})
                </th>
                <th className="py-2 px-3 border-r border-border font-black">UTC TIMESTAMP</th>
                <th className="py-2 px-3 border-r border-border font-black">RELATIVE DELTA</th>
                <th className="py-2 px-2.5 text-center font-black">SAFETY STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-border/20">
              {runs.map((run, idx) => {
                const isAmbiguous = flagRun(run, transitions) === 'dst-overlap';
                let relative = '';
                try {
                  relative = formatDistanceToNowStrict(run, { addSuffix: true });
                } catch {
                  relative = 'upcoming';
                }

                return (
                  <tr
                    key={idx}
                    data-testid="next-runs-row"
                    className={`hover:bg-primary/20 transition-none ${
                      idx === 0 ? 'bg-primary/10' : ''
                    }`}
                  >
                    <td className="py-1.5 px-2.5 border-r border-border/20 text-center font-black">
                      {String(idx + 1).padStart(2, '0')}
                    </td>
                    <td className="py-1.5 px-3 border-r border-border/20 font-extrabold text-foreground">
                      {formatLocal(run, state.tz)}
                    </td>
                    <td className="py-1.5 px-3 border-r border-border/20 text-muted-foreground">
                      {formatUtc(run)}
                    </td>
                    <td className="py-1.5 px-3 border-r border-border/20 font-bold text-foreground">
                      {relative} {idx === 0 && '(Next)'}
                    </td>
                    <td className="py-1.5 px-2.5 text-center">
                      {isAmbiguous ? (
                        <span
                          data-testid="ambiguous-badge"
                          className="inline-block px-1.5 py-0.2 bg-secondary text-secondary-foreground font-black border border-border text-[9px] uppercase"
                        >
                          DST AMBIGUOUS
                        </span>
                      ) : (
                        <span className="inline-block px-1.5 py-0.2 bg-primary text-primary-foreground font-black border border-border text-[9px] uppercase">
                          NORMAL / SCHEDULED
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
