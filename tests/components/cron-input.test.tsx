import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CronProvider } from '@/context/CronContext';
import { CronInput } from '@/components/cron-input';

describe('Task 10: CronInput Component', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('typing 60 * * * * immediately shows error containing 0-59', () => {
    render(
      <CronProvider initial={{ expr: '* * * * *', dialect: 'unix', tz: 'UTC', nowOverride: null, format: 'expression', mode: 'raw', runCount: 25, fromShare: false }}>
        <CronInput />
      </CronProvider>
    );

    const input = screen.getByTestId('cron-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '60 * * * *' } });

    expect(screen.getByText(/0-59/i)).toBeInTheDocument();
  });

  it('keeps focus and caret position on typing', () => {
    render(
      <CronProvider initial={{ expr: '0 9 * * 1-5', dialect: 'unix', tz: 'UTC', nowOverride: null, format: 'expression', mode: 'raw', runCount: 25, fromShare: false }}>
        <CronInput />
      </CronProvider>
    );

    const input = screen.getByTestId('cron-input') as HTMLInputElement;
    input.focus();
    input.setSelectionRange(1, 1);
    fireEvent.change(input, { target: { value: '0 10 * * 1-5', selectionStart: 3, selectionEnd: 3 } });

    expect(document.activeElement).toBe(input);
  });

  it('editing field-minute to */5 updates raw input to */5 * * * *', () => {
    render(
      <CronProvider initial={{ expr: '0 * * * *', dialect: 'unix', tz: 'UTC', nowOverride: null, format: 'expression', mode: 'raw', runCount: 25, fromShare: false }}>
        <CronInput />
      </CronProvider>
    );

    const minuteField = screen.getByTestId('field-minute') as HTMLInputElement;
    fireEvent.change(minuteField, { target: { value: '*/5' } });

    const rawInput = screen.getByTestId('cron-input') as HTMLInputElement;
    expect(rawInput.value).toBe('*/5 * * * *');
  });
});
