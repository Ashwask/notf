import { test, expect } from '@playwright/test';
import { auditPage } from './_helpers';

test('communities listing', async ({ page }, info) => {
  await auditPage(page, info, '/communities/');
});

test('communities search filters cards', async ({ page }) => {
  await page.goto('/communities/', { waitUntil: 'networkidle' });
  const search = page.locator('input[type="search"], input[placeholder*="Search" i]').first();
  if (await search.count()) {
    await search.fill('bengaluru');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('communities-search-bengaluru.png', { fullPage: true });
  }
});
