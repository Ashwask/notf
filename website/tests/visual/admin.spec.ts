import { test } from '@playwright/test';
import { auditPage } from './_helpers';

// Admin pages are gated by login; we screenshot the login screen as a baseline.
// Logged-in flows are added in PR 5 once a test admin seed exists.
test('admin login', async ({ page }, info) => {
  await auditPage(page, info, '/admin/login.html');
});
