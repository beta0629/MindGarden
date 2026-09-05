/**
 * ConsultationLogView Clinic-OS chrome alignment — cascade / structure locks
 * Twin: MappingManagement.clinicOsChrome.test.js
 *
 * @author CoreSolution
 * @since 2026-09-05
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const read = (rel) => fs.readFileSync(path.join(FRONTEND_ROOT, rel), 'utf8');

describe('ConsultationLogView Clinic-OS chrome', () => {
  const entryJs = read('src/components/admin/ConsultationLogView.js');
  const pageJs = read('src/components/admin/consultation-log-view/ConsultationLogViewPage.js');
  const pageCss = read('src/components/admin/ConsultationLogViewPage.css');
  const calendarCss = read('src/components/admin/consultation-log-view/ConsultationLogCalendarBlock.css');
  const tableCss = read('src/components/admin/consultation-log-view/ConsultationLogTableBlock.css');

  test('uses Clinic-OS page scope not B0KlA shell import', () => {
    expect(entryJs).not.toMatch(/AdminDashboardB0KlA\.css/);
    expect(pageJs).not.toMatch(/AdminDashboardB0KlA\.css/);
    expect(entryJs).not.toMatch(/mg-v2-ad-b0kla/);
    expect(pageJs).toMatch(/consultation-log-view--clinic-os/);
    expect(pageJs).not.toMatch(/mg-v2-ad-b0kla/);
  });

  test('quiet header Korean copy present; no invented KPI strip required', () => {
    expect(pageJs).toMatch(/ContentHeader/);
    expect(pageJs).toMatch(/상담일지 조회/);
    expect(pageJs).toMatch(/MGButton/);
  });

  test('view toggle active uses primary-solid / primary variant', () => {
    expect(pageJs).toMatch(/tabVariant = isActive \? 'primary' : 'outline'/);
    expect(pageCss).toMatch(/--mg-v2-color-primary-solid/);
    expect(pageCss).toMatch(/mg-v2-consultation-log-view-tabs__tab--active/);
    expect(pageCss).not.toMatch(/--ad-b0kla-green/);
  });

  test('main stage single card geometry on list/calendar/table', () => {
    expect(pageCss).toMatch(/min-height:\s*36rem/);
    expect(pageCss).toMatch(/border:\s*1px solid var\(--mg-v2-color-neutral-300\)/);
    expect(pageCss).toMatch(/background:\s*var\(--mg-v2-color-neutral-50\)/);
    expect(pageCss).toMatch(/border-radius:\s*var\(--mg-v2-radius-lg\)/);
    expect(calendarCss).toMatch(/min-height:\s*36rem/);
    expect(calendarCss).toMatch(/--mg-v2-color-neutral-300/);
    expect(tableCss).toMatch(/min-height:\s*36rem/);
    expect(tableCss).toMatch(/--mg-v2-color-neutral-300/);
  });

  test('page chrome CSS has no leftover --ad-b0kla tokens', () => {
    expect(pageCss).not.toMatch(/--ad-b0kla/);
    expect(calendarCss).not.toMatch(/--ad-b0kla/);
    expect(tableCss).not.toMatch(/--ad-b0kla/);
  });

  test('no hex hardcoding in consultation-log chrome CSS', () => {
    const hex = /#[0-9a-fA-F]{3,8}\b/;
    expect(pageCss).not.toMatch(hex);
    expect(calendarCss).not.toMatch(hex);
    expect(tableCss).not.toMatch(hex);
  });
});
