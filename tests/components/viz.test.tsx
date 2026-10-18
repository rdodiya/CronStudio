import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CronProvider } from '@/context/CronContext';
import { timelineX, Timeline } from '@/components/timeline';
import { weekStartDefault, monthGrid, Calendar } from '@/components/calendar';
import { NextRunsTable } from '@/components/next-runs-table';
import { FrequencySummary } from '@/components/frequency-summary';

describe('Task 12: Visualization pure helpers', () => {
  const from = new Date('2026-10-16T00:00:00Z');
  const sevenDaysLater = new Date(from.getTime() + 7 * 86400 * 1000);
  const threePointFiveDaysLater = new Date(from.getTime() + 3.5 * 86400 * 1000);

  it('timelineX calculates proportional horizontal positions', () => {
    expect(timelineX(from, from, 7, 700)).toBe(0);
    expect(timelineX(sevenDaysLater, from, 7, 700)).toBe(700);
    expect(timelineX(threePointFiveDaysLater, from, 7, 700)).toBe(350);
  });

  it('weekStartDefault respects locale standards and falls back gracefully', () => {
    expect(weekStartDefault('en-US')).toBe(7); // Sunday
    expect(weekStartDefault('en-GB')).toBe(1); // Monday
    expect(weekStartDefault('')).toBe(7); // fallback without throwing
  });

  it('monthGrid builds correct 7-column calendar grids', () => {
    const grid = monthGrid(2026, 10, 7);
    expect(grid[0]).toHaveLength(7);
    // 2026-10-01 was Thursday, so for Sunday-start (7), index 0 is Sunday (null)
    expect(grid[0][0].date).toBeNull();

    let nonNullCount = 0;
    for (const row of grid) {
      expect(row).toHaveLength(7);
      for (const cell of row) {
        if (cell.date !== null) {
          nonNullCount++;
        }
      }
    }
    expect(nonNullCount).toBe(31); // October has 31 days
  });
});

describe('Task 12: Visualization components', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('NextRunsTable renders 25 rows by default and expands on click show-50', () => {
    render(
      <CronProvider initial={{ expr: '0 9 * * *', dialect: 'unix', tz: 'UTC' }}>
        <NextRunsTable />
      </CronProvider>
    );

    const rows = screen.getAllByTestId('next-runs-row');
    expect(rows).toHaveLength(25);

    const show50Btn = screen.getByTestId('show-50');
    fireEvent.click(show50Btn);

    const expandedRows = screen.getAllByTestId('next-runs-row');
    expect(expandedRows).toHaveLength(50);
  });

  it('NextRunsTable renders ambiguous badge on DST overlap runs', () => {
    // 2026-11-01 in NY has fall-back overlap at 01:xx
    render(
      <CronProvider
        initial={{
          expr: '30 1 * * *',
          dialect: 'unix',
          tz: 'America/New_York',
          nowOverride: '2026-10-31T00:00:00Z',
        }}
      >
        <NextRunsTable />
      </CronProvider>
    );

    expect(screen.getAllByTestId('ambiguous-badge').length).toBeGreaterThan(0);
  });

  it('Timeline renders dots for runs and caps at 2000 dots with cap note', () => {
    const { unmount: unmount1 } = render(
      <CronProvider initial={{ expr: '0 9 * * *', dialect: 'unix', tz: 'UTC' }}>
        <Timeline />
      </CronProvider>
    );

    // 0 9 * * * over 7 days has 7 dots
    const dots7 = screen.getAllByTestId('timeline-dot');
    expect(dots7).toHaveLength(7);
    unmount1();
    window.history.replaceState(null, '', '/');

    // * * * * * (every minute) over 7 days = 10,080 minutes -> capped at 2,000 dots
    const { unmount: unmount2 } = render(
      <CronProvider initial={{ expr: '* * * * *', dialect: 'unix', tz: 'UTC' }}>
        <Timeline />
      </CronProvider>
    );
    expect(screen.getByTestId('timeline-cap')).toBeInTheDocument();
    unmount2();
  }, 45000);

  it('Calendar highlights matching days for monthly schedule', () => {
    render(
      <CronProvider initial={{ expr: '0 0 1 * *', dialect: 'unix', tz: 'UTC', nowOverride: '2026-10-16T00:00:00Z' }}>
        <Calendar />
      </CronProvider>
    );

    // 0 0 1 * * runs on day 1 of the month -> exactly 1 day highlighted in October
    const activeDays = screen.getAllByTestId('calendar-active-day');
    expect(activeDays).toHaveLength(1);
  });

  it('FrequencySummary formats perYear number with commas', () => {
    render(
      <CronProvider initial={{ expr: '*/5 * * * *', dialect: 'unix', tz: 'UTC', nowOverride: '2026-10-16T00:00:00Z' }}>
        <FrequencySummary />
      </CronProvider>
    );

    expect(screen.getByText(/105,120/)).toBeInTheDocument();
  });
});
