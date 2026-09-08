/**
 * RefundManagement Clinic-OS chrome alignment — TO-BE locks
 * SSOT: docs/design-system/REFUND_MANAGEMENT_CLINIC_OS_HANDOFF.md §10
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const read = (rel) => fs.readFileSync(path.join(FRONTEND_ROOT, rel), 'utf8');

describe('RefundManagement Clinic-OS chrome', () => {
  const refundJs = read('src/components/erp/RefundManagement.js');
  const refundCss = read('src/components/erp/refund-management/RefundManagement.css');
  const quietHeaderJs = read('src/components/erp/refund-management/RefundQuietHeader.js');
  const summaryStripJs = read('src/components/erp/refund-management/RefundSummaryStrip.js');
  const actionRailJs = read('src/components/erp/refund-management/RefundActionRail.js');
  const historyTableJs = read('src/components/erp/refund-management/RefundHistoryTableBlock.js');
  const filterJs = read('src/components/erp/refund-management/RefundFilterBlock.js');
  const stringsJs = read('src/constants/refundManagementClinicOsStrings.js');
  const hubJs = read('src/components/erp/financial/FinancialRefundHubLayout.js');
  const indexJs = read('src/components/erp/refund-management/index.js');
  const erpKo = read('src/locales/ko/erp.json');
  const menuItemsJs = read('src/components/dashboard-v2/constants/menuItems.js');

  test('uses QuietHeader + SummaryStrip + ActionRail + __stage (not ContentHeader)', () => {
    expect(refundJs).toMatch(/import[\s\S]*RefundQuietHeader[\s\S]*from ['"]\.\/refund-management['"]/);
    expect(refundJs).toMatch(/<RefundQuietHeader/);
    expect(refundJs).toMatch(/<RefundSummaryStrip/);
    expect(refundJs).toMatch(/<RefundActionRail/);
    expect(refundJs).toMatch(/refund-management__stage/);
    expect(refundJs).not.toMatch(/ContentHeader/);
    expect(refundJs).not.toMatch(/RefundKpiBlock/);
    expect(refundJs).not.toMatch(/운영 현황으로 돌아가기/);
    expect(quietHeaderJs).toMatch(/refund-management-header__title/);
    expect(summaryStripJs).toMatch(/refund-management-summary/);
    expect(actionRailJs).toMatch(/refund-management-rail/);
  });

  test('layout order: QuietHeader → summary → rail → chips → stage', () => {
    const quietIdx = refundJs.indexOf('<RefundQuietHeader');
    const summaryIdx = refundJs.indexOf('<RefundSummaryStrip');
    const railIdx = refundJs.indexOf('<RefundActionRail');
    const chipsIdx = refundJs.indexOf('<RefundFilterBlock');
    const stageIdx = refundJs.indexOf('refund-management__stage');
    expect(quietIdx).toBeGreaterThan(-1);
    expect(summaryIdx).toBeGreaterThan(quietIdx);
    expect(railIdx).toBeGreaterThan(summaryIdx);
    expect(chipsIdx).toBeGreaterThan(railIdx);
    expect(stageIdx).toBeGreaterThan(chipsIdx);
  });

  test('page title and aria are 환불 관리 (no English subtitle / 시스템)', () => {
    expect(stringsJs).toMatch(/export const RM_PAGE_TITLE = '환불 관리'/);
    expect(stringsJs).toMatch(/export const RM_MAIN_ARIA_LABEL = '환불 관리 콘텐츠'/);
    expect(stringsJs).not.toMatch(/환불 관리 시스템/);
    expect(quietHeaderJs).toMatch(/aria-label=\{RM_PAGE_TITLE\}/);
    expect(refundJs).toMatch(/title=\{RM_PAGE_TITLE\}/);
    expect(erpKo).toMatch(/"t_ce897476":\s*"환불 관리"/);
    expect(menuItemsJs).toMatch(/to: '\/erp\/refund-management'[\s\S]*?label: '환불 관리'/);
  });

  test('ALIGNED shell: clinic-os + stage geometry tokens', () => {
    expect(refundJs).toMatch(/refund-management--clinic-os/);
    expect(refundJs).toMatch(/refund-management__stage/);
    expect(refundCss).toMatch(/\.refund-management__stage\s*\{[^}]*min-height:\s*36rem/s);
    expect(refundCss).toMatch(/border:\s*0\.0625rem solid var\(--mg-v2-color-neutral-300\)/);
    expect(refundCss).toMatch(/background:\s*var\(--mg-v2-color-neutral-50\)/);
  });

  test('page JS/CSS has no B0KlA page chrome and no AdminDashboardB0KlA import', () => {
    expect(refundJs).not.toMatch(/mg-v2-ad-b0kla/);
    expect(refundJs).not.toMatch(/AdminDashboardB0KlA\.css/);
    expect(refundCss).not.toMatch(/AdminDashboardB0KlA\.css/);
    expect(refundCss).not.toMatch(/\.mg-v2-ad-b0kla/);
    expect(refundCss).not.toMatch(/--ad-b0kla-/);
    expect(hubJs).not.toMatch(/AdminDashboardB0KlA\.css/);
    expect(hubJs).not.toMatch(/mg-v2-ad-b0kla__pill-toggle/);
  });

  test('summary strip: 환불 건수 / 환불 금액 expense blue / ERP 미반영', () => {
    expect(summaryStripJs).toMatch(/RM_SUMMARY\.COUNT_LABEL/);
    expect(summaryStripJs).toMatch(/RM_SUMMARY\.AMOUNT_LABEL/);
    expect(summaryStripJs).toMatch(/RM_SUMMARY\.PENDING_ERP_LABEL/);
    expect(summaryStripJs).toMatch(/refund-management-summary__amount--expense/);
    expect(stringsJs).toMatch(/COUNT_LABEL:\s*'환불 건수'/);
    expect(stringsJs).toMatch(/AMOUNT_LABEL:\s*'환불 금액'/);
    expect(stringsJs).toMatch(/PENDING_ERP_LABEL:\s*'ERP 미반영'/);
    expect(refundCss).toMatch(
      /refund-management-summary__amount--expense[\s\S]*?--mg-v2-color-money-expense/
    );
    expect(indexJs).not.toMatch(/RefundKpiBlock/);
  });

  test('ActionRail empty contract and blue tone (not MoneyTodoList)', () => {
    expect(actionRailJs).toMatch(/return null/);
    expect(actionRailJs).toMatch(/pendingCount/);
    expect(actionRailJs).not.toMatch(/import MoneyTodoList/);
    expect(refundJs).not.toMatch(/MoneyTodoList/);
    expect(refundCss).toMatch(/refund-management-rail[\s\S]*?--mg-v2-color-money-expense/);
  });

  test('row CTA: unreflected primary ERP 반영 · reflected ghost 열기 · EntityRowActions', () => {
    expect(historyTableJs).toMatch(/isRefundErpReflected/);
    expect(historyTableJs).toMatch(/RM_ROW\.CTA_REFLECT/);
    expect(historyTableJs).toMatch(/RM_ROW\.CTA_OPEN/);
    expect(historyTableJs).toMatch(/refund-management__cta--primary/);
    expect(historyTableJs).toMatch(/refund-management__cta--ghost/);
    expect(historyTableJs).toMatch(/EntityRowActions/);
    expect(historyTableJs).toMatch(/variant="primary"/);
    expect(historyTableJs).toMatch(/variant="ghost"/);
    expect(stringsJs).toMatch(/SENT.*REFLECTED.*SYNCED|erpReference/);
  });

  test('CTA and row menu height lock to 36 (2.25rem row token)', () => {
    expect(refundCss).toMatch(/--mg-v2-component-height-row:\s*2\.25rem/);
    expect(refundCss).toMatch(
      /refund-management__cta[\s\S]*?height:\s*var\(--mg-v2-component-height-row/
    );
    expect(refundCss).toMatch(
      /refund-management__row-menu[\s\S]*?height:\s*var\(--mg-v2-component-height-row/
    );
  });

  test('chips use TabChipRow; collapsibles for reason/ERP/accounting', () => {
    expect(filterJs).toMatch(/TabChipRow/);
    expect(filterJs).not.toMatch(/import[\s\S]*ErpFilterToolbar/);
    expect(refundJs).toMatch(/RefundReasonStatsBlock/);
    expect(refundJs).toMatch(/RefundErpSyncBlock/);
    expect(refundJs).toMatch(/RefundAccountingBlock/);
    const reasonJs = read('src/components/erp/refund-management/RefundReasonStatsBlock.js');
    const erpJs = read('src/components/erp/refund-management/RefundErpSyncBlock.js');
    const accountingJs = read('src/components/erp/refund-management/RefundAccountingBlock.js');
    expect(reasonJs).toMatch(/<details/);
    expect(erpJs).toMatch(/<details/);
    expect(accountingJs).toMatch(/<details/);
    expect(reasonJs).toMatch(/RM_COLLAPSE\.REASON/);
    expect(erpJs).toMatch(/RM_COLLAPSE\.ERP/);
    expect(accountingJs).toMatch(/RM_COLLAPSE\.ACCOUNTING/);
  });

  test('FinancialRefundHubTabs kept with SegmentedTabs (no B0KlA pill)', () => {
    expect(refundJs).toMatch(/FinancialRefundHubTabs/);
    expect(hubJs).toMatch(/SegmentedTabs/);
    expect(hubJs).toMatch(/RM_HUB\.FINANCIAL|일상 거래/);
    expect(hubJs).toMatch(/RM_HUB\.REFUND|환불·정산/);
  });

  test('reflect-erp-refund URL and StandardizedApi endpoints unchanged', () => {
    expect(refundJs).toMatch(/\/api\/v1\/admin\/refund-statistics/);
    expect(refundJs).toMatch(/\/api\/v1\/admin\/refund-history/);
    expect(refundJs).toMatch(/\/api\/v1\/admin\/erp-sync-status/);
    expect(refundJs).toMatch(/reflect-erp-refund/);
    expect(refundJs).toMatch(/StandardizedApi\.get/);
    expect(refundJs).toMatch(/StandardizedApi\.post/);
  });

  test('section titles have no left accent bars', () => {
    expect(refundCss).toMatch(/border-left:\s*none\s*!important/);
    expect(refundCss).not.toMatch(/::before[\s\S]*width:\s*var\(--spacing-xs\)/);
  });

  test('uses ErpEmptyState / UnifiedModal detail (no emoji)', () => {
    expect(historyTableJs).toMatch(/ErpEmptyState/);
    expect(historyTableJs).toMatch(/RM_EMPTY_LIST/);
    expect(refundJs).toMatch(/UnifiedModal/);
    expect(refundJs).toMatch(/onOpenDetail/);
  });

  test('safeDisplay / ErpSafe* boundary retained', () => {
    expect(historyTableJs).toMatch(/ErpSafeText/);
    expect(historyTableJs).toMatch(/ErpSafeNumber/);
    expect(historyTableJs).toMatch(/toSafeNumber|toDisplayString/);
    expect(refundJs).toMatch(/ErpSafeText/);
  });
});
