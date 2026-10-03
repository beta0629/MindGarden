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
 * @updated 2026-10-03 — SettingsSummaryStrip · TabChipRow · ListTableView 계약
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
  const filtersJs = read('src/components/admin/PushMonitoring/molecules/PushMonitorFilters.jsx');
  const bannersJs = read('src/components/admin/PushMonitoring/molecules/PushMonitorOperationalBanners.jsx');
  const failureJs = read('src/components/admin/PushMonitoring/molecules/PushMonitorFailureList.jsx');
  const snapshotJs = read('src/components/admin/PushMonitoring/molecules/PushMonitorTenantSnapshotTable.jsx');
  const smsLogJs = read('src/components/admin/PushMonitoring/organisms/SmsLogCard.jsx');

  test('uses Clinic-OS page scope not B0KlA shell import', () => {
    expect(pageJs).not.toMatch(/AdminDashboardB0KlA\.css/);
    expect(pageJs).toMatch(/push-monitoring--clinic-os/);
    expect(pageJs).not.toMatch(/mg-v2-ad-b0kla/);
    expect(pageJs).toMatch(/data-testid="admin-push-monitoring-page"/);
  });

  test('quiet header (SettingsPageShell) present; KPI uses SettingsSummaryStrip', () => {
    expect(pageJs).toMatch(/<SettingsPageShell/);
    expect(pageJs).not.toMatch(/\bContentHeader\b/);
    expect(kpiJs).toMatch(/<SettingsSummaryStrip/);
    expect(kpiJs).not.toMatch(/mapping-management-summary/);
    expect(kpiJs).not.toMatch(/KpiNumeral/);
    expect(kpiCss).not.toMatch(/mapping-management-summary/);
  });

  test('filters use TabChipRow in settings toolbar; error banner is SettingsNotice', () => {
    expect(filtersJs).toMatch(/<TabChipRow/);
    expect(filtersJs).toMatch(/mg-v2-settings-toolbar/);
    expect(filtersJs).not.toMatch(/SegmentedTabs/);
    expect(filtersCss).not.toMatch(/border:/);
    expect(pageJs).toMatch(/<SettingsNotice[\s\S]*PUSH_MONITOR_ERROR_BANNER/);
    expect(pageJs).not.toMatch(/mg-push-monitor__error-banner/);
    expect(pageCss).not.toMatch(/mg-push-monitor__error-banner/);
    expect(bannersJs).toMatch(/<SettingsNotice/);
    expect(bannersJs).not.toMatch(/PushMonitorOperationalBadge/);
  });

  test('tabular data uses ListTableView or settings kv, no role="table" div grids', () => {
    expect(failureJs).toMatch(/<ListTableView/);
    expect(smsLogJs).toMatch(/<ListTableView/);
    expect(snapshotJs).toMatch(/mg-v2-settings-kv/);
    [failureJs, smsLogJs, snapshotJs].forEach((src) => {
      expect(src).not.toMatch(/role="table"/);
      expect(src).not.toMatch(/role="row"/);
      expect(src).not.toMatch(/<button\b/);
    });
  });

  test('sections render SettingsSectionPanel; page CSS has no stage card geometry', () => {
    ['PushMonitorFailureSection', 'PushMonitorOperationalSection', 'PushMonitorSnapshotSection',
      'PushMonitorTrendSection', 'SmsLogCard'].forEach((name) => {
      const organismJs = read(`src/components/admin/PushMonitoring/organisms/${name}.jsx`);
      expect(organismJs).toMatch(/<SettingsSectionPanel/);
      expect(organismJs).not.toMatch(/\bContentSection\b/);
    });
    expect(pageJs).not.toMatch(/mg-push-monitor__stage/);
    expect(pageCss).not.toMatch(/mg-push-monitor__stage/);
    expect(pageCss).not.toMatch(/!important/);
    expect(pageCss).not.toMatch(/\b\d+px\b/);
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
