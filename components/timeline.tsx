'use client';

import React, { useState, useMemo } from 'react';
import { useCron } from '@/hooks/useCron';
import { nextRuns } from '@/lib/cron/index';
import { formatLocal, formatUtc } from '@/lib/timezone';
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
  const { state, liveParse, analysis } = useCron();
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
    <div className="flex flex-col gap-4 p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Visual Timeline</h2>
          {isCapped && (
            <span
              data-testid="timeline-cap"
              className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
            >
              Showing first 2,000 runs (cap reached)
            </span>
          )}
        </div>

        {/* Range selectors */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <Button
            variant={rangeDays === 7 ? 'secondary' : 'outline'}
            size="sm"
            data-testid="timeline-range-7"
            onClick={() => setRangeDays(7)}
            className="text-xs h-7 px-2.5"
          >
            7 Days
          </Button>
          <Button
            variant={rangeDays === 14 ? 'secondary' : 'outline'}
            size="sm"
            data-testid="timeline-range-14"
            onClick={() => setRangeDays(14)}
            className="text-xs h-7 px-2.5"
          >
            14 Days
          </Button>
          <Button
            variant={rangeDays === 30 ? 'secondary' : 'outline'}
            size="sm"
            data-testid="timeline-range-30"
            onClick={() => setRangeDays(30)}
            className="text-xs h-7 px-2.5"
          >
            30 Days
          </Button>
        </div>
      </div>

      {/* SVG Canvas (Horizontal scrollable on small viewports) */}
      <div className="overflow-x-auto border rounded-lg bg-muted/20 p-2">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full min-w-[650px] h-[130px] select-none"
        >
          {/* Main timeline track axis */}
          <line
            x1={paddingX}
            y1={axisY}
            x2={svgWidth - paddingX}
            y2={axisY}
            stroke="currentColor"
            strokeWidth="2"
            className="text-muted-foreground/30"
          />

          {/* Day boundary ticks and labels */}
          {dayTicks.map((t, idx) => (
            <g key={idx}>
              <line
                x1={t.x}
                y1={axisY - 8}
                x2={t.x}
                y2={axisY + 8}
                stroke="currentColor"
                strokeWidth="1"
                className="text-muted-foreground/40"
              />
              <text
                x={t.x}
                y={axisY + 22}
                textAnchor="middle"
                className="text-[10px] fill-muted-foreground font-mono"
              >
                {t.label}
              </text>
            </g>
          ))}

          {/* DST Transition markers */}
          {analysis.transitions
            .filter(
              (tr) =>
                tr.at.getTime() >= fromDate.getTime() &&
                tr.at.getTime() <= untilDate.getTime()
            )
            .map((tr, idx) => {
              const x = paddingX + timelineX(tr.at, fromDate, rangeDays, trackWidth);
              return (
                <g key={idx}>
                  <line
                    x1={x}
                    y1={15}
                    x2={x}
                    y2={axisY + 12}
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    className="text-amber-500"
                  />
                  <text
                    x={x}
                    y={12}
                    textAnchor="middle"
                    className="text-[9px] fill-amber-500 font-bold font-sans"
                  >
                    DST {tr.kind.toUpperCase()}
                  </text>
                </g>
              );
            })}

          {/* Run points */}
          {timelineRuns.map((r, idx) => {
            const x = paddingX + timelineX(r, fromDate, rangeDays, trackWidth);
            const title = `Local: ${formatLocal(r, state.tz)}\nUTC: ${formatUtc(r)}`;
            return (
              <circle
                key={idx}
                data-testid="timeline-dot"
                cx={x}
                cy={axisY}
                r="4.5"
                tabIndex={0}
                className="fill-primary stroke-background stroke-2 hover:fill-primary/80 focus:outline-none focus:ring-2 focus:ring-ring transition-transform hover:scale-125 cursor-pointer"
              >
                <title>{title}</title>
              </circle>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
