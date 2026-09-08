/**
 * OpsApprovalCenter Clinic-OS chrome alignment — structure / token / PG out-of-scope locks
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const read = (rel) => fs.readFileSync(path.join(FRONTEND_ROOT, rel), 'utf8');

describe('OpsApprovalCenter Clinic-OS chrome', () => {
  const hubJs = read('src/components/erp/approval/ErpApprovalHub.jsx');
  const centerJs = read('src/components/erp/approval/OpsApprovalCenter.js');
  const centerCss = read('src/components/erp/approval/OpsApprovalCenter.css');
  const quietHeaderJs = read('src/components/erp/approval/OpsApprovalQuietHeader.js');
  const summaryStripJs = read('src/components/erp/approval/OpsApprovalSummaryStrip.js');
  const adapterJs = read('src/components/erp/approval/opsApprovalInboxAdapter.js');
  const stringsJs = read('src/constants/opsApprovalCenterStrings.js');
  const appJs = read('src/App.js');

  test('uses OpsApprovalQuietHeader (not ContentHeader) + OpsApprovalSummaryStrip', () => {
    expect(centerJs).toMatch(/import OpsApprovalQuietHeader from ['"]\.\/OpsApprovalQuietHeader['"]/);
    expect(centerJs).toMatch(/import OpsApprovalSummaryStrip from ['"]\.\/OpsApprovalSummaryStrip['"]/);
    expect(centerJs).toMatch(/<OpsApprovalQuietHeader/);
    expect(centerJs).toMatch(/<OpsApprovalSummaryStrip/);
    expect(centerJs).not.toMatch(/ContentHeader/);
    expect(quietHeaderJs).toMatch(/ops-approval-header__title/);
    expect(summaryStripJs).toMatch(/ops-approval-summary/);
  });

  test('hub routes to OpsApprovalCenter under AdminCommonLayout', () => {
    expect(hubJs).toMatch(/OpsApprovalCenter/);
    expect(hubJs).toMatch(/AdminCommonLayout/);
    expect(hubJs).not.toMatch(/AdminApprovalDashboard/);
    expect(hubJs).not.toMatch(/SuperAdminApprovalDashboard/);
  });

  test('ALIGNED shell: clinic-os + stage geometry tokens', () => {
    expect(centerJs).toMatch(/ops-approval--clinic-os/);
    expect(centerJs).toMatch(/ops-approval__stage/);
    expect(centerCss).toMatch(/\.ops-approval__stage\s*\{[^}]*min-height:\s*36rem/s);
    expect(centerCss).toMatch(/border:\s*0\.0625rem solid var\(--mg-v2-color-neutral-300\)/);
    expect(centerCss).toMatch(/background:\s*var\(--mg-v2-color-neutral-50\)/);
  });

  test('summary strip labels are 대기 / 오늘 / 반려', () => {
    expect(stringsJs).toMatch(/PENDING_LABEL:\s*'대기'/);
    expect(stringsJs).toMatch(/TODAY_LABEL:\s*'오늘'/);
    expect(stringsJs).toMatch(/REJECTED_LABEL:\s*'반려'/);
    expect(summaryStripJs).toMatch(/OAC_SUMMARY\.PENDING_LABEL/);
    expect(summaryStripJs).toMatch(/OAC_SUMMARY\.TODAY_LABEL/);
    expect(summaryStripJs).toMatch(/OAC_SUMMARY\.REJECTED_LABEL/);
  });

  test('page JS has no B0KlA page chrome and no AdminDashboardB0KlA import', () => {
    expect(centerJs).not.toMatch(/mg-v2-ad-b0kla/);
    expect(centerJs).not.toMatch(/AdminDashboardB0KlA\.css/);
    expect(centerCss).not.toMatch(/AdminDashboardB0KlA\.css/);
    expect(centerCss).not.toMatch(/\.mg-v2-ad-b0kla/);
    expect(hubJs).not.toMatch(/AdminDashboardB0KlA/);
  });

  test('action buttons lock height to --mg-spacing-36 (36px)', () => {
    expect(centerCss).toMatch(
      /\.ops-approval__action-btn[\s\S]*?height:\s*var\(--mg-spacing-36\)/s
    );
    expect(centerJs).toMatch(/ops-approval__action-btn/);
  });

  test('inflow / net-to-pay amounts use --color-red-700 (#B91C1C token)', () => {
    expect(centerCss).toMatch(
      /ops-approval-table__amount--inflow[\s\S]*?--color-red-700/
    );
    expect(adapterJs).toMatch(/amountTone:\s*'inflow'/);
  });

  test('expense purchase amounts use semantic-info', () => {
    expect(centerCss).toMatch(
      /ops-approval-table__amount--expense[\s\S]*?--mg-v2-color-semantic-info/
    );
  });

  test('no left accent bars', () => {
    expect(centerCss).toMatch(/border-left:\s*none\s*!important/);
  });

  test('Korean page title is 승인 센터', () => {
    expect(stringsJs).toMatch(/OAC_PAGE_TITLE = '승인 센터'/);
    expect(quietHeaderJs).toMatch(/OAC_PAGE_TITLE/);
  });

  test('uses ErpEmptyState for empty lists', () => {
    expect(centerJs).toMatch(/ErpEmptyState/);
    expect(centerJs).toMatch(/OAC_EMPTY\.TITLE/);
  });

  test('cross-type adapter reuses salary/purchase APIs (no money calc SSOT)', () => {
    expect(adapterJs).toMatch(/PURCHASE_REQUESTS_PENDING_ADMIN/);
    expect(adapterJs).toMatch(/SALARY_API_ENDPOINTS\.APPROVE/);
    expect(adapterJs).toMatch(/SALARY_API_ENDPOINTS\.CALCULATIONS/);
    expect(adapterJs).not.toMatch(/netAmount\s*\*|grossAmount\s*\*/);
  });

  test('PG approval files/routes are out of scope (untouched imports)', () => {
    expect(centerJs).not.toMatch(/PgApproval/);
    expect(centerJs).not.toMatch(/pg-approval/);
    expect(hubJs).not.toMatch(/PgApproval/);
    expect(adapterJs).not.toMatch(/pg-approval/);
    expect(appJs).toMatch(/path="\/erp\/approvals"/);
  });

  test('/erp/approvals remains ADMIN ProtectedRoute', () => {
    expect(appJs).toMatch(
      /path="\/erp\/approvals"[\s\S]*?requiredRoles=\{\[USER_ROLES\.ADMIN\]\}/
    );
  });

  test('LNB copy on this surface prefers 배정 not 매칭 in adapter/strings', () => {
    expect(stringsJs).not.toMatch(/매칭/);
    expect(centerJs).not.toMatch(/매칭/);
    expect(adapterJs).not.toMatch(/매칭/);
  });
});
