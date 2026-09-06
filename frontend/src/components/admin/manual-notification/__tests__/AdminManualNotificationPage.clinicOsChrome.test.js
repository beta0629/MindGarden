/**
 * AdminManualNotificationPage Clinic-OS chrome alignment — cascade / structure locks
 * Twin: ConsultationLogView.clinicOsChrome.test.js
 *
 * Hardcode gates cited:
 * - docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md §17
 * - docs/project-management/SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md §1.3
 *
 * @author CoreSolution
 * @since 2026-09-05
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');
const read = (rel) => fs.readFileSync(path.join(FRONTEND_ROOT, rel), 'utf8');

describe('AdminManualNotificationPage Clinic-OS chrome', () => {
  const pageJs = read('src/components/admin/manual-notification/AdminManualNotificationPage.js');
  const pageCss = read('src/components/admin/manual-notification/AdminManualNotificationPage.css');
  const formCss = read('src/components/admin/manual-notification/ManualNotificationForm.css');
  const resultCss = read('src/components/admin/manual-notification/BatchResultModal.css');

  test('uses Clinic-OS page scope not B0KlA shell import', () => {
    expect(pageJs).not.toMatch(/AdminDashboardB0KlA\.css/);
    expect(pageJs).toMatch(/manual-notification--clinic-os/);
    expect(pageJs).not.toMatch(/mg-v2-ad-b0kla/);
    expect(pageJs).toMatch(/mg-v2-admin-manual-notification/);
  });

  test('quiet header Korean i18n; no invented KPI strip', () => {
    expect(pageJs).toMatch(/ContentHeader/);
    expect(pageJs).toMatch(/manualNotification\.page\.title/);
    expect(pageJs).toMatch(/manualNotification\.page\.subtitle/);
    expect(pageJs).not.toMatch(/mapping-management-summary/);
  });

  test('main stage card geometry on form + history', () => {
    expect(pageJs).toMatch(/mg-admin-manual-notif-page__stage/);
    expect(pageCss).toMatch(/min-height:\s*36rem/);
    expect(pageCss).toMatch(/border:\s*1px solid var\(--mg-v2-color-neutral-300\)/);
    expect(pageCss).toMatch(/background:\s*var\(--mg-v2-color-neutral-50\)/);
    expect(pageCss).toMatch(/border-radius:\s*var\(--mg-v2-radius-lg\)/);
    expect(pageCss).toMatch(/border-left:\s*none\s*!important/);
  });

  test('no 4px left accents in form/result chrome CSS', () => {
    expect(formCss).not.toMatch(/border-left:\s*4px/);
    expect(formCss).not.toMatch(/border-left:\s*3px/);
    expect(resultCss).not.toMatch(/border-left:\s*4px/);
    expect(resultCss).not.toMatch(/border-left:\s*3px/);
  });

  test('page chrome CSS has no leftover --ad-b0kla or hex', () => {
    expect(pageCss).not.toMatch(/--ad-b0kla/);
    expect(pageCss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
