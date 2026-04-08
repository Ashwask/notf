import { test } from '@playwright/test';
import { auditPage } from './_helpers';

test('catalogue', async ({ page }, info) => {
  await auditPage(page, info, '/catalog/');
});
