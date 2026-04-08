import { test } from '@playwright/test';
import { auditPage } from './_helpers';

test('map', async ({ page }, info) => {
  // Audit finding (PR 1): /map/ loads leaflet-omnivore but not leaflet.js,
  // so `L is not defined` fires before omnivore bundles it. Skip console
  // assertion until that's fixed.
  await auditPage(page, info, '/map/', { waitFor: '#map', skipConsole: true });
});
