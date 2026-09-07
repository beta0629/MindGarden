/**
 * IntegratedMatchingSchedule Clinic-OS chrome alignment — cascade / copy / structure locks
 *
 * @author CoreSolution
 * @since 2026-09-01
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');
const read = (rel) => fs.readFileSync(path.join(FRONTEND_ROOT, rel), 'utf8');

describe('IntegratedMatchingSchedule Clinic-OS chrome', () => {
  const scheduleJs = read('src/components/admin/mapping-management/IntegratedMatchingSchedule.js');
  const scheduleCss = read('src/components/admin/mapping-management/IntegratedMatchingSchedule.css');
  const summaryJs = read(
    'src/components/admin/mapping-management/integrated-schedule/molecules/IntegratedScheduleSummaryStrip.js'
  );
  const clientFilterCss = read(
    'src/components/admin/mapping-management/integrated-schedule/molecules/ClientFilterMultiSelect.css'
  );

  test('uses Clinic-OS page scope not B0KlA shell import', () => {
    expect(scheduleJs).toMatch(/integrated-schedule--clinic-os/);
    expect(scheduleJs).not.toMatch(/AdminDashboardB0KlA\.css/);
    expect(scheduleJs).not.toMatch(/integrated-schedule--b0kla/);
    expect(scheduleJs).not.toMatch(/mg-v2-ad-b0kla__container/);
  });

  test('header CTA uses MGButton not custom B0KlA button skin', () => {
    expect(scheduleJs).toMatch(/import MGButton from/);
    expect(scheduleJs).toMatch(/integrated-schedule__header-actions/);
    expect(scheduleJs).not.toMatch(/ActionBarButton/);
    expect(scheduleJs).not.toMatch(/integrated-schedule__btn-new-mapping/);
    expect(scheduleCss).not.toMatch(/\.integrated-schedule__btn-new-mapping\s*\{/);
    expect(scheduleCss).toMatch(/integrated-schedule__header-actions[\s\S]*height:\s*var\(--button-height-sm\)/);
  });

  test('quiet header Korean copy', () => {
    expect(scheduleJs).toMatch(/title="통합 스케줄"/);
    expect(scheduleJs).not.toMatch(/title="통합 스케줄링"/);
  });

  test('summary strip present (3-cell Ledger SSOT)', () => {
    expect(scheduleJs).toMatch(/IntegratedScheduleSummaryStrip/);
    expect(summaryJs).toMatch(/integrated-schedule-summary/);
    expect(scheduleCss).toMatch(/\.integrated-schedule-summary\s*\{[^}]*grid-template-columns:\s*repeat\(3/s);
    expect(scheduleCss).not.toMatch(/integrated-schedule-summary__cell::before/);
  });

  test('main stage single card geometry', () => {
    expect(scheduleJs).toMatch(/integrated-schedule__stage/);
    expect(scheduleCss).toMatch(/\.integrated-schedule__stage\s*\{[^}]*border-radius:\s*var\(--mg-v2-radius-lg\)/s);
  });

  test('sidebar title has no left accent bar', () => {
    expect(scheduleCss).toMatch(/\.integrated-schedule__sidebar-title::before[\s\S]*content:\s*none/);
    expect(scheduleCss).toMatch(/border-left:\s*none\s*!important/);
  });

  test('status selected uses Clinic-OS primary solid; filter uses neutral (not primary hue)', () => {
    expect(scheduleCss).toMatch(
      /\.integrated-schedule__status-btn--selected\s*\{[^}]*--mg-v2-color-primary-solid/s
    );
    expect(scheduleCss).not.toMatch(/--ad-b0kla-green/);
    expect(clientFilterCss).not.toMatch(/--ad-b0kla/);

    const filterSelectedBlock = scheduleCss.match(
      /\.integrated-schedule__filter-label\.integrated-schedule__filter-label--selected\s*\{[^}]+\}/s
    );
    expect(filterSelectedBlock).not.toBeNull();
    expect(filterSelectedBlock[0]).not.toMatch(/--mg-v2-color-primary-solid/);
    expect(filterSelectedBlock[0]).not.toMatch(
      /color-mix\(\s*in\s+srgb\s*,\s*var\(--mg-v2-color-primary-main\)\s*14%/
    );
    expect(filterSelectedBlock[0]).toMatch(/--mg-v2-color-neutral-100/);
    expect(filterSelectedBlock[0]).toMatch(/--mg-v2-color-neutral-300/);
  });

  test('calendar wrapper allows horizontal scroll without clipping weekdays', () => {
    expect(scheduleCss).toMatch(
      /\.integrated-schedule__calendar-wrapper\s*\{[^}]*overflow-x:\s*auto/s
    );
    expect(scheduleCss).toMatch(
      /\.integrated-schedule__calendar-wrapper\s+\.mg-v2-ad-b0kla\.mg-v2-schedule-calendar\s*\{[^}]*min-width:\s*700px/s
    );
  });

  test('same-day pending calendar prefix has no emoji', () => {
    expect(scheduleCss).not.toMatch(/content:\s*"🕐"/);
    expect(scheduleCss).toMatch(/content:\s*"당일"/);
  });
});
