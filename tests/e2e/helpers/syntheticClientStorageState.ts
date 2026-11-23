/**
 * 내담자(CLIENT) 합성 storageState — ClientWebPageShell 햄버거·드로어 회귀용.
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

/** 합성 CLIENT — 서브 화면 ☰ / CoverMenuDrawer */
const SYNTHETIC_CLIENT_USER = Object.freeze({
  id: 99999004,
  email: 'e2e-client-shell@local',
  name: 'E2E Client',
  role: 'CLIENT',
  permissionGroupCodes: [],
  tenantId: 'e2e-local'
});

export function buildSyntheticClientStorageState() {
  return {
    cookies: [],
    origins: [
      {
        origin: resolveBaseUrlOrigin(),
        localStorage: [
          {
            name: 'userInfo',
            value: JSON.stringify(SYNTHETIC_CLIENT_USER)
          }
        ]
      }
    ]
  };
}

export function getSyntheticClientUser() {
  return { ...SYNTHETIC_CLIENT_USER };
}
