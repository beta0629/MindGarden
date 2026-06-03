// @ts-ignore - Playwright 패키지 설치 후 타입 오류 해결됨
import { test, expect, Page } from '@playwright/test';
import { loginErpUser } from '../../helpers/erpAuth';
import { buildSyntheticAdminStorageState } from '../../helpers/syntheticAdminStorageState';

/**
 * ERP 승인 허브 — 레거시 경로 리다이렉트 및 admin 모드 본문 노출
 * `/erp/super-approvals` → `/erp/approvals?mode=super` (App.js Navigate, ProtectedRoute(ADMIN) 안)
 *
 * 본 파일은 두 시나리오를 다른 인증 컨텍스트에서 검증한다:
 *
 *  1) `super-approvals 진입 시 approvals로 리다이렉트되고 mode=super`
 *     - `e2e-erp-smoke` 워크플로(백엔드 미동반) 에서 실행됨.
 *     - STAFF_PERMISSION_POLICY_PHASE2 로 `/erp/super-approvals` 가
 *       `<ProtectedRoute requiredRoles={[USER_ROLES.ADMIN]}>` 안의 `<Navigate>`
 *       라, 비로그인 시 ProtectedRoute 가 `/login` 으로 우회한다.
 *     - 본 spec 의 의도(레거시 URL → 정규 URL 정규화) 만 보존하기 위해
 *       합성 ADMIN storageState 를 적용 (라우팅 정규화 검증 한정).
 *     - App.js / 정책 SSOT 변경 없음 — 핫픽스 6b3a4bd82 의 분리 기준
 *       (단순 redirect 만 ProtectedRoute 밖) 을 유지하고, 본 spec 은
 *       admin 컨텍스트에서 동작을 검증한다.
 *
 *  2) `approvals?mode=admin 로드 시 승인 허브 레이아웃이 보임`
 *     - 실 백엔드(API) 가 기동된 환경(별도 워크플로)에서만 의미 있음.
 *     - 기존대로 `loginErpUser` 로 실 로그인 후 본문 노출 검증.
 *     - 본 테스트는 `--grep "super-approvals"` 필터링으로 e2e-erp-smoke 에서는 제외됨.
 *
 * 로그인 계정: E2E_TEST_EMAIL / E2E_TEST_PASSWORD 우선, 없으면 TEST_USERNAME / TEST_PASSWORD,
 * 없으면 core-solution-testing 스킬 기본값.
 */
test.describe('ERP 승인 허브 라우트·리다이렉트', () => {
  test.setTimeout(90_000);

  test.describe('레거시 redirect (ADMIN 컨텍스트)', () => {
    // 합성 ADMIN storageState — `super-approvals` redirect 만 검증.
    // 다른 spec / 다른 project / 같은 파일의 다른 describe 에 영향 없음.
    test.use({ storageState: buildSyntheticAdminStorageState() });

    test('super-approvals 진입 시 approvals로 리다이렉트되고 mode=super', async ({ page }) => {
      await page.goto('/erp/super-approvals');
      await expect(page).toHaveURL(/\/erp\/approvals(\?|#|$)/);
      const u = new URL(page.url());
      expect(u.searchParams.get('mode')).toBe('super');
    });
  });

  test('approvals?mode=admin 로드 시 승인 허브 레이아웃이 보임', async ({ page }: { page: Page }, testInfo) => {
    await loginErpUser(page, testInfo);
    await page.goto('/erp/approvals?mode=admin');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await expect(page).toHaveURL(/\/erp\/approvals/);
    const u = new URL(page.url());
    expect(u.searchParams.get('mode')).toBe('admin');

    const approvalNav = page.locator('nav[aria-label="승인 구역 전환"]');
    await expect(approvalNav).toBeVisible({ timeout: 15000 });

    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible({ timeout: 10000 });
  });
});
