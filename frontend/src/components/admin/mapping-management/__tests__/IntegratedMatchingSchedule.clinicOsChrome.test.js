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

  test('clinic-os stage is flush (no leftover card padding/border)', () => {
    /* admin-shell pad만 본문 여백 — stage 이중 인셋 금지 (≤767 contents와 정합) */
    expect(scheduleCss).toMatch(
      /\.integrated-schedule--clinic-os\s+\.integrated-schedule__stage\s*\{[^}]*padding:\s*0[^}]*border:\s*none/s
    );
    expect(scheduleCss).toMatch(
      /\.integrated-schedule--clinic-os\s+\.integrated-schedule__stage\s*\{[^}]*border:\s*none/s
    );
  });

  test('sidebar title has no left accent bar', () => {
    expect(scheduleCss).toMatch(/\.integrated-schedule__sidebar-title::before[\s\S]*content:\s*none/);
    expect(scheduleCss).toMatch(/border-left:\s*none\s*!important/);
  });

  test('status filter uses 2-col grid (r3 rail density)', () => {
    const statusBtnsBlock = scheduleCss.match(
      /\.integrated-schedule__status-btns\s*\{[^}]+\}/s
    );
    expect(statusBtnsBlock).not.toBeNull();
    expect(statusBtnsBlock[0]).toMatch(/display:\s*grid/);
    expect(statusBtnsBlock[0]).toMatch(/grid-template-columns:\s*repeat\(2/);

    const statusBtnBlock = scheduleCss.match(
      /\.integrated-schedule__status-btn\s*\{[^}]+\}/s
    );
    expect(statusBtnBlock).not.toBeNull();
    expect(statusBtnBlock[0]).toMatch(/justify-content:\s*space-between/);
  });

  test('sidebar width token is clamp r3 · no 48 strip · overlay <1110 / in-flow ≥1110', () => {
    const rootBlock = scheduleCss.match(/\.integrated-schedule\s*\{[^}]+\}/s);
    expect(rootBlock).not.toBeNull();
    expect(rootBlock[0]).toMatch(
      /--integrated-schedule-sidebar-width:\s*clamp\(/
    );
    expect(rootBlock[0]).not.toMatch(/380px/);
    expect(scheduleCss).not.toMatch(/--integrated-schedule-sidebar-width:\s*320px/);
    expect(scheduleCss).not.toMatch(/--integrated-schedule-sidebar-width:\s*380px/);

    const sidebarBlock = scheduleCss.match(
      /\.integrated-schedule__sidebar\s*\{[^}]+\}/s
    );
    expect(sidebarBlock).not.toBeNull();
    expect(sidebarBlock[0]).not.toMatch(/--integrated-schedule-sidebar-width\s*:/);

    expect(scheduleCss).toMatch(/@media\s*\(min-width:\s*1110px\)/);
    expect(scheduleCss).toMatch(/@media\s*\(max-width:\s*1109px\)/);
    expect(scheduleCss).toMatch(/integrated-schedule--rail-in-flow/);
    expect(scheduleCss).toMatch(/integrated-schedule--rail-overlay/);
    expect(scheduleCss).toMatch(/integrated-schedule__rail-open-btn/);
    expect(scheduleCss).toMatch(/integrated-schedule__rail-scrim/);

    /* 48폭 스트립 회귀 금지 */
    expect(scheduleCss).not.toMatch(
      /\.integrated-schedule__sidebar--collapsed\s*\{[^}]*width:\s*48px/s
    );
    expect(scheduleJs).toMatch(/SIDEBAR_AUTO_COLLAPSE_BREAKPOINT_PX\s*=\s*1109/);
    expect(scheduleJs).toMatch(/SIDEBAR_IN_FLOW_MIN_WIDTH_PX\s*=\s*1110/);
  });

  test('open filter-details can shrink and scroll to avoid card AABB overlap', () => {
    const openBlock = scheduleCss.match(
      /\.integrated-schedule__filter-details\[open\]\s*\{[^}]+\}/s
    );
    expect(openBlock).not.toBeNull();
    expect(openBlock[0]).toMatch(/flex:\s*0\s+1\s+auto/);
    expect(openBlock[0]).toMatch(/min-height:\s*0/);
    /* 부모 대비 비율 상한 — 고정 px 아님. list 와 세로 대역 분리 */
    expect(openBlock[0]).toMatch(/max-height:\s*50%/);
    expect(openBlock[0]).toMatch(/overflow-y:\s*auto/);
    expect(openBlock[0]).not.toMatch(/flex-shrink:\s*0/);
    expect(openBlock[0]).not.toMatch(/position:\s*absolute/);

    /* clinic-os 특이도 승격 — 닫힘 flex-shrink:0 이 열림을 이기지 않음 */
    const clinicOpenBlock = scheduleCss.match(
      /\.integrated-schedule--clinic-os\s+\.integrated-schedule__filter-details\[open\]\s*\{[^}]+\}/s
    );
    expect(clinicOpenBlock).not.toBeNull();
    expect(clinicOpenBlock[0]).toMatch(/flex:\s*0\s+1\s+auto/);
    expect(clinicOpenBlock[0]).toMatch(/max-height:\s*50%/);
    expect(clinicOpenBlock[0]).toMatch(/min-height:\s*0/);
    expect(clinicOpenBlock[0]).toMatch(/overflow-y:\s*auto/);
    expect(clinicOpenBlock[0]).not.toMatch(/flex-shrink:\s*0/);

    /* [open]{flex-shrink:0} 승자 패턴 금지 — 열림 블록에만 검사 */
    expect(scheduleCss).not.toMatch(
      /\.integrated-schedule(?:--clinic-os)?\s*\.integrated-schedule__filter-details\[open\]\s*\{[^}]*flex-shrink:\s*0/s
    );
  });

  test('clinic-os sidebar-body keeps flex height chain for filter/list split', () => {
    const bodyBlock = scheduleCss.match(
      /\.integrated-schedule--clinic-os\s+\.integrated-schedule__sidebar-body\s*\{[^}]+\}/s
    );
    expect(bodyBlock).not.toBeNull();
    expect(bodyBlock[0]).toMatch(/flex:\s*1\s+1\s+0%/);
    expect(bodyBlock[0]).toMatch(/min-height:\s*0/);
    expect(bodyBlock[0]).toMatch(/overflow:\s*hidden/);
  });

  test('overlay rail (<1110) stacks above calendar; in-flow main-region isolates FC z-index', () => {
    /* r3: 오버레이 레일 z-index 17 · 스크림 16 · 달력 위 */
    expect(scheduleCss).toMatch(
      /\.integrated-schedule--rail-overlay\s+\.integrated-schedule__sidebar--overlay-open\s*\{[^}]*z-index:\s*17/s
    );
    expect(scheduleCss).toMatch(
      /\.integrated-schedule__rail-scrim\s*\{[^}]*z-index:\s*16/s
    );
    const mainRegionClinic = scheduleCss.match(
      /\.integrated-schedule--clinic-os\s+\.integrated-schedule__main-region\s*\{[^}]+\}/s
    );
    expect(mainRegionClinic).not.toBeNull();
    expect(mainRegionClinic[0]).toMatch(/position:\s*relative/);
    expect(mainRegionClinic[0]).toMatch(/z-index:\s*0/);
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

    /* closed details content must not keep layout boxes (ghost click occlusion) */
    const closedSavedViewBlock = scheduleCss.match(
      /\.integrated-schedule__saved-view-details:not\(\[open\]\)\s*>\s*\*:not\(summary\)\s*\{[^}]+\}/s
    );
    expect(closedSavedViewBlock).not.toBeNull();
    expect(closedSavedViewBlock[0]).toMatch(/display:\s*none/);
  });

  test('same-day pending calendar prefix has no emoji and no CSS content string', () => {
    expect(scheduleCss).not.toMatch(/content:\s*"🕐"/);
    expect(scheduleCss).not.toMatch(/content:\s*"당일"/);
    const calendarJs = read('src/components/ui/Schedule/ScheduleCalendarView.js');
    const chipCopy = read('src/components/ui/Schedule/integratedMonthChipCopy.js');
    expect(calendarJs).toMatch(/mg-v2-ad-calendar-event__same-day/);
    expect(chipCopy).toMatch(/schedule:calendar\.compact\.sameDayPrefix/);
  });

  test('회기·가예약·기관연계 칩 색은 semantic 토큰만 (hex 없음)', () => {
    const pendingBlock = scheduleCss.match(
      /\.integrated-schedule__event--same-day-pending,[\s\S]*?font-style:\s*italic;/
    );
    const institutionBlock = scheduleCss.match(
      /\.integrated-schedule__event--institution-link,[\s\S]*?font-style:\s*normal;/
    );
    expect(pendingBlock).not.toBeNull();
    expect(institutionBlock).not.toBeNull();
    expect(pendingBlock[0]).toMatch(/--mg-v2-color-semantic-warning/);
    expect(pendingBlock[0]).toMatch(/dashed/);
    expect(pendingBlock[0]).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
    expect(institutionBlock[0]).toMatch(/--mg-v2-color-semantic-info/);
    expect(institutionBlock[0]).toMatch(/solid/);
    expect(institutionBlock[0]).not.toMatch(/dashed/);
    expect(institutionBlock[0]).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
    // 기관연계 범례는 ScheduleLegend 글자 배지 하나만 — ■ 사각 범례는 두지 않는다
    expect(scheduleJs).not.toMatch(/legend-swatch--institution-link/);
    expect(scheduleJs).toMatch(/legend-swatch--same-day/);
  });

  test('당일결제 범례는 가로 padding(space-2)이 없고 안내 줄과 같은 시작선이다', () => {
    const sameDayLegend = scheduleCss.match(
      /\.integrated-schedule__legend--same-day\s*\{[^}]+\}/
    );
    expect(sameDayLegend).not.toBeNull();
    expect(sameDayLegend[0]).toMatch(/padding-block:\s*var\(--mg-v2-space-1\)/);
    expect(sameDayLegend[0]).toMatch(/padding-inline:\s*0/);
    expect(sameDayLegend[0]).not.toMatch(/padding:\s*var\(--mg-v2-space-1\)\s+var\(--mg-v2-space-2\)/);
    expect(sameDayLegend[0]).not.toMatch(/padding-left:\s*var\(--mg-v2-space-2\)/);
    expect(sameDayLegend[0]).not.toMatch(/padding-inline:\s*var\(--mg-v2-space-2\)/);
    expect(sameDayLegend[0]).not.toMatch(/8px/);
  });
});
