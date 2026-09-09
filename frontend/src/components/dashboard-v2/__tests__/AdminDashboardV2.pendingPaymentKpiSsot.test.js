/**
 * AdminDashboardV2 결제 대기 KPI — sidebar PENDING_PAYMENT SSOT 소스 락
 *
 * @author CoreSolution
 * @since 2026-09-09
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const read = (rel) => fs.readFileSync(path.join(FRONTEND_ROOT, rel), 'utf8');

describe('AdminDashboardV2 pending-payment KPI SSOT', () => {
  const dashboardJs = read('src/components/dashboard-v2/AdminDashboardV2.js');

  test('KPI load uses PENDING_PAYMENT endpoint only (not pending-deposit merge)', () => {
    expect(dashboardJs).toMatch(/loadPendingPaymentStats/);
    expect(dashboardJs).toMatch(
      /API_ENDPOINTS\.ADMIN\.MAPPINGS\.PENDING_PAYMENT/
    );
    expect(dashboardJs).toMatch(/aggregatePendingPaymentStats/);
    expect(dashboardJs).toMatch(/PENDING_PAYMENT_KPI_LABEL/);
    // KPI 경로에서 pending-deposit + session-extension 병합 금지
    const loadFnMatch = dashboardJs.match(
      /const loadPendingPaymentStats = useCallback\(async\(\) => \{[\s\S]*?\}, \[t\]\);/
    );
    expect(loadFnMatch).not.toBeNull();
    expect(loadFnMatch[0]).not.toMatch(/PENDING_DEPOSIT/);
    expect(loadFnMatch[0]).not.toMatch(/SESSION_EXTENSIONS/);
    expect(loadFnMatch[0]).not.toMatch(/buildDepositPendingQueue/);
  });

  test('KPI label/CTA align with 결제 대기 · 통합 스케줄', () => {
    expect(dashboardJs).toMatch(/label=\{PENDING_PAYMENT_KPI_LABEL\}/);
    expect(dashboardJs).not.toMatch(/label="미결제"/);
    expect(dashboardJs).toMatch(/ctaLabel="통합 스케줄"/);
    expect(dashboardJs).toMatch(
      /navigate\(ADMIN_ROUTES\.INTEGRATED_SCHEDULE\)/
    );
  });

  test('입금 확인 대기 위젯은 별도 loadPendingDepositQueue 유지', () => {
    expect(dashboardJs).toMatch(/loadPendingDepositQueue/);
    expect(dashboardJs).toMatch(/buildDepositPendingQueue/);
    expect(dashboardJs).toMatch(/MAPPINGS\.PENDING_DEPOSIT/);
  });
});
