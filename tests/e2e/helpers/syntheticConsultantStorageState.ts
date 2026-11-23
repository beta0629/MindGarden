/**
 * 상담사(CONSULTANT) 합성 storageState — soft-sheet 셸 ProtectedRoute 통과용.
 * 실세션·토큰 없음. 백엔드 미동반 Playwright 회귀 전용.
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

/** 합성 CONSULTANT — soft-sheet MobileLayout / 일정·홈 진입 */
const SYNTHETIC_CONSULTANT_USER = Object.freeze({
  id: 99999003,
  email: 'e2e-consultant-shell@local',
  name: 'E2E Consultant',
  role: 'CONSULTANT',
  permissionGroupCodes: [],
  tenantId: 'e2e-local',
  counselingEnabled: true
});

export function buildSyntheticConsultantStorageState() {
  return {
    cookies: [],
    origins: [
      {
        origin: resolveBaseUrlOrigin(),
        localStorage: [
          {
            name: 'userInfo',
            value: JSON.stringify(SYNTHETIC_CONSULTANT_USER)
          }
        ]
      }
    ]
  };
}

export function getSyntheticConsultantUser() {
  return { ...SYNTHETIC_CONSULTANT_USER };
}
