/**
 * AuthService.logout — P0 푸시 토큰 격리 단위 검증.
 *
 * 로그아웃 시 NotificationService.unregisterToken 이 반드시 호출되어, 이전 사용자
 * 토큰이 디바이스에 active=true 로 잔류해 다음 사용자에게 푸시가 가는 격리 위반
 * (D-1 무력화) 을 차단하는지 확인한다. 서버 unregister 실패는 logout 흐름을 막지
 * 않는다(swallow).
 *
 * @author MindGarden
 * @since 2026-06-10
 */

(globalThis as unknown as { __DEV__: boolean }).__DEV__ = false;

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  NativeModules: { RNNaverLogin: {}, RNKakaoLogins: {} },
}));

jest.mock('@react-native-seoul/kakao-login', () => ({
  __esModule: true,
  login: jest.fn(),
  logout: jest.fn().mockResolvedValue(undefined),
  getProfile: jest.fn(),
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  __esModule: true,
  GoogleSignin: {
    configure: jest.fn(),
    signIn: jest.fn(),
    getTokens: jest.fn(),
    hasPlayServices: jest.fn(),
    signOut: jest.fn(),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
  isSuccessResponse: jest.fn(),
  isCancelledResponse: jest.fn(),
  isErrorWithCode: jest.fn(),
}));

jest.mock('@react-native-seoul/naver-login', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(),
    login: jest.fn(),
    getProfile: jest.fn(),
    logout: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        naverClientId: 'test-naver-client-id',
        naverClientSecret: 'test-naver-client-secret',
      },
    },
  },
}));

jest.mock('@/api/auth/appleAuth', () => ({
  __esModule: true,
  postAppleLogin: jest.fn(),
  postAppleSendPhoneOtp: jest.fn(),
  postAppleVerifyPhoneOtp: jest.fn(),
}));

jest.mock('@/api/auth/oauthAuth', () => ({
  __esModule: true,
  postOAuthSendPhoneOtp: jest.fn(),
  postOAuthVerifyPhoneOtp: jest.fn(),
}));

jest.mock('@/services/auth/appleSignIn', () => ({
  __esModule: true,
  APPLE_SIGN_IN_CANCELLED: 'APPLE_SIGN_IN_CANCELLED',
  isAppleSignInAvailable: jest.fn().mockResolvedValue(true),
  isAppleSignInAvailableSync: jest.fn().mockReturnValue(true),
  performAppleNativeSignIn: jest.fn(),
}));

jest.mock('@/services/auth/googleSignIn', () => ({
  __esModule: true,
  signInWithGoogle: jest.fn(),
  signOutFromGoogle: jest.fn().mockResolvedValue(undefined),
}));

const unregisterTokenSpy = jest.fn().mockResolvedValue(true);
jest.mock('@/services/NotificationService', () => ({
  __esModule: true,
  NotificationService: {
    unregisterToken: (...args: unknown[]) => unregisterTokenSpy(...args),
  },
}));

const apiPostMock = jest.fn().mockResolvedValue(undefined);
jest.mock('@/api/client', () => ({
  __esModule: true,
  apiPost: (...args: unknown[]) => apiPostMock(...args),
}));

jest.mock('@/lib/getMmkv', () => ({
  __esModule: true,
  isExpoGoApp: jest.fn().mockReturnValue(false),
  createZustandMmkvPersistStorage: jest.fn().mockReturnValue({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  }),
}));

jest.mock('expo-secure-store', () => ({
  __esModule: true,
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/utils/sessionCookie', () => ({
  __esModule: true,
  setCachedJsessionId: jest.fn(),
  setJsessionId: jest.fn().mockResolvedValue(undefined),
  formatJsessionCookieHeader: jest.fn().mockReturnValue(null),
  hydrateJsessionCacheFromSecureStore: jest.fn().mockResolvedValue(undefined),
  peekCachedJsessionId: jest.fn().mockReturnValue(null),
  clearJsessionId: jest.fn().mockResolvedValue(undefined),
}));

const storeLogoutSpy = jest.fn().mockResolvedValue(undefined);
jest.mock('@/stores/useAuthStore', () => ({
  __esModule: true,
  useAuthStore: {
    getState: () => ({
      login: jest.fn().mockResolvedValue(undefined),
      logout: storeLogoutSpy,
      updateTokens: jest.fn().mockResolvedValue(undefined),
      refreshToken: null,
      accessToken: null,
    }),
  },
}));

jest.mock('@/stores/useTenantStore', () => ({
  __esModule: true,
  useTenantStore: {
    getState: () => ({ tenantId: 'tenant-a' }),
  },
}));

jest.mock('@/utils/syncTenantFromAccessToken', () => ({
  __esModule: true,
  syncTenantFromAccessToken: jest.fn(),
}));

import { AuthService } from '../AuthService';

describe('AuthService.logout — P0 푸시 토큰 격리 (NotificationService.unregisterToken 호출)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    unregisterTokenSpy.mockResolvedValue(true);
    apiPostMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('logout()는 server logout 전에 NotificationService.unregisterToken 을 호출한다', async () => {
    const callOrder: string[] = [];
    unregisterTokenSpy.mockImplementation(async () => {
      callOrder.push('unregister');
      return true;
    });
    apiPostMock.mockImplementation(async () => {
      callOrder.push('logoutApi');
      return undefined;
    });

    await AuthService.logout();

    expect(unregisterTokenSpy).toHaveBeenCalledTimes(1);
    expect(callOrder).toEqual(['unregister', 'logoutApi']);
    expect(storeLogoutSpy).toHaveBeenCalledTimes(1);
  });

  test('unregisterToken 실패해도 logout 흐름은 계속 진행되며 store.logout 까지 실행', async () => {
    unregisterTokenSpy.mockRejectedValueOnce(new Error('network down'));

    await expect(AuthService.logout()).resolves.toBeUndefined();

    expect(unregisterTokenSpy).toHaveBeenCalledTimes(1);
    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(storeLogoutSpy).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(
      '[AuthService.logout] unregister token failed',
      expect.any(Error),
    );
  });

  test('provider=GOOGLE 인 경우에도 unregisterToken 이 호출된다', async () => {
    await AuthService.logout('GOOGLE');

    expect(unregisterTokenSpy).toHaveBeenCalledTimes(1);
    expect(storeLogoutSpy).toHaveBeenCalledTimes(1);
  });
});
