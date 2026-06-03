// @ts-ignore - Playwright 패키지 설치 후 타입 오류 해결됨
import { test, expect } from '@playwright/test';
import { buildSyntheticAdminStorageState } from '../../helpers/syntheticAdminStorageState';

/**
 * ERP 레거시 경로 → 정규 경로 리다이렉트 (ADMIN 컨텍스트).
 *
 * 배경 — STAFF_PERMISSION_POLICY_PHASE2 (PR #99):
 *   `/erp/*` 실페이지·`/admin/erp/financial`·`/admin/erp/reports` 가
 *   `<ProtectedRoute requiredRoles={[USER_ROLES.ADMIN]}>` 안으로 이동.
 *   → 비로그인 deep link 시 목적지에서 `/login` 으로 또 한 번 리다이렉트되어
 *     `toHaveURL` polling 이 중간 URL(`/erp/budget` 등)을 못 잡고 실패.
 *
 *   직전 핫픽스(6b3a4bd82)는 단순 `<Navigate>` 6개를 ProtectedRoute
 *   밖으로 빼되, 보안 의미는 목적지(`/erp/budget`, `/erp/items`,
 *   `/erp/salary`, `/erp/dashboard`, `/erp/purchase-requests`) 의 ADMIN
 *   가드로 유지. 정책 SSOT(STAFF·비로그인 ERP 차단)는 그대로.
 *
 * 본 스펙의 새 의도:
 *   "ADMIN 사용자가 레거시 ERP URL 을 눌렀을 때 새 URL 로 정규화된다"
 *   를 검증한다. 비로그인·STAFF 차단 검증은 정책 SSOT 가드 단위/통합 테스트
 *   (`frontend/src/.../*.test.js`, dashboardUtils 등) 에서 별도로 다룬다.
 *
 * 인증 전략:
 *   `tests/e2e/helpers/syntheticAdminStorageState.ts` 합성 ADMIN storageState 사용.
 *   `e2e-erp-smoke` 워크플로는 백엔드 없이 프론트(`npm start`)만 띄워 리다이렉트만
 *   검증하므로 실제 `/api/v1/auth/login` 호출이 불가능 — 본 spec 한정으로
 *   `localStorage.userInfo` 만 합성 주입해 ProtectedRoute(ADMIN) 통과를 만든다.
 *
 * App.js Navigate 6개:
 *   - /erp/tax              → /erp/salary?tab=tax
 *   - /erp/inventory        → /erp/items
 *   - /erp/budgets          → /erp/budget
 *   - /admin/erp/dashboard  → /erp/dashboard
 *   - /admin/erp/purchase   → /erp/purchase-requests
 *   - /admin/erp/budget     → /erp/budget
 */
test.describe('ERP 레거시 경로 리다이렉트 (ADMIN 컨텍스트)', () => {
  // 본 describe 내 모든 테스트는 합성 ADMIN storageState 로 진입한다.
  // 다른 spec / 다른 project 에 영향 없음.
  test.use({ storageState: buildSyntheticAdminStorageState() });

  test('/erp/budgets → pathname /erp/budget', async ({ page }) => {
    await page.goto('/erp/budgets');
    await expect(page).toHaveURL(/\/erp\/budget(\?|#|$)/);
    const u = new URL(page.url());
    expect(u.pathname).toBe('/erp/budget');
  });

  test('/erp/inventory → pathname /erp/items', async ({ page }) => {
    await page.goto('/erp/inventory');
    await expect(page).toHaveURL(/\/erp\/items(\?|#|$)/);
    const u = new URL(page.url());
    expect(u.pathname).toBe('/erp/items');
  });

  test('/erp/tax → /erp/salary 및 tab=tax', async ({ page }) => {
    await page.goto('/erp/tax');
    await expect(page).toHaveURL(/\/erp\/salary/);
    const u = new URL(page.url());
    expect(u.pathname).toBe('/erp/salary');
    expect(u.searchParams.get('tab')).toBe('tax');
  });

  test('/admin/erp/dashboard → pathname /erp/dashboard', async ({ page }) => {
    await page.goto('/admin/erp/dashboard');
    await expect(page).toHaveURL(/\/erp\/dashboard(\?|#|$)/);
    const u = new URL(page.url());
    expect(u.pathname).toBe('/erp/dashboard');
  });

  test('/admin/erp/purchase → pathname /erp/purchase-requests', async ({ page }) => {
    await page.goto('/admin/erp/purchase');
    await expect(page).toHaveURL(/\/erp\/purchase-requests(\?|#|$)/);
    const u = new URL(page.url());
    expect(u.pathname).toBe('/erp/purchase-requests');
  });

  test('/admin/erp/budget → pathname /erp/budget', async ({ page }) => {
    await page.goto('/admin/erp/budget');
    await expect(page).toHaveURL(/\/erp\/budget(\?|#|$)/);
    const u = new URL(page.url());
    expect(u.pathname).toBe('/erp/budget');
  });
});
