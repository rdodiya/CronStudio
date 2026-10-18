'use client';

import React, { useState, useMemo } from 'react';
import { useCron } from '@/hooks/useCron';
import { nextRuns } from '@/lib/cron/index';
import { Button } from './ui/button';
import { Activity } from 'lucide-react';

export function timelineX(
  run: Date,
  from: Date,
  days: number,
  width: number
): number {
  const durationMs = days * 24 * 60 * 60 * 1000;
  const elapsedMs = run.getTime() - from.getTime();
  if (durationMs <= 0) return 0;
  return (elapsedMs / durationMs) * width;
}

export function Timeline() {
  const { state, liveParse } = useCron();
  const [rangeDays, setRangeDays] = useState<7 | 14 | 30>(7);

  const fromDate = useMemo(() => {
    if (state.nowOverride) {
      const parsed = new Date(state.nowOverride);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  }, [state.nowOverride]);

  const untilDate = useMemo(() => {
    return new Date(fromDate.getTime() + rangeDays * 24 * 60 * 60 * 1000);
  }, [fromDate, rangeDays]);

  const { timelineRuns, isCapped } = useMemo(() => {
    if (!liveParse.ok || !('schedule' in liveParse)) {
      return { timelineRuns: [], isCapped: false };
    }
    const runs = nextRuns(liveParse.schedule, {
      tz: state.tz,
      from: fromDate,
      count: 2000,
      until: untilDate,
    });
    return {
      timelineRuns: runs,
      isCapped: runs.length >= 2000,
    };
  }, [liveParse, state.tz, fromDate, untilDate]);

  const visibleRuns = useMemo(() => timelineRuns.slice(0, 500), [timelineRuns]);

  const svgWidth = 800;
  const svgHeight = 120;
  const paddingX = 30;
  const trackWidth = svgWidth - 2 * paddingX;
  const axisY = 65;

  // Day markers along the timeline
  const dayTicks = useMemo(() => {
    const ticks: { label: string; x: number; date: Date }[] = [];
    for (let i = 0; i <= rangeDays; i++) {
      const d = new Date(fromDate.getTime() + i * 24 * 60 * 60 * 1000);
      const x = paddingX + (i / rangeDays) * trackWidth;
      const monthStr = d.toLocaleString('en-US', { month: 'short', timeZone: state.tz });
      const dayStr = d.toLocaleString('en-US', { day: 'numeric', timeZone: state.tz });
      ticks.push({ label: `${monthStr} ${dayStr}`, x, date: d });
    }
    return ticks;
  }, [fromDate, rangeDays, trackWidth, paddingX, state.tz]);

  return (
    <div className="flex flex-col border-2 border-border bg-card shadow-[4px_4px_0px_var(--border)]">
      {/* Header */}
      <div className="p-3 border-b-2 border-border bg-paper flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-foreground" />
          <h2 className="font-mono text-xs font-black uppercase tracking-wider text-foreground">
            VISUAL TIMELINE // EXECUTION DISPERSION
          </h2>
          {isCapped && (
            <span
              data-testid="timeline-cap"
              className="font-mono text-[10px] font-black uppercase px-2 py-0.5 bg-secondary text-secondary-foreground border border-border"
            >
              CAPPED (2,000 RUNS)
            </span>
          )}
        </div>

        {/* Range selectors */}
        <div className="flex items-center gap-1">
          <Button
            variant={rangeDays === 7 ? 'default' : 'outline'}
            size="sm"
            data-testid="timeline-range-7"
            onClick={() => setRangeDays(7)}
            className="font-mono text-[10px] font-black h-6 px-2"
          >
            7 DAYS
          </Button>
          <Button
            variant={rangeDays === 14 ? 'default' : 'outline'}
            size="sm"
            data-testid="timeline-range-14"
            onClick={() => setRangeDays(14)}
            className="font-mono text-[10px] font-black h-6 px-2"
          >
            14 DAYS
          </Button>
          <Button
            variant={rangeDays === 30 ? 'default' : 'outline'}
            size="sm"
            data-testid="timeline-range-30"
            onClick={() => setRangeDays(30)}
            className="font-mono text-[10px] font-black h-6 px-2"
          >
            30 DAYS
          </Button>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3 font-mono">
        {/* SVG Timeline Track */}
        <div className="border-2 border-border bg-paper p-3 overflow-x-auto shadow-[inset_1px_1px_0px_rgba(0,0,0,0.6)]">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full min-w-[600px] h-32 select-none"
            aria-label="Execution timeline visualization"
          >
            {/* Base line */}
            <line
              x1={paddingX}
              y1={axisY}
              x2={svgWidth - paddingX}
              y2={axisY}
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-foreground"
            />

            {/* Day tick lines and date labels */}
            {dayTicks.map((tick, idx) => (
              <g key={idx}>
                <line
                  x1={tick.x}
                  y1={axisY - 12}
                  x2={tick.x}
                  y2={axisY + 12}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-border"
                />
                <text
                  x={tick.x}
                  y={axisY + 28}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[10px] font-bold"
                >
                  {tick.label}
                </text>
              </g>
            ))}

            {/* Run Execution Indicators */}
            {visibleRuns.map((run, idx) => {
              const x = paddingX + timelineX(run, fromDate, rangeDays, trackWidth);
              const clampedX = Math.max(paddingX, Math.min(svgWidth - paddingX, x));

              return (
                <g key={idx} className="cursor-pointer group">
                  <line
                    x1={clampedX}
                    y1={axisY - 24}
                    x2={clampedX}
                    y2={axisY}
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="text-foreground"
                  />
                  {/* Rectangular / diamond marker per brutalist spec */}
                  <rect
                    data-testid="timeline-dot"
                    x={clampedX - 4}
                    y={axisY - 28}
                    width="8"
                    height="8"
                    className="fill-primary stroke-border"
                    strokeWidth="1.5"
                  />
                  <circle
                    data-testid="timeline-dot-target"
                    cx={clampedX}
                    cy={axisY - 24}
                    r="8"
                    className="opacity-0"
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground pt-1">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-bold text-foreground">
              <span className="w-3 h-3 bg-primary border-2 border-border inline-block shadow-[1px_1px_0px_var(--border)]" />
              <span>SCHEDULED TRIGGER</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-paper-dark border border-border border-dashed inline-block" />
              <span>IDLE TIMELINE</span>
            </span>
          </div>
          <span className="font-black bg-paper border-2 border-border px-2 py-0.5 text-foreground shadow-[1px_1px_0px_var(--border)]">
            {timelineRuns.length} RUNS / {rangeDays}-DAY WINDOW
          </span>
        </div>
      </div>
    </div>
  );
}
