'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useCron } from '@/hooks/useCron';
import { dayMatches } from '@/lib/cron/index';
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
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
];

export function Calendar() {
  const { state, liveParse } = useCron();

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
    if (typeof navigator !== 'undefined') {
      const locale = navigator.language || 'en-US';
      setWeekStart(weekStartDefault(locale));
    }
  }, []);

  const grid = useMemo(() => {
    return monthGrid(currentYear, currentMonth, weekStart);
  }, [currentYear, currentMonth, weekStart]);

  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const schedule = liveParse.ok && 'schedule' in liveParse ? liveParse.schedule : null;

  // Active days count in this month
  const activeDaysCount = useMemo(() => {
    if (!schedule) return 0;
    const daysInMonth = new Date(Date.UTC(currentYear, currentMonth, 0)).getUTCDate();
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      if (dayMatches(schedule, currentYear, currentMonth, d)) {
        count++;
      }
    }
    return count;
  }, [schedule, currentYear, currentMonth]);

  const weekdayHeaders =
    weekStart === 7
      ? ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
      : ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  return (
    <div className="flex flex-col border-2 border-border bg-card shadow-[4px_4px_0px_var(--border)]">
      {/* Header */}
      <div className="p-3 border-b-2 border-border bg-paper flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-foreground" />
          <h2 className="font-mono text-xs font-black uppercase tracking-wider text-foreground">
            MONTHLY CALENDAR MATRIX // {MONTH_NAMES[currentMonth - 1]} {currentYear}
          </h2>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <span className="text-[10px] font-black uppercase bg-primary text-primary-foreground px-2 py-0.5 border-2 border-border shadow-[1px_1px_0px_var(--border)]">
            {activeDaysCount} TRIGGER DAYS
          </span>

          <div className="flex items-center border-2 border-border bg-card">
            <button
              type="button"
              onClick={prevMonth}
              aria-label="Previous Month"
              className="p-1 hover:bg-muted border-r-2 border-border active:translate-x-[1px] active:translate-y-[1px]"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              aria-label="Next Month"
              className="p-1 hover:bg-muted active:translate-x-[1px] active:translate-y-[1px]"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 font-mono">
        {/* 7-Column Grid Matrix with solid keylines */}
        <div className="grid grid-cols-7 border-t-2 border-l-2 border-border bg-paper-dark">
          {/* Header Row */}
          {weekdayHeaders.map((day, idx) => (
            <div
              key={idx}
              className={`p-1.5 text-center text-[10px] font-black uppercase bg-card border-r-2 border-b-2 border-border ${
                day === 'SUN' || day === 'SAT' ? 'text-muted-foreground' : 'text-foreground'
              }`}
            >
              {day}
            </div>
          ))}

          {/* Grid Cells */}
          {grid.map((row, rIdx) =>
            row.map((cell, cIdx) => {
              if (!cell.date) {
                return (
                  <div
                    key={`${rIdx}-${cIdx}`}
                    className="p-1.5 min-h-[46px] bg-paper-dark border-r-2 border-b-2 border-border opacity-30"
                  />
                );
              }

              const dayNum = cell.date.getUTCDate();
              const cellMonth = cell.date.getUTCMonth() + 1;
              const cellYear = cell.date.getUTCFullYear();
              const isMatch = schedule ? dayMatches(schedule, cellYear, cellMonth, dayNum) : false;

              return (
                <div
                  key={`${rIdx}-${cIdx}`}
                  data-testid={isMatch ? 'calendar-active-day' : undefined}
                  className={`p-1.5 min-h-[46px] border-r-2 border-b-2 border-border flex flex-col justify-between transition-none ${
                    isMatch
                      ? 'bg-primary text-primary-foreground font-black'
                      : 'bg-card text-muted-foreground hover:bg-paper'
                  }`}
                >
                  <span className="text-xs font-black leading-none">{dayNum}</span>
                  <span
                    className={`text-[8px] font-black uppercase px-1 py-0.2 self-start border ${
                      isMatch
                        ? 'bg-foreground text-background border-foreground'
                        : 'text-muted-foreground/60 border-transparent'
                    }`}
                  >
                    {isMatch ? 'ACTIVE' : 'OFF'}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
