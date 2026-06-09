/**
 * useAuthStore.login — 로그인 직후 인앱 토스트 호출 검증.
 *
 * 사용자가 여러 계정을 가진 환경에서 동기화 오해를 방지하기 위해
 * `login` 성공 콜백 마지막에 `showInAppToast` 가 호출돼야 하고,
 * token refresh 경로(`updateTokens`)에서는 호출되지 않아야 한다.
 *
 * @author MindGarden
 * @since 2026-06-09
 */

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(async () => undefined),
  getItemAsync: jest.fn(async () => null),
  deleteItemAsync: jest.fn(async () => undefined),
}));

jest.mock('@/lib/getMmkv', () => ({
  createZustandMmkvPersistStorage: () => ({
    getItem: async () => null,
    setItem: async () => undefined,
    removeItem: async () => undefined,
  }),
}));

jest.mock('@/utils/adminRole', () => ({
  resolveStoreRoleFromAccessToken: jest.fn(() => null),
}));

jest.mock('@/utils/jwtPayload', () => ({
  decodeJwtPayload: jest.fn(() => null),
  parseJwtSubAsUserId: jest.fn(() => null),
}));

jest.mock('@/utils/tenantJwtSync', () => ({
  syncTenantStoreFromAccessToken: jest.fn(() => null),
}));

jest.mock('@/utils/sessionCookie', () => ({
  clearJsessionId: jest.fn(async () => undefined),
  hydrateJsessionCacheFromSecureStore: jest.fn(async () => undefined),
}));

const showInAppToast = jest.fn();
jest.mock('../../components/organisms/InAppNotificationToast', () => ({
  showInAppToast,
}));

import { useAuthStore } from '../useAuthStore';

describe('useAuthStore.login → showInAppToast', () => {
  beforeEach(() => {
    showInAppToast.mockClear();
  });

  it('로그인 성공 후 정확히 1회 호출되며 페이로드는 SSOT(buildLoginSuccessToastPayload)를 따른다', async () => {
    await useAuthStore.getState().login(
      { id: 20, email: 'beta74@live.co.kr', name: 'Beta', role: 'client' },
      { accessToken: 'a.b.c', refreshToken: 'x.y.z' },
    );

    expect(showInAppToast).toHaveBeenCalledTimes(1);
    const payload = showInAppToast.mock.calls[0][0];
    expect(payload).toMatchObject({
      title: '로그인 완료',
      body: 'beta74@live.co.kr (으)로 로그인되었습니다',
      icon: 'CheckCircle',
    });
    expect(typeof payload.id).toBe('string');
    expect(payload.id.startsWith('login-success-20-')).toBe(true);
  });

  it('token refresh 경로(updateTokens)에서는 토스트가 호출되지 않는다 (첫 로그인 시점만)', async () => {
    await useAuthStore.getState().updateTokens({
      accessToken: 'fresh.access.token',
      refreshToken: 'fresh.refresh.token',
    });

    expect(showInAppToast).not.toHaveBeenCalled();
  });
});
