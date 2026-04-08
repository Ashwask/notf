import { test } from '@playwright/test';
import { auditPage } from './_helpers';

test('home', async ({ page }, info) => {
  await auditPage(page, info, '/');
});
