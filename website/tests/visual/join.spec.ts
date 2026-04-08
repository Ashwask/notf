import { test, expect } from '@playwright/test';
import { auditPage, hideDynamic } from './_helpers';

test('join step 1', async ({ page }, info) => {
  await auditPage(page, info, '/join/');
});

test('join step 2 themes render', async ({ page }) => {
  await page.goto('/join/', { waitUntil: 'networkidle' });
  await hideDynamic(page);
  // Fill step 1 minimal
  await page.locator('#name').fill('Test Org');
  await page.locator('#city').selectOption({ index: 1 });
  const nbr = page.locator('#neighbourhood');
  if (await nbr.isVisible()) await nbr.fill('Test Neighbourhood');
  await page.getByRole('button', { name: /next/i }).click();
  await page.waitForTimeout(300);
  // Step 2 should now show theme chips
  const chips = page.locator('#themeCheckboxes label');
  await expect(chips.first()).toBeVisible();
  expect(await chips.count()).toBeGreaterThanOrEqual(8);
  await expect(page).toHaveScreenshot('join-step-2.png', { fullPage: true });
});
