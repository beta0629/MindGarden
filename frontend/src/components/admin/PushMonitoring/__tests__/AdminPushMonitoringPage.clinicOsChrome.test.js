/**
 * AdminPushMonitoringPage Clinic-OS chrome alignment — cascade / structure locks
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

describe('AdminPushMonitoringPage Clinic-OS chrome', () => {
  const pageJs = read('src/components/admin/PushMonitoring/AdminPushMonitoringPage.jsx');
  const pageCss = read('src/components/admin/PushMonitoring/AdminPushMonitoringPage.css');
  const kpiJs = read('src/components/admin/PushMonitoring/molecules/PushMonitorKpiRow.jsx');
  const kpiCss = read('src/components/admin/PushMonitoring/molecules/PushMonitorKpiRow.css');
  const filtersCss = read('src/components/admin/PushMonitoring/molecules/PushMonitorFilters.css');
  const badgeCss = read('src/components/admin/PushMonitoring/atoms/PushMonitorOperationalBadge.css');
  const failureCss = read('src/components/admin/PushMonitoring/molecules/PushMonitorFailureList.css');

  test('uses Clinic-OS page scope not B0KlA shell import', () => {
    expect(pageJs).not.toMatch(/AdminDashboardB0KlA\.css/);
    expect(pageJs).toMatch(/push-monitoring--clinic-os/);
    expect(pageJs).not.toMatch(/mg-v2-ad-b0kla/);
    expect(pageJs).toMatch(/data-testid="admin-push-monitoring-page"/);
  });

  test('quiet header present; KPI remapped to mapping-management-summary strip', () => {
    expect(pageJs).toMatch(/ContentHeader/);
    expect(kpiJs).toMatch(/mapping-management-summary/);
    expect(kpiJs).toMatch(/mapping-management-summary--cols-4/);
    expect(kpiJs).toMatch(/KpiNumeral/);
    expect(kpiCss).toMatch(/mapping-management-summary--cols-4/);
  });

  test('main stage single card geometry', () => {
    expect(pageJs).toMatch(/mg-push-monitor__stage/);
    expect(pageCss).toMatch(/min-height:\s*36rem/);
    expect(pageCss).toMatch(/border:\s*1px solid var\(--mg-v2-color-neutral-300\)/);
    expect(pageCss).toMatch(/background:\s*var\(--mg-v2-color-neutral-50\)/);
    expect(pageCss).toMatch(/border-radius:\s*var\(--mg-v2-radius-lg\)/);
    expect(pageCss).toMatch(/border-left:\s*none\s*!important/);
  });

  test('chrome CSS has no leftover --ad-b0kla tokens or 4px left accents', () => {
    expect(pageCss).not.toMatch(/--ad-b0kla/);
    expect(kpiCss).not.toMatch(/--ad-b0kla/);
    expect(filtersCss).not.toMatch(/--ad-b0kla/);
    expect(badgeCss).not.toMatch(/--ad-b0kla/);
    expect(failureCss).not.toMatch(/--ad-b0kla/);
    expect(pageCss).not.toMatch(/border-left:\s*4px/);
    expect(badgeCss).not.toMatch(/border-left-width:\s*4px/);
    expect(badgeCss).not.toMatch(/border-left:\s*4px/);
    expect(failureCss).not.toMatch(/border-left-width:\s*3px/);
  });

  test('no hex hardcoding in push-monitoring chrome CSS', () => {
    const hex = /#[0-9a-fA-F]{3,8}\b/;
    expect(pageCss).not.toMatch(hex);
    expect(kpiCss).not.toMatch(hex);
    expect(filtersCss).not.toMatch(hex);
    expect(badgeCss).not.toMatch(hex);
  });
});
