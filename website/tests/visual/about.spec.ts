import { test } from '@playwright/test';
import { auditPage } from './_helpers';

test('about', async ({ page }, info) => {
  await auditPage(page, info, '/about/');
});
