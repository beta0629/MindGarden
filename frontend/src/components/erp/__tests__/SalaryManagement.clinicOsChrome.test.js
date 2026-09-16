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
  const commonKo = read('src/locales/ko/common.json');
  const consultantCardJs = read('src/components/ui/Card/ConsultantCard.js');
  const consultantProfileJs = read('src/components/erp/ConsultantProfileModal.js');
  const salaryProfileFormModalStringsJs = read('src/constants/salaryProfileFormModalStrings.js');

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

  test('pay CTA uses StandardizedApi POST PAY endpoint', () => {
    expect(salaryConstantsJs).toMatch(/PAY:\s*'\/api\/v1\/admin\/salary\/pay'/);
    expect(salaryJs).toMatch(/handlePaySalary/);
    expect(salaryJs).toMatch(/SALARY_API_ENDPOINTS\.PAY/);
    expect(salaryJs).toMatch(/StandardizedApi\.post\(\s*`\$\{SALARY_API_ENDPOINTS\.PAY\}\/\$\{calculation\.id\}`/);
  });

  test('status badges use TO-BE Korean labels', () => {
    expect(salaryConstantsJs).toMatch(/\[SALARY_STATUS\.CALCULATED\]:\s*'승인대기'/);
    expect(salaryConstantsJs).toMatch(/\[SALARY_STATUS\.APPROVED\]:\s*'지급대기'/);
    expect(salaryConstantsJs).toMatch(/\[SALARY_STATUS\.PAID\]:\s*'지급됨'/);
    expect(salaryJs).toMatch(/SALARY_STATUS_LABELS/);
    expect(salaryJs).toMatch(/toSalaryStatusDisplayLabel/);
    expect(salaryJs).not.toMatch(/getStatusLabel\(/);
  });

  test('CTA and row menu height lock to 36 (2.25rem row token)', () => {
    expect(salaryCss).toMatch(/--mg-v2-component-height-row:\s*2\.25rem/);
    expect(salaryCss).toMatch(
      /salary-management__cta[\s\S]*?height:\s*var\(--mg-v2-component-height-row/
    );
    expect(salaryCss).toMatch(
      /salary-management__row-menu[\s\S]*?height:\s*var\(--mg-v2-component-height-row/
    );
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
    const emptyStateRule = erpEmptyCss.match(
      /\.mg-v2-erp-empty-state\s*\{[^}]*\}/s
    );
    expect(emptyStateRule).not.toBeNull();
    expect(emptyStateRule[0]).not.toMatch(/dashed/i);
    expect(emptyStateRule[0]).toMatch(/border:\s*none/);

    expect(salaryJs).toMatch(/ErpEmptyState/);
    expect(calculationTableJs).toMatch(/ErpEmptyState/);
    expect(salaryJs).toMatch(/salary-tax-block__empty[\s\S]*ErpEmptyState/);
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

  test('PrintComponent uses MGButton sm SSOT without off-token print-button skin', () => {
    expect(printJs).toMatch(/size="small"/);
    expect(printJs).toMatch(/size:\s*'sm'/);
    expect(printJs).not.toMatch(/className:\s*'print-button'/);
    expect(printCss).not.toMatch(/\.print-button[\s\S]*background-color:\s*var\(--ios-blue\)/);
    expect(printCss).toMatch(/\.print-component-trigger\s*\{[^}]*display:\s*contents/s);
  });

  test('profiles toolbar uses TabChipRow for view mode only (not page primary IA)', () => {
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

  test('withholding UI copy separates 국세 3% and 지방세 0.3% (no standalone 3.3% primary label)', () => {
    expect(salaryConstantsJs).toMatch(/withholdingTax:\s*'원천징수 국세\(3%\) · 지방세\(0\.3%\)'/);
    expect(salaryConstantsJs).toMatch(/WITHHOLDING_TAX:\s*'원천징수 국세\(3%\) · 지방세\(0\.3%\)'/);
    expect(salaryConstantsJs).not.toMatch(/합계 3\.3%/);
    expect(consultantProfileJs).not.toMatch(/원천징수 3\.3%/);
    expect(consultantProfileJs).toMatch(/국세 3% · 지방세 0\.3%/);
    expect(erpKo).not.toMatch(/t_c24b2c06":\s*"[^"]*3\.3%/);
    expect(erpKo).not.toMatch(/t_7ff8d90e":\s*"[^"]*3\.3%/);
    expect(erpKo).toMatch(
      /"withholdingDetailHint":\s*"\(입금 총액 대비 사업소득 원천징수 예정: 국세 3%, 지방세 0\.3%\. 부가세와 별개\)"/
    );
    expect(erpKo).not.toMatch(/withholdingDetailHint[^"]*"[^"]*합계 3\.3%/);
    expect(salaryProfileFormModalStringsJs).not.toMatch(/3\.3%/);
    expect(salaryProfileFormModalStringsJs).toMatch(/국세 3% \+ 지방세 0\.3%/);
    expect(commonKo).toMatch(
      /"t_315a1dfd":\s*"원천징수 \(국세 3% \+ 지방세 0\.3%\)"/
    );
    expect(commonKo).not.toMatch(/"t_315a1dfd":\s*"[^"]*3\.3%/);
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

  test('history cards use Clinic-OS KPI 3-col quiet strip (not dense mini-tiles)', () => {
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
      /\.salary-calc-block__card-kpi-grid\s*\{[^}]*repeat\(3,\s*minmax\(0,\s*1fr\)\)/s
    );
    expect(salaryCss).not.toMatch(
      /salary-calc-block__card-kpi-grid[\s\S]*?minmax\(120px/s
    );
    expect(salaryCss).not.toMatch(
      /salary-calc-block__card-kpi-grid[\s\S]*?auto-fit[\s\S]*?10rem/s
    );
    expect(salaryCss).toMatch(
      /\.salary-calc-block__card-kpi:nth-child\(3n\)/
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
