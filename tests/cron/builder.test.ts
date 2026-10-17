import { describe, it, expect } from 'vitest';
import { parseUnix } from '@/lib/cron/unix/parser';
import {
  builderToExpr,
  exprToBuilder,
  PRESETS,
  BuilderState,
} from '@/lib/cron/builder';

describe('Task 9: Visual builder logic and presets', () => {
  it('validates all PRESETS are valid Unix cron expressions', () => {
    for (const preset of PRESETS) {
      if (preset.id === 'custom') continue;
      const parsed = parseUnix(preset.expr);
      expect(parsed.ok).toBe(true);
    }
  });

  it('round-trips standard presets via builderToExpr(exprToBuilder)', () => {
    for (const preset of PRESETS) {
      if (preset.id === 'custom') continue;
      if (preset.expr === '*/15 9-18 * * *') {
        expect(exprToBuilder(preset.expr)).toBeNull();
      } else {
        const state = exprToBuilder(preset.expr);
        expect(state).not.toBeNull();
        if (state) {
          expect(builderToExpr(state)).toBe(preset.expr);
        }
      }
    }
  });

  it('formats weekly builder states with range compression', () => {
    const weeklyState: BuilderState = {
      frequency: 'weekly',
      everyN: 1,
      minute: 0,
      hour: 9,
      weekdays: [1, 2, 3, 4, 5],
      dayOfMonth: 1,
    };
    expect(builderToExpr(weeklyState)).toBe('0 9 * * 1-5');

    const splitDays: BuilderState = {
      frequency: 'weekly',
      everyN: 1,
      minute: 30,
      hour: 14,
      weekdays: [1, 3, 5],
      dayOfMonth: 1,
    };
    expect(builderToExpr(splitDays)).toBe('30 14 * * 1,3,5');
  });

  it('formats minute, hourly, daily, and monthly states', () => {
    expect(
      builderToExpr({
        frequency: 'minutes',
        everyN: 10,
        minute: 0,
        hour: 0,
        weekdays: [],
        dayOfMonth: 1,
      })
    ).toBe('*/10 * * * *');

    expect(
      builderToExpr({
        frequency: 'hourly',
        everyN: 2,
        minute: 15,
        hour: 0,
        weekdays: [],
        dayOfMonth: 1,
      })
    ).toBe('15 */2 * * *');

    expect(
      builderToExpr({
        frequency: 'daily',
        everyN: 1,
        minute: 0,
        hour: 12,
        weekdays: [],
        dayOfMonth: 1,
      })
    ).toBe('0 12 * * *');

    expect(
      builderToExpr({
        frequency: 'monthly',
        everyN: 1,
        minute: 0,
        hour: 0,
        weekdays: [],
        dayOfMonth: 15,
      })
    ).toBe('0 0 15 * *');

    expect(
      builderToExpr({
        frequency: 'custom',
        everyN: 1,
        minute: 0,
        hour: 0,
        weekdays: [],
        dayOfMonth: 1,
      })
    ).toBe('0 9 * * 1-5');
  });

  it('handles invalid or unparseable expressions gracefully', () => {
    expect(exprToBuilder('too few fields')).toBeNull();
    expect(exprToBuilder('0 0 * 5 *')).toBeNull(); // month not *
    expect(exprToBuilder('0 0 * * invalid')).toBeNull(); // invalid dow
  });
});
