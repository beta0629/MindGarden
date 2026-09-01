/**
 * SalaryManagement Clinic-OS chrome alignment — cascade / copy / structure locks
 * Symptoms from live .dev /erp/salary (2026-09-01): accent bars, emerald tabs,
 * full-bleed CTAs, print off-token, profile toolbar 단차, &quot;, raw grade enums.
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
  const printJs = read('src/components/common/PrintComponent.js');
  const printCss = read('src/components/common/PrintComponent.css');
  const erpKo = read('src/locales/ko/erp.json');
  const consultantCardJs = read('src/components/ui/Card/ConsultantCard.js');

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
  });

  test('header actions row locks equal height (단차 방지)', () => {
    expect(salaryJs).toMatch(/salary-management__header-actions/);
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

  test('tax empty copy has real quotes not literal &quot;', () => {
    expect(erpKo).toMatch(/"t_2b4bcb92":\s*"[^"]*\\"세금 통계 조회\\"/);
    expect(erpKo).not.toMatch(/t_2b4bcb92":\s*"[^"]*&quot;/);
  });

  test('salary profile grade shows Korean label via CONSULTANT_GRADE_TO_LABEL', () => {
    expect(consultantCardJs).toMatch(/CONSULTANT_GRADE_TO_LABEL/);
    expect(consultantCardJs).toMatch(/toConsultantGradeDisplayLabel/);
    expect(salaryJs).toMatch(/toSalaryGradeDisplayLabel/);
  });

  test('history cards use Clinic-OS KPI chrome not bare ERP label/value list only', () => {
    expect(salaryJs).toMatch(/salary-calc-block__card-kpi-grid/);
    expect(salaryCss).toMatch(/\.salary-calc-block__card-kpi-grid\s*\{/);
    expect(salaryCss).toMatch(/\.salary-calc-block__card-kpi\s*\{/);
  });
});
