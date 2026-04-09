import { test } from '@playwright/test';
import { auditPage } from './_helpers';

// One representative generated ward page. The 738 ward pages share a single
// Jinja template, so a single spec catches template-wide regressions.
// - skipConsole: ward pages reference older nav/chatbot scripts that occasionally
//   throw on missing elements; not in scope for this PR.
// - skipAxe: the ward template has pre-existing a11y findings (breadcrumb links
//   missing underline, etc.) that are tracked as a separate cleanup. The harness
//   here exists to catch icon/CSS regressions.
test('ward — bengaluru energy a-adugodi', async ({ page }, info) => {
  await auditPage(page, info, '/cities/bengaluru/climate/energy/wards/a-adugodi/', {
    skipConsole: true,
    skipAxe: true,
  });
});
