/**
 * AuthService.logout / performSignOut — 네트워크 hang 시에도 로컬 clear 완료.
 *
 * @author MindGarden
 * @since 2026-05-12
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

jest.mock('@/components/organisms/InAppNotificationToast', () => ({
  __esModule: true,
  showInAppToast: jest.fn(),
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

import { SIGN_OUT_NETWORK_TIMEOUT_MS } from '@/constants/apiClientTimeout';
import { AuthService } from '../AuthService';
import { __resetPerformSignOutInFlightForTests } from '../auth/performSignOut';

describe('AuthService.logout — hang API 에서도 로컬 로그아웃 완료', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    __resetPerformSignOutInFlightForTests();
    unregisterTokenSpy.mockResolvedValue(true);
    apiPostMock.mockResolvedValue(undefined);
    storeLogoutSpy.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    __resetPerformSignOutInFlightForTests();
  });

  test('unregister·logout API 가 hang 되어도 store.logout 이 timeout 후 호출된다', async () => {
    jest.useFakeTimers();

    unregisterTokenSpy.mockImplementation(
      () =>
        new Promise(() => {
          /* never resolves — refresh 큐 hang 재현 */
        }),
    );
    apiPostMock.mockImplementation(
      () =>
        new Promise(() => {
          /* never resolves */
        }),
    );

    const logoutPromise = AuthService.logout();

    // unregister timeout
    await jest.advanceTimersByTimeAsync(SIGN_OUT_NETWORK_TIMEOUT_MS);
    // logout API timeout
    await jest.advanceTimersByTimeAsync(SIGN_OUT_NETWORK_TIMEOUT_MS);

    await expect(logoutPromise).resolves.toBeUndefined();
    expect(storeLogoutSpy).toHaveBeenCalledTimes(1);
    expect(unregisterTokenSpy).toHaveBeenCalledTimes(1);
  });

  test('logout API 만 hang 되어도 store.logout 은 완료된다', async () => {
    jest.useFakeTimers();

    unregisterTokenSpy.mockResolvedValue(true);
    apiPostMock.mockImplementation(
      () =>
        new Promise(() => {
          /* hang */
        }),
    );

    const logoutPromise = AuthService.logout();
    await jest.advanceTimersByTimeAsync(SIGN_OUT_NETWORK_TIMEOUT_MS);

    await expect(logoutPromise).resolves.toBeUndefined();
    expect(storeLogoutSpy).toHaveBeenCalledTimes(1);
  });
});
