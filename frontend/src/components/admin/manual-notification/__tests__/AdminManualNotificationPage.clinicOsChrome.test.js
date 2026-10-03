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
  const historyCss = read('src/components/admin/manual-notification/ManualNotificationBatchHistory.css');
  const formJs = read('src/components/admin/manual-notification/ManualNotificationForm.js');
  const historyJs = read('src/components/admin/manual-notification/ManualNotificationBatchHistory.js');

  test('uses Clinic-OS page scope not B0KlA shell import', () => {
    expect(pageJs).not.toMatch(/AdminDashboardB0KlA\.css/);
    expect(pageJs).toMatch(/manual-notification--clinic-os/);
    expect(pageJs).not.toMatch(/mg-v2-ad-b0kla/);
    expect(pageJs).toMatch(/mg-v2-admin-manual-notification/);
  });

  test('quiet header (SettingsPageShell) Korean i18n; no invented KPI strip', () => {
    expect(pageJs).toMatch(/<SettingsPageShell/);
    expect(pageJs).not.toMatch(/\bContentHeader\b/);
    expect(pageJs).toMatch(/manualNotification\.page\.title/);
    expect(pageJs).not.toMatch(/mapping-management-summary/);
  });

  test('form + history sections render SettingsSectionPanel; page CSS has no stage card geometry', () => {
    expect(formJs).toMatch(/<SettingsSectionPanel/);
    expect(historyJs).toMatch(/<SettingsSectionPanel/);
    expect(pageJs).not.toMatch(/mg-admin-manual-notif-page__stage/);
    expect(pageCss).not.toMatch(/mg-admin-manual-notif-page__stage/);
    expect(pageCss).not.toMatch(/!important/);
    [formCss, historyCss, resultCss].forEach((css) => {
      expect(css).not.toMatch(/box-shadow/);
      expect(css).not.toMatch(/dashed/);
      const declarations = css.split('\n').filter((line) => !line.trim().startsWith('@media'));
      expect(declarations.join('\n')).not.toMatch(/\b\d+px\b/);
    });
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
