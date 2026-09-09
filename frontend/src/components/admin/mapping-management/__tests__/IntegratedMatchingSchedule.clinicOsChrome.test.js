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

  test('Management wrapper does not import B0KlA shell CSS', () => {
    const managementJs = read('src/components/admin/IntegratedMatchingScheduleManagement.js');
    expect(managementJs).not.toMatch(/AdminDashboardB0KlA\.css/);
  });

  test('header CTA uses MGButton not custom B0KlA button skin', () => {
    expect(scheduleJs).toMatch(/import MGButton from/);
    expect(scheduleJs).toMatch(/integrated-schedule__header-actions/);
    expect(scheduleJs).not.toMatch(/ActionBarButton/);
    expect(scheduleJs).not.toMatch(/integrated-schedule__btn-new-mapping/);
    expect(scheduleCss).not.toMatch(/\.integrated-schedule__btn-new-mapping\s*\{/);
    expect(scheduleCss).toMatch(
      /--integrated-schedule-chrome-control-height:\s*2\.25rem/
    );
    expect(scheduleCss).toMatch(
      /integrated-schedule__header-actions[\s\S]*height:\s*var\(--integrated-schedule-chrome-control-height\)/
    );
  });

  test('header CTA is fail-closed ADMIN/STAFF only', () => {
    expect(scheduleJs).toMatch(/isAdminLikeScheduleUserRole/);
    expect(scheduleJs).toMatch(/canCreateMappingCta/);
    expect(scheduleJs).toMatch(/mapLegacyRole/);
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

  test('status filter uses 2-column grid cards (ops SSOT)', () => {
    const statusBtnsBlock = scheduleCss.match(
      /\.integrated-schedule__status-btns\s*\{[^}]+\}/s
    );
    expect(statusBtnsBlock).not.toBeNull();
    expect(statusBtnsBlock[0]).toMatch(/display:\s*grid/);
    expect(statusBtnsBlock[0]).toMatch(/grid-template-columns:\s*repeat\(\s*2/);
    expect(statusBtnsBlock[0]).not.toMatch(/flex-wrap/);

    const statusBtnBlock = scheduleCss.match(
      /\.integrated-schedule__status-btn\s*\{[^}]+\}/s
    );
    expect(statusBtnBlock).not.toBeNull();
    expect(statusBtnBlock[0]).toMatch(/width:\s*100%/);
    expect(statusBtnBlock[0]).toMatch(/justify-content:\s*space-between/);
    expect(statusBtnBlock[0]).not.toMatch(/inline-flex/);
    expect(statusBtnBlock[0]).not.toMatch(/flex:\s*0\s+0\s+auto/);
  });

  test('selection chrome vars are screen-local (not in global Clinic-OS / design tokens)', () => {
    const clinicOsScope = scheduleCss.match(
      /\.integrated-schedule\.integrated-schedule--clinic-os\s*\{[^}]+\}/s
    );
    expect(clinicOsScope).not.toBeNull();
    expect(clinicOsScope[0]).toMatch(/--integrated-schedule-selection-fill\s*:/);
    expect(clinicOsScope[0]).toMatch(/--integrated-schedule-selection-accent\s*:/);

    const globalTokenSources = [
      'src/styles/unified-design-tokens.css',
      'src/styles/dashboard-tokens-extension.css',
      'src/styles/responsive-layout-tokens.css',
      'src/styles/tokens/design-v2-tokens.css',
      'src/styles/tokens/design-v2-tokens-refine.css',
      'src/styles/01-settings/_iphone17-tokens.css'
    ];
    globalTokenSources.forEach((rel) => {
      const tokenCss = read(rel);
      expect(tokenCss).not.toMatch(/--integrated-schedule-selection-fill/);
      expect(tokenCss).not.toMatch(/--integrated-schedule-selection-accent/);
    });
  });

  test('status selected uses v3 fill + left ink bar / tabs 1px hair (not thick ring / teal)', () => {
    const selectedBlock = scheduleCss.match(
      /\.integrated-schedule__status-btn--selected\s*\{[^}]+\}/s
    );
    expect(selectedBlock).not.toBeNull();
    expect(selectedBlock[0]).not.toMatch(/--mg-v2-color-primary-solid/);
    expect(selectedBlock[0]).not.toMatch(/--mg-v2-color-primary-main/);
    expect(selectedBlock[0]).not.toMatch(/#0E5F5A/);
    expect(selectedBlock[0]).not.toMatch(/#E6F2F1/);
    expect(selectedBlock[0]).not.toMatch(/--mg-v2-color-neutral-100/);
    expect(selectedBlock[0]).not.toMatch(/border:\s*var\(--mg-v2-border-width-thick/);
    expect(selectedBlock[0]).not.toMatch(/border:\s*2px\s+solid/);
    expect(selectedBlock[0]).not.toMatch(/border:\s*3px\s+solid/);
    expect(selectedBlock[0]).toMatch(
      /border-left-width:\s*var\(--integrated-schedule-selection-accent,\s*3px\)|border-left-width:\s*3px/
    );
    expect(selectedBlock[0]).toMatch(
      /border-left-color:\s*var\(--integrated-schedule-selection-ink|--cs-ink|--cs-slate-900/
    );
    expect(selectedBlock[0]).toMatch(
      /--integrated-schedule-selection-fill|--cs-slate-200/
    );
    expect(selectedBlock[0]).not.toMatch(/--cs-slate-100(?!-)/);
    expect(selectedBlock[0]).toMatch(
      /--integrated-schedule-selection-border-selected-card|--cs-slate-400/
    );
    expect(selectedBlock[0]).toMatch(
      /--integrated-schedule-selection-ink|--cs-ink|--cs-slate-900|--mg-v2-color-text-primary/
    );

    const selectedHoverBlock = scheduleCss.match(
      /\.integrated-schedule__status-btn--selected:hover\s*\{[^}]+\}/s
    );
    expect(selectedHoverBlock).not.toBeNull();
    expect(selectedHoverBlock[0]).not.toMatch(/--mg-v2-color-primary-dark/);
    expect(selectedHoverBlock[0]).not.toMatch(/--mg-v2-color-primary-solid/);
    expect(selectedHoverBlock[0]).not.toMatch(/#0E5F5A/);

    const statusBtnBlock = scheduleCss.match(
      /\.integrated-schedule__status-btn\s*\{[^}]+\}/s
    );
    expect(statusBtnBlock).not.toBeNull();
    expect(statusBtnBlock[0]).toMatch(/--integrated-schedule-status-surface|--mg-v2-color-surface-card/);
    expect(statusBtnBlock[0]).toMatch(/--integrated-schedule-selection-border|--cs-slate-200|--cs-line/);

    const statusFocusBlock = scheduleCss.match(
      /\.integrated-schedule__status-btn:focus-visible\s*\{[^}]+\}/s
    );
    expect(statusFocusBlock).not.toBeNull();
    expect(statusFocusBlock[0]).toMatch(
      /outline:\s*var\(--mg-v2-border-width-thick,\s*2px\)|outline:\s*2px\s+solid/
    );
    expect(statusFocusBlock[0]).toMatch(/outline-offset:\s*2px/);
    expect(statusFocusBlock[0]).toMatch(/--integrated-schedule-selection-ink|--cs-ink|--cs-slate-900/);
    expect(statusFocusBlock[0]).not.toMatch(/#0E5F5A/);
    expect(statusFocusBlock[0]).not.toMatch(/--mg-v2-color-primary/);

    const selectedBadgeBlock = scheduleCss.match(
      /\.integrated-schedule__status-btn--selected\s+\.integrated-schedule__status-badge\s*\{[^}]+\}/s
    );
    expect(selectedBadgeBlock).not.toBeNull();
    expect(selectedBadgeBlock[0]).toMatch(
      /--integrated-schedule-selection-ink|--cs-ink|--cs-slate-900|--mg-v2-color-text-primary/
    );
    expect(selectedBadgeBlock[0]).not.toMatch(/--mg-v2-color-text-secondary/);

    expect(scheduleCss).toMatch(/--integrated-schedule-selection-fill:\s*var\(--cs-slate-200\)/);
    expect(scheduleCss).toMatch(/--integrated-schedule-selection-accent:\s*3px/);
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
    expect(filterSelectedBlock[0]).not.toMatch(/#0E5F5A/);
    expect(filterSelectedBlock[0]).not.toMatch(/#E6F2F1/);
    expect(filterSelectedBlock[0]).not.toMatch(/--mg-v2-color-neutral-100/);
    expect(filterSelectedBlock[0]).not.toMatch(/border-bottom:\s*[^;]*primary/);
    expect(filterSelectedBlock[0]).not.toMatch(/border-left-width/);
    expect(filterSelectedBlock[0]).not.toMatch(/border:\s*var\(--mg-v2-border-width-thick/);
    expect(filterSelectedBlock[0]).not.toMatch(/border:\s*2px\s+solid/);
    expect(filterSelectedBlock[0]).not.toMatch(/border:\s*3px\s+solid/);
    expect(filterSelectedBlock[0]).toMatch(/--integrated-schedule-selection-fill|--cs-slate-200/);
    expect(filterSelectedBlock[0]).toMatch(
      /--integrated-schedule-selection-border-selected-tab|--cs-slate-300/
    );
    expect(filterSelectedBlock[0]).toMatch(
      /--integrated-schedule-selection-ink|--cs-ink|--cs-slate-900|--mg-v2-color-text-primary/
    );
    expect(filterSelectedBlock[0]).toMatch(
      /font-weight:\s*var\(--mg-v2-font-weight-bold|--mg-font-weight-bold|font-weight:\s*700/
    );

    const filterFocusBlock = scheduleCss.match(
      /\.integrated-schedule__filter-label:has\(input:focus-visible\)\s*\{[^}]+\}/s
    );
    expect(filterFocusBlock).not.toBeNull();
    expect(filterFocusBlock[0]).toMatch(
      /outline:\s*var\(--mg-v2-border-width-thick,\s*2px\)|outline:\s*2px\s+solid/
    );
    expect(filterFocusBlock[0]).toMatch(/outline-offset:\s*2px/);
    expect(filterFocusBlock[0]).toMatch(/--integrated-schedule-selection-ink|--cs-ink|--cs-slate-900/);
  });

  test('calendar wrapper fits weekdays without forced 700px horizontal scroll', () => {
    expect(scheduleCss).not.toMatch(/min-width:\s*700px/);
    expect(scheduleCss).toMatch(
      /\.integrated-schedule__calendar-wrapper\s*\{[^}]*min-width:\s*0/s
    );
    expect(scheduleCss).toMatch(
      /\.integrated-schedule__calendar-wrapper\s*\{[^}]*overflow-x:\s*hidden/s
    );

    const calendarInnerBlock = scheduleCss.match(
      /\.integrated-schedule__calendar-wrapper\s+\.mg-v2-ad-b0kla\.mg-v2-schedule-calendar\s*\{[^}]+\}/s
    );
    expect(calendarInnerBlock).not.toBeNull();
    expect(calendarInnerBlock[0]).toMatch(/min-width:\s*0/);
    expect(calendarInnerBlock[0]).toMatch(/width:\s*100%/);
    expect(calendarInnerBlock[0]).not.toMatch(/min-width:\s*700px/);
  });

  test('saved view controls are secondary collapsed (details/summary)', () => {
    const sidebarJs = read(
      'src/components/admin/mapping-management/integrated-schedule/organisms/MatchingScheduleSidebar.js'
    );
    expect(sidebarJs).toMatch(/integrated-schedule__saved-view-details/);
    expect(sidebarJs).toMatch(/integrated-schedule__saved-view-summary/);
    expect(scheduleCss).toMatch(/\.integrated-schedule__saved-view-details\s*\{/);
  });

  test('same-day pending calendar prefix has no emoji', () => {
    expect(scheduleCss).not.toMatch(/content:\s*"🕐"/);
    expect(scheduleCss).toMatch(/content:\s*"당일"/);
  });
});
