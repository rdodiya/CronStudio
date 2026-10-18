import { describe, it, expect } from 'vitest';
import { parseShareParams, toShareQuery } from '@/lib/share';

describe('Task 9: Share-URL codec', () => {
  it('parses valid share parameters', () => {
    const query = '?expr=0%209%20*%20*%201-5&dialect=unix&tz=Asia/Kolkata&format=kubernetes';
    const parsed = parseShareParams(query);
    expect(parsed.loaded).toBe(true);
    expect(parsed.expr).toBe('0 9 * * 1-5');
    expect(parsed.dialect).toBe('unix');
    expect(parsed.tz).toBe('Asia/Kolkata');
    expect(parsed.format).toBe('kubernetes');
  });

  it('parses now override timestamp parameter', () => {
    const query = '?expr=30%202%20*%20*%20*&tz=America/New_York&now=2026-03-07T00:00:00Z';
    const parsed = parseShareParams(query);
    expect(parsed.loaded).toBe(true);
    expect(parsed.now).toBe('2026-03-07T00:00:00Z');
  });

  it('drops invalid values and sanitizes malicious input without throwing', () => {
    const malicious = '?expr=<script>x</script>&tz=Not/AZone&dialect=evil&format=x';
    const parsed = parseShareParams(malicious);
    expect(parsed.tz).toBeUndefined();
    expect(parsed.dialect).toBeUndefined();
    expect(parsed.format).toBeUndefined();
    expect(parsed.expr).toBe('<script>x</script>');
    expect(parsed.loaded).toBe(true);
  });

  it('returns loaded=false when expr is missing or exceeds 200 chars', () => {
    expect(parseShareParams('?tz=Not/AZone').loaded).toBe(false);
    expect(parseShareParams('').loaded).toBe(false);
    expect(parseShareParams('?expr=' + 'a'.repeat(201)).loaded).toBe(false);
  });

  it('round-trips state cleanly', () => {
    const original = {
      expr: '0 9 * * 1-5',
      dialect: 'unix' as const,
      tz: 'Asia/Kolkata',
      format: 'kubernetes' as const,
    };
    const query = toShareQuery(original);
    const roundTripped = parseShareParams(query);
    expect(roundTripped).toEqual({
      ...original,
      loaded: true,
    });
  });
});
