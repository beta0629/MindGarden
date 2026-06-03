/**
 * STAFF_PERMISSION_POLICY_PHASE2 (PR #99) 후 ERP 라우트가 ADMIN ProtectedRoute
 * 로 보호되어, 레거시 URL → 정규 URL 리다이렉트만 검증하는 e2e 스펙은
 * 비로그인 시 추가 `/login` 우회로 toHaveURL polling 이 실패한다.
 *
 * 본 헬퍼는 백엔드 미동반 워크플로(`e2e-erp-smoke` — 워크플로 헤더
 * "로그인·백엔드 없이 리다이렉트만 검증") 에서 ADMIN 컨텍스트만 합성으로
 * 만들기 위한 storageState 객체를 만든다.
 *
 * 동작 원리:
 *   - `localStorage.userInfo` 만 미리 주입한다.
 *   - `frontend/src/utils/sessionManager.js` 의 `restoreUserFromStorage()` 가
 *     이를 읽어 `this.user` 를 복원하고, `checkSession()` 의 backend 504/네트워크
 *     오류 분기가 기존 user 를 보존 → `ProtectedRoute(ADMIN)` 가 통과.
 *
 * 보안 의미·사용 제약:
 *   - 실제 backend 세션·토큰을 만들지 않는다. 라우팅 정규화만 검증한다.
 *   - 비로그인·STAFF 의 ERP 차단 검증은 본 헬퍼를 사용하지 않는 다른 가드
 *     단위/통합 테스트(`frontend/src/.../*.test.js` 등) 에서 별도로 다룬다.
 *   - 새 admin 계정 시드 생성·실제 자격 증명 하드코딩 없음.
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
 * 합성 ADMIN 사용자 — `useSession.hasRole('ADMIN')`, `isAdmin()` 통과 목적.
 * `permissionGroupCodes` 는 빈 배열 — 본 헬퍼 사용 라우트는 `requiredPermissionGroups`
 * 미사용이라 무관. `tenantId` 는 형식만 채움(라우팅 검증에는 영향 없음).
 */
const SYNTHETIC_ADMIN_USER = Object.freeze({
  id: 99999001,
  email: 'e2e-erp-redirect-admin@local',
  name: 'E2E ERP Redirect Admin',
  role: 'ADMIN',
  permissionGroupCodes: [],
  tenantId: 'e2e-local'
});

/**
 * `test.use({ storageState })` 에 그대로 넘길 수 있는 storageState 객체를 반환.
 * 본 describe·test 단위로만 적용해 다른 spec/프로젝트에 영향 주지 않도록 사용한다.
 */
export function buildSyntheticAdminStorageState() {
  return {
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
}
