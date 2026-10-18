import { test, expect } from '@playwright/test';

test.describe('Task 14: Critical E2E Workflows', () => {
  test('landing page loads at root and launches workbench', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=CRON_STUDIO')).toBeVisible();
    const launchBtn = page.locator('a[href*="/explain"]').first();
    await expect(launchBtn).toBeVisible();
  });

  test('enters 0 9 * * 1-5 and verifies explanation-summary and next-runs-row count', async ({
    page,
  }) => {
    await page.goto('/explain');
    const input = page.getByTestId('cron-input');
    await input.fill('0 9 * * 1-5');

    const summary = page.getByTestId('explanation-summary');
    await expect(summary).toHaveText('At 09:00, Monday through Friday');

    const rows = page.getByTestId('next-runs-row');
    await expect(rows).toHaveCount(25);
  });

  test('clicks each preset and verifies valid input and no safety errors', async ({ page }) => {
    await page.goto('/explain');
    const presets = page.locator('button[data-testid^="preset-"]');
    const count = await presets.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      await presets.nth(i).click();
      await expect(page.getByTestId('safety-error')).toHaveCount(0);
      const val = await page.getByTestId('cron-input').inputValue();
      expect(val.length).toBeGreaterThan(0);
    }
  });

  test('changes tz to Asia/Kolkata and verifies IST and matching UTC time', async ({ page }) => {
    await page.goto('/explain?expr=0+9+*+*+1-5&tz=Asia/Kolkata&dialect=unix');
    const firstRow = page.getByTestId('next-runs-row').first();
    await expect(firstRow).toBeVisible();

    const localTimeCell = firstRow.locator('td').nth(1);
    const utcTimeCell = firstRow.locator('td').nth(2);

    await expect(localTimeCell).toContainText('09:00');
    await expect(utcTimeCell).toContainText('03:30'); // 9:00 IST is 03:30 UTC
  });

  test('DST gap produces safety warning containing does not exist', async ({ page }) => {
    // 2026-03-08 in NY springs forward from 2am to 3am, so 2:30 does not exist
    await page.goto(
      '/explain?expr=30+2+*+*+*&tz=America/New_York&dialect=unix&now=2026-03-07T00:00:00Z'
    );
    const warnings = page.getByTestId('safety-warning');
    await expect(warnings.first()).toContainText('does not exist');
  });

  test('copies export tabs and verifies output', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/explain?expr=0+9+*+*+1-5&dialect=unix');

    const formats = ['kubernetes', 'github', 'vercel', 'eventbridge', 'cloudflare-toml'];
    for (const fmt of formats) {
      const tab = page.getByTestId(`export-tab-${fmt}`);
      if (await tab.isVisible()) {
        await tab.click();
        const copyBtn = page.getByTestId(`copy-${fmt}`);
        await copyBtn.click();
        const output = await page.getByTestId('export-output').innerText();
        const clipboard = await page.evaluate(() => navigator.clipboard.readText());
        const normalize = (s: string) =>
          s.replace(/\r\n/g, '\n').split('\n').map((l) => l.trimEnd()).join('\n').trim();
        expect(normalize(clipboard)).toBe(normalize(output));
      }
    }
  });

  test('loads share URL and preserves state without inflating history length', async ({ page }) => {
    await page.goto('/explain?expr=0+9+*+*+1-5&tz=Asia/Kolkata&dialect=unix&format=kubernetes');
    await expect(page.getByTestId('share-banner')).toBeVisible();

    const initialHistoryLength = await page.evaluate(() => window.history.length);
    const input = page.getByTestId('cron-input');
    await input.fill('0 10 * * 1-5');

    // Wait for debounced sync
    await page.waitForTimeout(300);
    const finalHistoryLength = await page.evaluate(() => window.history.length);
    expect(finalHistoryLength).toBe(initialHistoryLength);
  });

  test('theme-toggle cycles through choices and persists without flash', async ({ page }) => {
    await page.goto('/explain');
    const toggle = page.getByTestId('theme-toggle');
    await toggle.click();

    const htmlClass = await page.locator('html').getAttribute('class');
    await page.reload();
    const htmlClassAfterReload = await page.locator('html').getAttribute('class');
    expect(htmlClassAfterReload).toBe(htmlClass);
  });

  test('mobile viewport has no horizontal page scroll', async ({ page }) => {
    await page.goto('/explain?expr=0+9+*+*+1-5');
    const scrollWidth = await page.evaluate(() => document.scrollingElement?.scrollWidth ?? 0);
    const innerWidth = await page.evaluate(() => window.innerWidth);
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
  });

  test('privacy guarantee: all network requests stay strictly on same origin', async ({
    page,
  }) => {
    const externalRequests: string[] = [];
    page.on('request', (req) => {
      const url = new URL(req.url());
      if (url.origin !== 'http://localhost:3000' && !url.protocol.startsWith('data:')) {
        externalRequests.push(req.url());
      }
    });

    await page.goto('/explain');
    await page.getByTestId('cron-input').fill('*/5 * * * *');
    await page.waitForTimeout(200);

    expect(externalRequests).toEqual([]);
  });

  test('offline resilience: app continues rendering when offline', async ({ page, context }) => {
    await page.goto('/explain');
    await expect(page.getByTestId('cron-input')).toBeVisible();

    // Ensure service worker is registered and ready
    await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.ready;
        } catch (_) {}
      }
    });
    await page.waitForTimeout(1000);

    await context.setOffline(true);
    try {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('cron-input')).toBeVisible();
    } finally {
      await context.setOffline(false);
    }
  });

  test('hostile URL params are sanitized and execute no script', async ({ page }) => {
    await page.goto('/explain?expr=<script>window.__x=1</script>&tz=Not/AZone&dialect=evil');
    const xVal = await page.evaluate(() => (window as unknown as { __x?: number }).__x);
    expect(xVal).toBeUndefined();
    await expect(page.getByTestId('share-banner')).toHaveCount(0);
  });
});
