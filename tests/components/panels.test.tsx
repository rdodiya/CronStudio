import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { CronProvider } from '@/context/CronContext';
import { CronInput } from '@/components/cron-input';
import { VisualBuilder } from '@/components/visual-builder';
import { ExplanationPanel } from '@/components/explanation-panel';
import { SafetyChecks } from '@/components/safety-checks';
import { ExportPanel } from '@/components/export-panel';
import { ShareUrl } from '@/components/share-url';

describe('Task 11: Panels (Builder, Explanation, Safety, Export, Share)', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('clicking preset-weekdays-at-9-00-am updates input and explanation-summary', () => {
    render(
      <CronProvider initial={{ expr: '* * * * *', dialect: 'unix', tz: 'UTC' }}>
        <CronInput />
        <VisualBuilder />
        <ExplanationPanel />
      </CronProvider>
    );

    const presetBtn = screen.getByTestId('preset-weekdays-at-9-00-am');
    fireEvent.click(presetBtn);

    const input = screen.getByTestId('cron-input') as HTMLInputElement;
    expect(input.value).toBe('0 9 * * 1-5');

    const summary = screen.getByTestId('explanation-summary');
    expect(summary.textContent).toBe('At 09:00, Monday through Friday');
  });

  it('every preset click yields a valid parse without safety error', () => {
    render(
      <CronProvider initial={{ expr: '* * * * *', dialect: 'unix', tz: 'UTC' }}>
        <VisualBuilder />
        <SafetyChecks />
      </CronProvider>
    );

    const presetButtons = screen.getAllByTestId(/^preset-/);
    for (const btn of presetButtons) {
      fireEvent.click(btn);
      expect(screen.queryByTestId('safety-error')).not.toBeInTheDocument();
    }
  });

  it('shows weekday checkboxes only when weekly frequency is selected', () => {
    render(
      <CronProvider initial={{ expr: '0 9 * * 1-5', dialect: 'unix', tz: 'UTC' }}>
        <VisualBuilder />
      </CronProvider>
    );

    expect(screen.getByTestId('weekday-checkboxes')).toBeInTheDocument();

    const select = screen.getByTestId('frequency-select');
    fireEvent.change(select, { target: { value: 'hourly' } });

    expect(screen.queryByTestId('weekday-checkboxes')).not.toBeInTheDocument();
  });

  it('shows builder as Custom for complex expressions without overwriting raw text', () => {
    render(
      <CronProvider initial={{ expr: '*/15 9-18 * * *', dialect: 'unix', tz: 'UTC' }}>
        <VisualBuilder />
        <CronInput />
      </CronProvider>
    );

    const select = screen.getByTestId('frequency-select') as HTMLSelectElement;
    expect(select.value).toBe('custom');

    const rawInput = screen.getByTestId('cron-input') as HTMLInputElement;
    expect(rawInput.value).toBe('*/15 9-18 * * *');
  });

  it('export panel handles kubernetes and github with UTC warning', () => {
    render(
      <CronProvider initial={{ expr: '0 9 * * 1-5', dialect: 'unix', tz: 'Asia/Kolkata', format: 'kubernetes' }}>
        <ExportPanel />
      </CronProvider>
    );

    expect(screen.getByTestId('export-output').textContent).toContain('kind: CronJob');

    const githubTab = screen.getByTestId('export-tab-github');
    fireEvent.click(githubTab);

    expect(screen.getByTestId('export-warning').textContent).toContain('UTC');
  });

  it('shows manual review warning on unsafe quartz to kubernetes export', () => {
    render(
      <CronProvider initial={{ expr: '0 0 12 L * ?', dialect: 'quartz', tz: 'UTC', format: 'kubernetes' }}>
        <ExportPanel />
      </CronProvider>
    );

    expect(screen.getByTestId('export-output').textContent).toBe('');
    expect(screen.getByTestId('export-warning').textContent).toContain('Conversion requires manual review');
  });

  it('copy-share-link writes a URL containing expr= to clipboard', async () => {
    render(
      <CronProvider initial={{ expr: '0 9 * * 1-5', dialect: 'unix', tz: 'UTC' }}>
        <ShareUrl />
      </CronProvider>
    );

    const copyBtn = screen.getByTestId('copy-share-link');
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('expr=')
    );
  });

  it('renders gracefully on empty or invalid expressions without crashing', () => {
    const { unmount } = render(
      <CronProvider initial={{ expr: '', dialect: 'unix', tz: 'UTC' }}>
        <ExplanationPanel />
        <SafetyChecks />
        <ExportPanel />
      </CronProvider>
    );
    expect(screen.getAllByText(/empty expression/i).length).toBeGreaterThan(0);
    unmount();

    render(
      <CronProvider initial={{ expr: 'invalid * * *', dialect: 'unix', tz: 'UTC' }}>
        <ExplanationPanel />
        <SafetyChecks />
        <ExportPanel />
      </CronProvider>
    );
    expect(screen.getAllByText(/invalid/i).length).toBeGreaterThan(0);
  });
});
