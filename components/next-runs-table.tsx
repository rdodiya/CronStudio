'use client';

import React from 'react';
import { useCron } from '@/hooks/useCron';
import { formatLocal, formatUtc } from '@/lib/timezone';
import { flagRun } from '@/lib/dst';
import { formatDistanceToNowStrict } from 'date-fns';
import { Button } from './ui/button';
import { Clock, CalendarDays, AlertTriangle } from 'lucide-react';

export function NextRunsTable() {
  const { state, dispatch, analysis } = useCron();
  const { runs, transitions } = analysis;

  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Upcoming Scheduled Runs</h2>
          <span className="text-xs text-muted-foreground font-mono">
            ({runs.length} runs calculated)
          </span>
        </div>

        {/* Count toggle buttons */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <Button
            variant={state.runCount === 25 ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => dispatch({ type: 'SET_RUN_COUNT', n: 25 })}
            className="text-xs h-7 px-2.5"
          >
            25
          </Button>
          <Button
            variant={state.runCount === 50 ? 'secondary' : 'outline'}
            size="sm"
            data-testid="show-50"
            onClick={() => dispatch({ type: 'SET_RUN_COUNT', n: 50 })}
            className="text-xs h-7 px-2.5"
          >
            50
          </Button>
          <Button
            variant={state.runCount === 100 ? 'secondary' : 'outline'}
            size="sm"
            data-testid="show-100"
            onClick={() => dispatch({ type: 'SET_RUN_COUNT', n: 100 })}
            className="text-xs h-7 px-2.5"
          >
            100
          </Button>
        </div>
      </div>

      {runs.length === 0 ? (
        <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
          <CalendarDays className="w-8 h-8 text-muted-foreground/40" />
          <span>No upcoming execution times found within lookup horizon.</span>
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/60 text-muted-foreground font-medium border-b">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Local Time ({state.tz})</th>
                <th className="py-2.5 px-3">UTC Time</th>
                <th className="py-2.5 px-3">Relative</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-mono">
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
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-2 px-3 text-muted-foreground">{idx + 1}</td>
                    <td className="py-2 px-3 font-semibold text-foreground">
                      {formatLocal(run, state.tz)}
                    </td>
                    <td className="py-2 px-3 text-muted-foreground">
                      {formatUtc(run)}
                    </td>
                    <td className="py-2 px-3 font-sans text-muted-foreground">
                      {relative}
                    </td>
                    <td className="py-2 px-3">
                      {isAmbiguous ? (
                        <span
                          data-testid="ambiguous-badge"
                          className="inline-flex items-center gap-1 text-[10px] font-sans font-medium px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                          title="Occurs during DST fall-back repeated hour"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          ambiguous
                        </span>
                      ) : (
                        <span className="text-[10px] font-sans text-muted-foreground">
                          normal
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
