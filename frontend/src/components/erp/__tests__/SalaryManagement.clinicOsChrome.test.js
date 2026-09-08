/**
 * SalaryManagement Clinic-OS chrome alignment — TO-BE locks
 * SSOT: docs/design-system/SALARY_MANAGEMENT_CLINIC_OS_HANDOFF.md §10
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
  const calculationTableJs = read('src/components/erp/salary/SalaryCalculationTable.js');
  const stringsJs = read('src/constants/salaryManagementClinicOsStrings.js');
  const salaryConstantsJs = read('src/constants/salaryConstants.js');
  const menuItemsJs = read('src/components/dashboard-v2/constants/menuItems.js');
  const printJs = read('src/components/common/PrintComponent.js');
  const printCss = read('src/components/common/PrintComponent.css');
  const erpKo = read('src/locales/ko/erp.json');
  const consultantCardJs = read('src/components/ui/Card/ConsultantCard.js');
  const consultantProfileJs = read('src/components/erp/ConsultantProfileModal.js');

  test('uses SalaryQuietHeader (not ContentHeader) + SalarySummaryStrip + MoneyTodoList', () => {
    expect(salaryJs).toMatch(/import SalaryQuietHeader from ['"]\.\/salary\/SalaryQuietHeader['"]/);
    expect(salaryJs).toMatch(/import SalarySummaryStrip from ['"]\.\/salary\/SalarySummaryStrip['"]/);
    expect(salaryJs).toMatch(/import MoneyTodoList from ['"]\.\/organisms\/moneyCockpit\/MoneyTodoList['"]/);
    expect(salaryJs).toMatch(/import useMoneyTodoStrip from ['"]\.\/hooks\/useMoneyTodoStrip['"]/);
    expect(salaryJs).toMatch(/<SalaryQuietHeader[\s\S]*onOpenConfig=/);
    expect(salaryJs).toMatch(/<SalarySummaryStrip/);
    expect(salaryJs).toMatch(/<MoneyTodoList/);
    expect(salaryJs).toMatch(/title=\{SM_TODO_TITLE\}/);
    expect(salaryJs).not.toMatch(/ContentHeader/);
    expect(quietHeaderJs).toMatch(/salary-management-header__title/);
    expect(summaryStripJs).toMatch(/salary-management-summary/);
  });

  test('page title and aria are 상담사 지급 (no English subtitle)', () => {
    expect(stringsJs).toMatch(/export const SM_PAGE_TITLE = '상담사 지급'/);
    expect(stringsJs).toMatch(/export const SM_MAIN_ARIA_LABEL = '상담사 지급 콘텐츠'/);
    expect(stringsJs).not.toMatch(/급여 관리/);
    expect(stringsJs).not.toMatch(/급여·세금 관리/);
    expect(quietHeaderJs).toMatch(/aria-label=\{SM_PAGE_TITLE\}/);
    expect(menuItemsJs).toMatch(/to: '\/erp\/salary'[\s\S]*?label: '상담사 지급'/);
    expect(salaryJs).not.toMatch(/매칭/);
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

  test('summary strip: 지급 예정 owed red · 공제 · 승인대기 (no expense blue)', () => {
    expect(summaryStripJs).toMatch(/SM_SUMMARY\.OWED_LABEL/);
    expect(summaryStripJs).toMatch(/SM_SUMMARY\.DEDUCTION_LABEL/);
    expect(summaryStripJs).toMatch(/SM_SUMMARY\.PENDING_APPROVAL_LABEL/);
    expect(summaryStripJs).toMatch(/salary-management-summary__amount--owed/);
    expect(summaryStripJs).not.toMatch(/salary-management-summary__amount--expense/);
    expect(summaryStripJs).not.toMatch(/profileCount|payoutTotal/);
    expect(stringsJs).toMatch(/OWED_LABEL:\s*'지급 예정'/);
    expect(stringsJs).toMatch(/DEDUCTION_LABEL:\s*'공제'/);
    expect(stringsJs).toMatch(/PENDING_APPROVAL_LABEL:\s*'승인대기'/);
    expect(salaryCss).toMatch(
      /salary-management-summary__amount--owed[\s\S]*?--color-red-700/
    );
    expect(salaryCss).not.toMatch(/salary-management-summary__amount--expense/);
    const owedRule = salaryCss.match(
      /\.salary-management-summary__(?:cell--owed|amount--owed)[^{]*\{[^}]*\}/g
    );
    expect(owedRule).not.toBeNull();
    owedRule.forEach((rule) => {
      expect(rule).not.toMatch(/semantic-info/);
      expect(rule).toMatch(/--color-red-700|color-mix/);
    });
  });

  test('primary stage is SalaryCalculationTable list (not equal TabChipRow IA)', () => {
    expect(salaryJs).toMatch(/import SalaryCalculationTable from ['"]\.\/salary\/SalaryCalculationTable['"]/);
    expect(salaryJs).toMatch(/<SalaryCalculationTable/);
    expect(calculationTableJs).toMatch(/ListTableView/);
    expect(calculationTableJs).toMatch(/EntityRowActions/);
    expect(calculationTableJs).toMatch(/SALARY_ACTION_LABELS\.APPROVE/);
    expect(calculationTableJs).toMatch(/SALARY_ACTION_LABELS\.PAY/);
    expect(salaryJs).toMatch(/isCalcStageOpen/);
    expect(salaryJs).toMatch(/SM_TOOLBAR\.CALC_CTA/);
    // Equal 3-tab primary IA removed
    expect(salaryJs).not.toMatch(/salary-management__tabs-wrap/);
    expect(salaryJs).not.toMatch(/activeKey=\{activeTab\}[\s\S]*TAB_PROFILES[\s\S]*TAB_CALC[\s\S]*TAB_TAX/);
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

  test('STAFF fail-closed: App route keeps ADMIN-only ProtectedRoute', () => {
    const appJs = read('src/App.js');
    expect(appJs).toMatch(/path="\/erp\/salary"[\s\S]*?requiredRoles=\{\[USER_ROLES\.ADMIN\]\}/);
  });
});

describe('AdminNotificationsPage.css does not leak section-title accent globally', () => {
  const notificationsCss = read('src/components/admin/AdminNotificationsPage.css');

  test('section-title accent is not global; page titles stay quiet (border-left none)', () => {
    expect(notificationsCss).not.toMatch(
      /(?:^|\n)\.mg-v2-ad-b0kla__section-title\s*\{/
    );
    expect(notificationsCss).toMatch(
      /\.mg-v2-admin-notifications-page\s+\.admin-notifications-section-title\s*\{[^}]*border-left:\s*none/s
    );
  });
});
