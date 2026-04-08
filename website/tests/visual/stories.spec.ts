import { test } from '@playwright/test';
import { auditPage } from './_helpers';

test('stories', async ({ page }, info) => {
  await auditPage(page, info, '/stories/');
});
