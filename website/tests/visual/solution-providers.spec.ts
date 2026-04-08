import { test } from '@playwright/test';
import { auditPage } from './_helpers';

test('solution providers', async ({ page }, info) => {
  await auditPage(page, info, '/solution-providers/');
});
