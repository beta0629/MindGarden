/**
 * QuickExpenseForm Clinic-OS chrome alignment — Critic PASS locks
 * SSOT: docs/design-system/QUICK_EXPENSE_CLINIC_OS_CRITIC_PASS.md
 * Twin: OpsApprovalCenter.clinicOsChrome / ConsultationLogView.clinicOsChrome
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const read = (rel) => fs.readFileSync(path.join(FRONTEND_ROOT, rel), 'utf8');

describe('QuickExpenseForm Clinic-OS chrome', () => {
  const formJs = read('src/components/erp/QuickExpenseForm.js');
  const formCss = read('src/components/erp/QuickExpenseForm.css');
  const stringsJs = read('src/constants/quickExpenseFormStrings.js');

  test('UnifiedModal uses clinic-os not B0KlA', () => {
    expect(formJs).toMatch(/className=["']mg-v2-clinic-os["']/);
    expect(formJs).not.toMatch(/mg-v2-ad-b0kla/);
    expect(formCss).not.toMatch(/mg-v2-ad-b0kla/);
    expect(formCss).not.toMatch(/--ad-b0kla/);
  });

  test('title and subtitle are Critic Korean copy', () => {
    expect(stringsJs).toMatch(/QEF_MODAL_TITLE\s*=\s*['"]나간 돈 기록['"]/);
    expect(stringsJs).toMatch(/QEF_MODAL_SUBTITLE\s*=\s*['"]공통코드 카테고리만['"]/);
    expect(formJs).toMatch(/title=\{QEF_MODAL_TITLE\}/);
    expect(formJs).toMatch(/subtitle=\{QEF_MODAL_SUBTITLE\}/);
    expect(formJs).toMatch(/나간 돈 기록|QEF_MODAL_TITLE/);
    expect(formJs).toMatch(/공통코드 카테고리만|QEF_MODAL_SUBTITLE/);
  });

  test('amount input uses money-expense token (no raw #1D4ED8)', () => {
    expect(formCss).toMatch(/--mg-v2-color-money-expense/);
    expect(formCss).not.toMatch(/#1D4ED8/i);
    expect(formCss).not.toMatch(/--mg-v2-color-semantic-info/);
    expect(formCss).toMatch(
      /\.quick-expense-amount-input[\s\S]*?color:\s*var\(--mg-v2-color-money-expense\)/
    );
    expect(formCss).toMatch(
      /\.quick-expense-amount-input:focus[\s\S]*?border-color:\s*var\(--mg-v2-color-money-expense\)/
    );
  });

  test('register CTA height locks to --mg-spacing-36', () => {
    expect(formCss).toMatch(/height:\s*var\(--mg-spacing-36\)/);
    expect(formJs).toMatch(/quick-expense-submit-btn/);
    expect(formCss).toMatch(/--mg-v2-color-primary-solid/);
  });

  test('paper uses neutral-50 / neutral-300', () => {
    expect(formCss).toMatch(/--mg-v2-color-neutral-50/);
    expect(formCss).toMatch(/--mg-v2-color-neutral-300/);
  });

  test('no MANAGEMENT_FEE magic category in QuickExpenseForm.js', () => {
    expect(formJs).not.toMatch(/MANAGEMENT_FEE/);
  });

  test('paymentMethod is not in submit params', () => {
    expect(formJs).not.toMatch(/paymentMethod/);
    expect(formJs).toMatch(/transactionDate:\s*formatLocalDateYmd\(new Date\(\)\)/);
  });

  test('chips load from common-codes financial API only', () => {
    expect(formJs).toMatch(/\/api\/v1\/erp\/common-codes\/financial/);
    expect(formJs).toMatch(/getQuickExpenses/);
    expect(formJs).toMatch(/expenseSubcategories/);
    expect(formJs).toMatch(/expenseCategories/);
  });

  test('keeps shared atoms: UnifiedModal / MGButton / ErpSafeText / SafeErrorDisplay / UnifiedLoading', () => {
    expect(formJs).toMatch(/UnifiedModal/);
    expect(formJs).toMatch(/MGButton/);
    expect(formJs).toMatch(/ErpSafeText/);
    expect(formJs).toMatch(/SafeErrorDisplay/);
    expect(formJs).toMatch(/UnifiedLoading/);
  });

  test('SALARY VAT hint branch remains (via constant)', () => {
    expect(stringsJs).toMatch(/QEF_VAT_EXEMPT_CATEGORY_CODE\s*=\s*['"]SALARY['"]/);
    expect(formJs).toMatch(/QEF_VAT_EXEMPT_CATEGORY_CODE/);
    expect(formJs).toMatch(/QEF_AMOUNT\.HINT_VAT/);
    expect(formJs).toMatch(/QEF_AMOUNT\.HINT_SALARY/);
  });

  test('OUT surfaces are not imported or restyled here', () => {
    expect(formJs).not.toMatch(/MoneyRecordModal/);
    expect(formJs).not.toMatch(/FinancialTransactionForm/);
    expect(formJs).not.toMatch(/IntegratedFinanceDashboard/);
    expect(formCss).not.toMatch(/design-v2-tokens\.css/);
    expect(formCss).not.toMatch(/@import\s+['"]\.\/FinancialTransactionForm\.css['"]/);
  });
});
