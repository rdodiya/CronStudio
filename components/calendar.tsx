'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useCron } from '@/hooks/useCron';
import { dayMatches } from '@/lib/cron/index';
import { Button } from './ui/button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export function weekStartDefault(locale: string): 1 | 7 {
  try {
    if (!locale) return 7;
    const loc = new Intl.Locale(locale);
    const weekInfo = (loc as unknown as { getWeekInfo?: () => { firstDay: number }; weekInfo?: { firstDay: number } });
    const firstDay = weekInfo.getWeekInfo?.()?.firstDay ?? weekInfo.weekInfo?.firstDay;
    if (firstDay !== undefined) {
      return firstDay === 1 ? 1 : 7;
    }
    const region = loc.region || (locale.includes('-') ? locale.split('-')[1].toUpperCase() : '');
    if (['US', 'CA', 'MX', 'BR', 'JP', 'IL', 'SA'].includes(region)) {
      return 7;
    }
    return 1;
  } catch {
    return 7;
  }
}

export function monthGrid(
  year: number,
  month: number, // 1-12
  weekStart: 1 | 7
): { date: Date | null }[][] {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstDayJsDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); // 0=Sun..6=Sat

  // If weekStart === 7 (Sunday start): offset is firstDayJsDow
  // If weekStart === 1 (Monday start): offset is (firstDayJsDow + 6) % 7
  const startOffset = weekStart === 7 ? firstDayJsDow : (firstDayJsDow + 6) % 7;

  const rows: { date: Date | null }[][] = [];
  let currentRow: { date: Date | null }[] = [];

  for (let i = 0; i < startOffset; i++) {
    currentRow.push({ date: null });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    currentRow.push({ date: new Date(Date.UTC(year, month - 1, d)) });
    if (currentRow.length === 7) {
      rows.push(currentRow);
      currentRow = [];
    }
  }

  if (currentRow.length > 0) {
    while (currentRow.length < 7) {
      currentRow.push({ date: null });
    }
    rows.push(currentRow);
  }

  return rows;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function Calendar() {
  const { state, liveParse, analysis } = useCron();

  const referenceDate = useMemo(() => {
    if (state.nowOverride) {
      const parsed = new Date(state.nowOverride);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  }, [state.nowOverride]);

  const [currentYear, setCurrentYear] = useState<number>(referenceDate.getUTCFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(referenceDate.getUTCMonth() + 1);
  const [weekStart, setWeekStart] = useState<1 | 7>(7);

  useEffect(() => {
    setCurrentYear(referenceDate.getUTCFullYear());
    setCurrentMonth(referenceDate.getUTCMonth() + 1);
  }, [referenceDate]);

  useEffect(() => {
    const saved = localStorage.getItem('cs.weekStart');
    if (saved === '1' || saved === '7') {
      setWeekStart(Number(saved) as 1 | 7);
    } else if (typeof navigator !== 'undefined') {
      setWeekStart(weekStartDefault(navigator.language));
    }
  }, []);

  const handleWeekStartToggle = (ws: 1 | 7) => {
    setWeekStart(ws);
    localStorage.setItem('cs.weekStart', String(ws));
  };

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const grid = useMemo(() => {
    return monthGrid(currentYear, currentMonth, weekStart);
  }, [currentYear, currentMonth, weekStart]);

  const dayHeaders = weekStart === 7
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const schedule = liveParse.ok && 'schedule' in liveParse ? liveParse.schedule : null;

  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Monthly Calendar Heatmap</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Week start selector */}
          <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => handleWeekStartToggle(7)}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                weekStart === 7
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sun
            </button>
            <button
              type="button"
              onClick={() => handleWeekStartToggle(1)}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                weekStart === 1
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Mon
            </button>
          </div>

          {/* Month pagination */}
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={handlePrevMonth} className="w-7 h-7">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs font-semibold min-w-[110px] text-center">
              {MONTH_NAMES[currentMonth - 1]} {currentYear}
            </span>
            <Button variant="outline" size="icon" onClick={handleNextMonth} className="w-7 h-7">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 7-column calendar grid */}
      <div className="border rounded-lg p-2 bg-muted/10 overflow-x-auto">
        <div className="grid grid-cols-7 gap-1 text-center min-w-[320px]">
          {/* Weekday headers */}
          {dayHeaders.map((dh, i) => (
            <div key={i} className="text-[11px] font-semibold text-muted-foreground py-1">
              {dh}
            </div>
          ))}

          {/* Days cells */}
          {grid.map((row, rIdx) =>
            row.map((cell, cIdx) => {
              if (!cell.date) {
                return <div key={`${rIdx}-${cIdx}`} className="h-9 rounded-md bg-transparent" />;
              }

              const dayNum = cell.date.getUTCDate();
              const jsDow = cell.date.getUTCDay();
              const isWeekend = jsDow === 0 || jsDow === 6;

              const isMatch = schedule
                ? dayMatches(schedule, currentYear, currentMonth, dayNum)
                : false;

              // Check if date is today
              const isToday =
                cell.date.getUTCFullYear() === referenceDate.getUTCFullYear() &&
                cell.date.getUTCMonth() === referenceDate.getUTCMonth() &&
                cell.date.getUTCDate() === referenceDate.getUTCDate();

              // Check if DST transition date
              const isDstDay = analysis.transitions.some((tr) => {
                const trDate = tr.at;
                return (
                  trDate.getUTCFullYear() === currentYear &&
                  trDate.getUTCMonth() + 1 === currentMonth &&
                  trDate.getUTCDate() === dayNum
                );
              });

              return (
                <div
                  key={`${rIdx}-${cIdx}`}
                  tabIndex={0}
                  data-testid={isMatch ? 'calendar-active-day' : undefined}
                  className={`h-9 rounded-md flex flex-col items-center justify-center text-xs font-medium transition-colors relative cursor-default ${
                    isMatch
                      ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                      : isWeekend
                      ? 'bg-muted/40 text-muted-foreground'
                      : 'bg-background hover:bg-muted text-foreground'
                  } ${isToday ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                  title={`${MONTH_NAMES[currentMonth - 1]} ${dayNum}, ${currentYear}${
                    isMatch ? ' (Schedule matches)' : ''
                  }${isDstDay ? ' (DST transition)' : ''}`}
                >
                  <span>{dayNum}</span>
                  {isDstDay && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute bottom-1" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
