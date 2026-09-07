/**
 * SalaryManagement Clinic-OS chrome alignment — cascade / copy / structure locks
 * Symptoms from live .dev /erp/salary (2026-09-01): accent bars, emerald tabs,
 * full-bleed CTAs, print off-token, profile toolbar 단차, &quot;, raw grade enums.
 * ALIGNED (2026-09-06): Purchase twin quiet header + summary strip + stage.
 *
 * @author CoreSolution
 * @since 2026-09-01
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const read = (rel) => fs.readFileSync(path.join(FRONTEND_ROOT, rel), 'utf8');

describe('SalaryManagement Clinic-OS chrome', () => {
  const salaryJs = read('src/components/erp/SalaryManagement.js');
  const salaryCss = read('src/components/erp/SalaryManagement.css');
  const quietHeaderJs = read('src/components/erp/salary/SalaryQuietHeader.js');
  const summaryStripJs = read('src/components/erp/salary/SalarySummaryStrip.js');
  const printJs = read('src/components/common/PrintComponent.js');
  const printCss = read('src/components/common/PrintComponent.css');
  const erpKo = read('src/locales/ko/erp.json');
  const consultantCardJs = read('src/components/ui/Card/ConsultantCard.js');

  test('uses SalaryQuietHeader (not ContentHeader) + SalarySummaryStrip', () => {
    expect(salaryJs).toMatch(/import SalaryQuietHeader from ['"]\.\/salary\/SalaryQuietHeader['"]/);
    expect(salaryJs).toMatch(/import SalarySummaryStrip from ['"]\.\/salary\/SalarySummaryStrip['"]/);
    expect(salaryJs).toMatch(/<SalaryQuietHeader[\s\S]*onOpenConfig=/);
    expect(salaryJs).toMatch(/<SalarySummaryStrip/);
    expect(salaryJs).not.toMatch(/ContentHeader/);
    expect(quietHeaderJs).toMatch(/salary-management-header__title/);
    expect(summaryStripJs).toMatch(/salary-management-summary/);
  });

  test('ALIGNED shell: clinic-os + stage geometry tokens', () => {
    expect(salaryJs).toMatch(/salary-management--clinic-os/);
    expect(salaryJs).toMatch(/salary-management__stage/);
    expect(salaryCss).toMatch(/\.salary-management__stage\s*\{[^}]*min-height:\s*36rem/s);
    expect(salaryCss).toMatch(/border:\s*0\.0625rem solid var\(--mg-v2-color-neutral-300\)/);
    expect(salaryCss).toMatch(/background:\s*var\(--mg-v2-color-neutral-50\)/);
  });

  test('page JS has no B0KlA page chrome and no AdminDashboardB0KlA import', () => {
    expect(salaryJs).not.toMatch(/mg-v2-ad-b0kla/);
    expect(salaryJs).not.toMatch(/AdminDashboardB0KlA\.css/);
    expect(salaryCss).not.toMatch(/AdminDashboardB0KlA\.css/);
    expect(salaryCss).not.toMatch(/\.mg-v2-ad-b0kla/);
  });

  test('payout summary uses expense blue semantic-info', () => {
    expect(summaryStripJs).toMatch(/salary-management-summary__amount--expense/);
    expect(salaryCss).toMatch(
      /salary-management-summary__amount--expense[\s\S]*?--mg-v2-color-semantic-info/
    );
  });

  test('uses ErpEmptyState for empty lists (no emoji / no dashed boxes)', () => {
    const erpEmptyCss = read(
      'src/components/erp/common/molecules/ErpEmptyState.css'
    );
    const emptyStateRule = erpEmptyCss.match(
      /\.mg-v2-erp-empty-state\s*\{[^}]*\}/s
    );
    expect(emptyStateRule).not.toBeNull();
    expect(emptyStateRule[0]).not.toMatch(/dashed/i);
    expect(emptyStateRule[0]).toMatch(/border:\s*none/);

    expect(salaryJs).toMatch(/ErpEmptyState/);
    expect(salaryJs).toMatch(/salary-profile-block__empty[\s\S]*ErpEmptyState/);
    expect(salaryJs).toMatch(/salary-calc-block__empty[\s\S]*ErpEmptyState/);
    expect(salaryJs).toMatch(/salary-tax-block__empty[\s\S]*ErpEmptyState/);
    expect(salaryCss).toMatch(
      /\.salary-profile-block__empty\s*\{[^}]*border:\s*none/s
    );
    expect(salaryCss).toMatch(
      /\.salary-calc-block__empty\s*\{[^}]*border:\s*none/s
    );
    expect(salaryCss).toMatch(
      /\.salary-management\s+\.mg-v2-erp-empty-state\s*\{[^}]*border:\s*none/s
    );
  });

  test('section titles use h2 token (page title stays QuietHeader once)', () => {
    expect(quietHeaderJs).toMatch(/SM_PAGE_TITLE/);
    expect(salaryCss).toMatch(
      /\.salary-management__section-title\s*\{[^}]*--mg-v2-font-size-h2/s
    );
    expect(salaryCss).toMatch(
      /\.salary-profile-block__title\s*\{[^}]*--mg-v2-font-size-h2/s
    );
    expect(salaryCss).toMatch(
      /\.salary-calc-block__title\s*\{[^}]*--mg-v2-font-size-h2/s
    );
    expect(salaryCss).toMatch(
      /\.salary-tax-block__title\s*\{[^}]*--mg-v2-font-size-h2/s
    );
  });

  test('uses TabChipRow (not SegmentedTabs emerald) for salary tabs', () => {
    expect(salaryJs).toMatch(/import TabChipRow from ['"]\.\.\/common\/TabChipRow['"]/);
    expect(salaryJs).toMatch(/<TabChipRow[\s\S]*activeKey=\{activeTab\}/);
    expect(salaryJs).not.toMatch(/SegmentedTabs/);
  });

  test('section titles have no left accent bars', () => {
    expect(salaryJs).not.toMatch(/salary-filter-block__accent/);
    expect(salaryJs).not.toMatch(/salary-profile-block__accent/);
    expect(salaryJs).not.toMatch(/salary-tax-block__accent/);
    expect(salaryCss).not.toMatch(/salary-filter-block__accent\s*\{/);
    expect(salaryCss).not.toMatch(/salary-tax-block__accent\s*\{/);
    expect(salaryCss).toMatch(/border-left:\s*none\s*!important/);
  });

  test('header actions row locks equal height (단차 방지)', () => {
    expect(quietHeaderJs).toMatch(/salary-management__header-actions/);
    expect(salaryCss).toMatch(
      /\.salary-management__header-actions\s*\{[^}]*align-items:\s*stretch/s
    );
    expect(salaryCss).toMatch(
      /\.salary-management__header-actions[\s\S]*?height:\s*var\(--button-height-sm\)\s*!important/
    );
  });

  test('ordinary CTAs are not full-bleed banners', () => {
    expect(salaryCss).toMatch(
      /\.salary-filter-block__run-calc\s+\.mg-v2-button[\s\S]*?width:\s*auto\s*!important/
    );
    expect(salaryCss).toMatch(
      /\.salary-calc-block__actions\s+\.mg-v2-button[\s\S]*?width:\s*auto\s*!important/
    );
    expect(salaryCss).toMatch(/salary-tax-block__header-actions/);
    expect(salaryCss).not.toMatch(
      /@media\s*\(max-width:\s*767px\)[\s\S]*\.salary-calc-block__actions\s*\{[^}]*flex-direction:\s*column/s
    );
  });

  test('PrintComponent uses MGButton sm SSOT without off-token print-button skin', () => {
    expect(printJs).toMatch(/size="small"/);
    expect(printJs).toMatch(/size:\s*'sm'/);
    expect(printJs).not.toMatch(/className:\s*'print-button'/);
    expect(printCss).not.toMatch(/\.print-button[\s\S]*background-color:\s*var\(--ios-blue\)/);
    expect(printCss).toMatch(/\.print-component-trigger\s*\{[^}]*display:\s*contents/s);
  });

  test('profiles toolbar uses TabChipRow (not oversized B0KlA pills)', () => {
    expect(salaryJs).toMatch(/PROFILE_VIEW_MODE_ITEMS/);
    expect(salaryJs).toMatch(/salary-profile-block__toolbar/);
    expect(salaryJs).not.toMatch(/ViewModeToggle/);
    expect(salaryJs).not.toMatch(/MappingListBlock\.css/);
  });

  test('inline 기산일 설정 uses period-btn not period-link icon override', () => {
    expect(salaryJs).toMatch(/salary-filter-block__period-btn/);
    expect(salaryJs).not.toMatch(/salary-filter-block__period-link/);
    expect(salaryCss).toMatch(/salary-filter-block__period-btn/);
    expect(salaryCss).not.toMatch(/\.salary-filter-block__period-link\s*\{/);
  });

  test('inline 기산일 설정 uses 8px radius not 6px md token', () => {
    expect(salaryCss).toMatch(
      /\.salary-filter-block__period-btn[\s\S]*?border-radius:\s*8px\s*!important/
    );
  });

  test('history action row locks equal height for secondary/primary/outline/print', () => {
    expect(salaryCss).toMatch(
      /\.mg-v2-card-actions\.salary-calc-block__actions\s*\{[^}]*align-items:\s*stretch\s*!important/s
    );
    expect(salaryCss).toMatch(
      /salary-calc-block__actions[\s\S]*?height:\s*var\(--button-height-sm\)\s*!important/
    );
    expect(salaryCss).toMatch(
      /print-component-trigger\s+\.mg-button[\s\S]*?height:\s*var\(--button-height-sm\)\s*!important/
    );
  });

  test('salary status badge uses SALARY_STATUS_LABELS Korean map not getStatusLabel enum fallback', () => {
    expect(salaryJs).toMatch(/SALARY_STATUS_LABELS/);
    expect(salaryJs).toMatch(/toSalaryStatusDisplayLabel/);
    expect(salaryJs).not.toMatch(/getStatusLabel\(/);
    expect(salaryJs).toMatch(/salary-calc-block__status-badge/);
  });

  test('tax empty copy has real quotes not literal &quot;', () => {
    expect(erpKo).toMatch(/"t_2b4bcb92":\s*"[^"]*\\"세금 통계 조회\\"/);
    expect(erpKo).not.toMatch(/t_2b4bcb92":\s*"[^"]*&quot;/);
  });

  test('salary profile grade shows Korean label via CONSULTANT_GRADE_TO_LABEL', () => {
    expect(consultantCardJs).toMatch(/CONSULTANT_GRADE_TO_LABEL/);
    expect(consultantCardJs).toMatch(/toConsultantGradeDisplayLabel/);
    expect(salaryJs).toMatch(/toSalaryGradeDisplayLabel/);
  });

  test('history cards use Clinic-OS KPI quiet strip (not dense mini-tiles)', () => {
    expect(salaryJs).toMatch(/salary-calc-block__card-kpi-grid/);
    expect(salaryJs).toMatch(/salary-calc-block__card-kpi-signed/);
    expect(salaryJs).toMatch(/data-sign=/);
    expect(salaryJs).toMatch(/renderKpiCurrency/);
    expect(salaryJs).not.toMatch(/\+\{formatCurrency\(/);
    const historyKpiChunk = salaryJs.match(
      /salary-calc-block__card-kpi-grid[\s\S]*?salary-calc-block__card-meta/
    );
    expect(historyKpiChunk).not.toBeNull();
    expect(historyKpiChunk[0]).not.toMatch(/\+\{formatCurrency\(/);
    expect(historyKpiChunk[0]).not.toMatch(/-\{formatCurrency\(/);
    expect(historyKpiChunk[0]).toMatch(/renderKpiCurrency\([^)]+,\s*['"]\+['"]\)/);
    expect(historyKpiChunk[0]).toMatch(/renderKpiCurrency\([^)]+,\s*['"]-['"]\)/);
    expect(salaryCss).toMatch(/\.salary-calc-block__card-kpi-grid\s*\{/);
    expect(salaryCss).toMatch(/\.salary-calc-block__card-kpi\s*\{/);
    expect(salaryCss).toMatch(
      /salary-calc-block__card-kpi-grid[\s\S]*?minmax\(min\(100%,\s*10rem\),\s*1fr\)/s
    );
    expect(salaryCss).not.toMatch(
      /salary-calc-block__card-kpi-grid[\s\S]*?minmax\(120px/s
    );
    expect(salaryCss).toMatch(/font-variant-numeric:\s*tabular-nums/);
    expect(salaryCss).toMatch(
      /\.salary-calc-block__card-kpi-amount[\s\S]*?white-space:\s*nowrap/s
    );
    expect(salaryCss).toMatch(
      /\.salary-calc-block__card-kpi-grid\s*\{[^}]*neutral-50/s
    );
  });
});

describe('AdminNotificationsPage.css does not leak section-title accent globally', () => {
  const notificationsCss = read('src/components/admin/AdminNotificationsPage.css');

  test('section-title accent is not global; page titles stay quiet (border-left none)', () => {
    // Historical leak: unscoped `.mg-v2-ad-b0kla__section-title { border-left: 4px }`
    // Notifications page is now Clinic-OS ALIGNED — assert no global B0KlA title rule
    // and page-local titles keep border-left none (salary accent-kill still needed).
    expect(notificationsCss).not.toMatch(
      /(?:^|\n)\.mg-v2-ad-b0kla__section-title\s*\{/
    );
    expect(notificationsCss).toMatch(
      /\.mg-v2-admin-notifications-page\s+\.admin-notifications-section-title\s*\{[^}]*border-left:\s*none/s
    );
  });
});
