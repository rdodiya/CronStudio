import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { cronReducer, CronProvider, AppState } from '@/context/CronContext';
import { useCron } from '@/hooks/useCron';
import { CopyButton } from '@/components/copy-button';

describe('Task 10: State, Reducer, and Context', () => {
  const initialState: AppState = {
    expr: '0 0 9 ? * 2',
    dialect: 'quartz',
    tz: 'UTC',
    nowOverride: null,
    format: 'expression',
    mode: 'raw',
    runCount: 25,
    fromShare: false,
  };

  beforeEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('SET_DIALECT converts safely between quartz and unix or preserves expression', () => {
    // Safe conversion
    const s1 = cronReducer(initialState, { type: 'SET_DIALECT', dialect: 'unix' });
    expect(s1.expr).toBe('0 9 * * 1');
    expect(s1.dialect).toBe('unix');

    // Unsafe conversion preserves expr
    const unsafeState: AppState = {
      ...initialState,
      expr: '0 0 12 L * ?',
      dialect: 'quartz',
    };
    const s2 = cronReducer(unsafeState, { type: 'SET_DIALECT', dialect: 'unix' });
    expect(s2.expr).toBe('0 0 12 L * ?');
    expect(s2.dialect).toBe('unix');
  });

  it('SET_TZ drops invalid timezones', () => {
    const s = cronReducer(initialState, { type: 'SET_TZ', tz: 'Not/AZone' });
    expect(s.tz).toBe('UTC');

    const sValid = cronReducer(initialState, { type: 'SET_TZ', tz: 'America/New_York' });
    expect(sValid.tz).toBe('America/New_York');
  });

  it('handles nowOverride with fallback when garbage is provided', () => {
    function TestComponent() {
      const { nowIssue, analysis } = useCron();
      return (
        <div>
          <span data-testid="now-issue">{nowIssue || 'none'}</span>
          <span data-testid="runs-count">{analysis.runs.length}</span>
        </div>
      );
    }

    render(
      <CronProvider initial={{ ...initialState, expr: '0 9 * * *', dialect: 'unix', nowOverride: 'garbage' }}>
        <TestComponent />
      </CronProvider>
    );

    expect(screen.getByTestId('now-issue').textContent).not.toBe('none');
    expect(Number(screen.getByTestId('runs-count').textContent)).toBeGreaterThan(0);
  });

  it('shows share-banner when fromShare is true', () => {
    function ShareTest() {
      const { state } = useCron();
      return state.fromShare ? <div data-testid="share-banner">Shared link loaded</div> : null;
    }

    const { unmount } = render(
      <CronProvider initial={{ ...initialState, fromShare: true }}>
        <ShareTest />
      </CronProvider>
    );
    expect(screen.getByTestId('share-banner')).toBeInTheDocument();
    unmount();
    window.history.replaceState(null, '', '/');

    render(
      <CronProvider initial={{ ...initialState, fromShare: false }}>
        <ShareTest />
      </CronProvider>
    );
    expect(screen.queryByTestId('share-banner')).not.toBeInTheDocument();

    // Test hydration directly from URL query
    window.history.replaceState(null, '', '/?expr=0+9+*+*+1-5&tz=Asia/Kolkata&dialect=unix');
    const { unmount: unmountHydrate } = render(
      <CronProvider>
        <ShareTest />
      </CronProvider>
    );
    expect(screen.getByTestId('share-banner')).toBeInTheDocument();
    unmountHydrate();

    window.history.replaceState(null, '', '/?tz=Not/AZone');
    render(
      <CronProvider>
        <ShareTest />
      </CronProvider>
    );
    expect(screen.queryByTestId('share-banner')).not.toBeInTheDocument();
  });
});

describe('Task 10: CopyButton', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
    vi.useFakeTimers();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('copies text and shows checkmark reverting after 2 seconds', async () => {
    render(<CopyButton text="0 9 * * *" label="cron expression" />);
    const btn = screen.getByRole('button');
    expect(btn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(btn);
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('0 9 * * *');

    expect(screen.getByTestId('copy-check')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByTestId('copy-check')).not.toBeInTheDocument();
  });

  it('announces in live region and shows toast when big is true', async () => {
    render(<CopyButton text="0 9 * * *" label="cron expression" big />);
    const btn = screen.getByRole('button');
    await act(async () => {
      fireEvent.click(btn);
    });

    const liveRegion = screen.getByRole('status');
    expect(liveRegion.textContent).toContain('Copied cron expression');
  });
});
