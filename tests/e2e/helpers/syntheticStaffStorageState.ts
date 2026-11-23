/**
 * 사무원(STAFF) 합성 storageState — `syntheticAdminStorageState.ts` 와 동일 패턴.
 * 백엔드 없이 ProtectedRoute(STAFF/ADMIN 운영 셸) 통과용. 실세션·토큰 없음.
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

/** 합성 STAFF 사용자 — `RoleUtils.isStaff` / soft-sheet 관리자 셸 통과 목적 */
const SYNTHETIC_STAFF_USER = Object.freeze({
  id: 99999002,
  email: 'e2e-staff-shell@local',
  name: 'E2E Staff',
  role: 'STAFF',
  permissionGroupCodes: [],
  tenantId: 'e2e-local'
});

/**
 * `test.use({ storageState })` 에 그대로 넘길 storageState.
 */
export function buildSyntheticStaffStorageState() {
  return {
    cookies: [],
    origins: [
      {
        origin: resolveBaseUrlOrigin(),
        localStorage: [
          {
            name: 'userInfo',
            value: JSON.stringify(SYNTHETIC_STAFF_USER)
          }
        ]
      }
    ]
  };
}

export function getSyntheticStaffUser() {
  return { ...SYNTHETIC_STAFF_USER };
}
