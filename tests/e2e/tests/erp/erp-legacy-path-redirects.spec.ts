// @ts-ignore - Playwright 패키지 설치 후 타입 오류 해결됨
import { test, expect } from '@playwright/test';

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
 *   를 검증한다. 비로그인·STAFF 차단 검증은 정책 가드 단위/통합 테스트
 *   (frontend/src/.../*.test.js, dashboardUtils 등) 에서 별도로 다룬다.
 *
 * 인증 전략 — 합성(synthetic) admin storageState:
 *   `e2e-erp-smoke` 워크플로는 백엔드 없이 프론트(`npm start`)만 띄워
 *   리다이렉트만 검증하므로(워크플로 헤더 "로그인·백엔드 없이 리다이렉트만 검증"),
 *   실제 `/api/v1/auth/login` 호출이 불가능하다. 따라서 본 spec 한정으로
 *   `localStorage.userInfo` 만 미리 채워 `sessionManager.restoreUserFromStorage()`
 *   가 ADMIN 사용자로 복원하도록 한다. (CRA proxy 가 backend 부재로 504/네트워크
 *   오류를 돌려도 `sessionManager.checkSession()` 은 기존 user 를 보존한다 —
 *   `frontend/src/utils/sessionManager.js` "기존 사용자 정보 보존" 분기.)
 *
 *   - 새 admin 계정 시드 생성 없음. 비밀번호·이메일 하드코딩 없음.
 *   - `userInfo` 에는 합성 관리자(`role: 'ADMIN'`)만 들어가며, 백엔드 세션은
 *     생성되지 않는다. 본 스펙(라우팅 정규화 검증) 외 다른 흐름에 사용 금지.
 *   - 다른 spec/프로젝트 영향 없음 — `test.use({ storageState })` 가 본 describe
 *     단위로만 적용된다.
 *
 * App.js Navigate 6개:
 *   - /erp/tax              → /erp/salary?tab=tax
 *   - /erp/inventory        → /erp/items
 *   - /erp/budgets          → /erp/budget
 *   - /admin/erp/dashboard  → /erp/dashboard
 *   - /admin/erp/purchase   → /erp/purchase-requests
 *   - /admin/erp/budget     → /erp/budget
 */

const E2E_BASE_URL_DEFAULT = 'http://localhost:3000';

function resolveBaseUrlOrigin(): string {
  const raw = process.env.BASE_URL || E2E_BASE_URL_DEFAULT;
  try {
    return new URL(raw).origin;
  } catch {
    return E2E_BASE_URL_DEFAULT;
  }
}

/**
 * 합성 ADMIN 사용자 (라우팅 검증용).
 * - role: ProtectedRoute(requiredRoles=[ADMIN]) 통과 — `useSession.hasRole`/`isAdmin` 기준.
 * - permissionGroupCodes: 빈 배열 — `requiredPermissionGroups` 미사용 라우트뿐이라 무관.
 * - tenantId: 프록시 getDefaultApiHeaders 가 헤더에 채울 수 있도록 형식만 채움(실제 검증 X).
 */
const SYNTHETIC_ADMIN_USER = Object.freeze({
  id: 99999001,
  email: 'e2e-erp-redirect-admin@local',
  name: 'E2E ERP Redirect Admin',
  role: 'ADMIN',
  permissionGroupCodes: [],
  tenantId: 'e2e-local'
});

const ADMIN_STORAGE_STATE = {
  cookies: [],
  origins: [
    {
      origin: resolveBaseUrlOrigin(),
      localStorage: [
        {
          name: 'userInfo',
          value: JSON.stringify(SYNTHETIC_ADMIN_USER)
        }
      ]
    }
  ]
};

test.describe('ERP 레거시 경로 리다이렉트 (ADMIN 컨텍스트)', () => {
  // 본 describe 내 모든 테스트는 합성 ADMIN storageState 로 진입한다.
  // 다른 spec / 다른 project 에 영향 없음.
  test.use({ storageState: ADMIN_STORAGE_STATE });

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
