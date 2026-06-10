/**
 * Apple SIWA 휴대폰 매칭 — AuthService 신규 메서드 통합 단위 테스트.
 *
 * <p>AS1 (loginWithApple → requiresApplePhoneVerification 분기),
 * AS2/AS3 (sendApplePhoneOtp 정상/쿨다운),
 * AS4 (verifyApplePhoneOtp 정상 로그인 + 토큰 저장),
 * AS5 (verifyApplePhoneOtp account selection 분기),
 * AS6 (verifyApplePhoneOtp 실패 분기),
 * AS7 (apple_sub 즉시 로그인 회귀),
 * AS8 (카카오/네이버 흐름 회귀 — `SocialLoginOutcome` enum 변경 없음 확인) 를 검증한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-08
 */

// Metro 가 주입하는 `__DEV__` 글로벌은 node 환경에 없으므로 보강한다.
import { AuthService, type SocialLoginOutcome } from '../AuthService';

(globalThis as unknown as { __DEV__: boolean }).__DEV__ = false;

// react-native, expo-constants, expo SDK 의 네이티브 모듈 의존을 차단한다.
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  NativeModules: {},
}));

jest.mock('@react-native-seoul/kakao-login', () => ({
  __esModule: true,
  login: jest.fn(),
  logout: jest.fn(),
  getProfile: jest.fn(),
}));

// `@react-native-google-signin/google-signin` 은 ESM 모듈이라 jest 가 transform 하지 못한다.
// 본 suite 는 Apple 흐름만 검증 → SDK 호출이 발생하지 않으므로 stub mock 으로 충분.
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
    logout: jest.fn(),
  },
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: {} } },
}));

jest.mock('@/api/auth/appleAuth', () => ({
  __esModule: true,
  postAppleLogin: jest.fn(),
  postAppleSendPhoneOtp: jest.fn(),
  postAppleVerifyPhoneOtp: jest.fn(),
}));

jest.mock('@/services/auth/appleSignIn', () => ({
  __esModule: true,
  APPLE_SIGN_IN_CANCELLED: 'APPLE_SIGN_IN_CANCELLED',
  isAppleSignInAvailable: jest.fn().mockResolvedValue(true),
  isAppleSignInAvailableSync: jest.fn().mockReturnValue(true),
  performAppleNativeSignIn: jest.fn(),
}));

jest.mock('@/api/client', () => ({
  __esModule: true,
  apiPost: jest.fn(),
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

const loginSpy = jest.fn().mockResolvedValue(undefined);

jest.mock('@/stores/useAuthStore', () => ({
  __esModule: true,
  useAuthStore: {
    getState: () => ({
      login: loginSpy,
      logout: jest.fn().mockResolvedValue(undefined),
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

// eslint-disable-next-line @typescript-eslint/no-require-imports
const appleAuth = require('@/api/auth/appleAuth');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const appleSignIn = require('@/services/auth/appleSignIn');

describe('AuthService — Apple SIWA 휴대폰 매칭 흐름', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    appleSignIn.isAppleSignInAvailable.mockResolvedValue(true);
    appleSignIn.performAppleNativeSignIn.mockResolvedValue({
      identityToken: 'apple-id-token',
      authorizationCode: 'apple-auth-code',
      email: 'native@example.com',
      givenName: '길동',
      familyName: '홍',
      user: 'apple-sub-native',
      nonce: 'nonce-xyz-abcdefghijklmnopqrstuvwxyz0123456789',
    });
  });

  test('AS1: loginWithApple — BE 가 requiresPhoneVerification=true 응답 시 kind=requiresApplePhoneVerification', async () => {
    appleAuth.postAppleLogin.mockResolvedValueOnce({
      success: true,
      requiresPhoneVerification: true,
      phoneVerificationToken: 'pvt-token-xyz',
      socialUserInfo: {
        provider: 'APPLE',
        providerUserId: 'apple-sub-001',
        email: 'user@example.com',
        name: '홍 길동',
        isPrivateRelay: false,
      },
    });

    const result = await AuthService.loginWithApple();

    expect(result.kind).toBe('requiresApplePhoneVerification');
    if (result.kind !== 'requiresApplePhoneVerification') return;
    expect(result.phoneVerificationToken).toBe('pvt-token-xyz');
    expect(result.socialUserInfo.email).toBe('user@example.com');
    expect(result.socialUserInfo.name).toBe('홍 길동');
    expect(loginSpy).not.toHaveBeenCalled();
  });

  test('AS2: sendApplePhoneOtp — 정상 발송 응답 → kind=sent + token 전달', async () => {
    appleAuth.postAppleSendPhoneOtp.mockResolvedValueOnce({
      success: true,
      otpChallengeToken: 'oct-token-xyz',
      expiresInSeconds: 180,
    });

    const result = await AuthService.sendApplePhoneOtp('pvt-xyz', '01012345678');

    expect(result.kind).toBe('sent');
    if (result.kind !== 'sent') return;
    expect(result.otpChallengeToken).toBe('oct-token-xyz');
    expect(result.expiresInSeconds).toBe(180);
    expect(appleAuth.postAppleSendPhoneOtp).toHaveBeenCalledWith({
      phoneVerificationToken: 'pvt-xyz',
      phoneNumber: '01012345678',
    });
  });

  test('AS3: sendApplePhoneOtp — 쿨다운(retryAfterSeconds) 응답 → kind=cooldown + 안내 메시지', async () => {
    appleAuth.postAppleSendPhoneOtp.mockResolvedValueOnce({
      success: false,
      message: '1분 후에 다시 시도해 주세요.',
      retryAfterSeconds: 47,
    });

    const result = await AuthService.sendApplePhoneOtp('pvt-xyz', '01012345678');

    expect(result.kind).toBe('cooldown');
    if (result.kind !== 'cooldown') return;
    expect(result.retryAfterSeconds).toBe(47);
    expect(result.message).toBe('1분 후에 다시 시도해 주세요.');
  });

  test('AS4: verifyApplePhoneOtp — 정상 로그인 응답 시 토큰 저장(useAuthStore.login) 호출', async () => {
    appleAuth.postAppleVerifyPhoneOtp.mockResolvedValueOnce({
      success: true,
      accessToken: 'at-from-verify',
      refreshToken: 'rt-from-verify',
      user: {
        id: 99,
        email: 'verified@example.com',
        name: '검증 사용자',
        nickname: 'verified',
        role: 'CLIENT',
        tenantId: 'tenant-a',
      },
    });

    const result = await AuthService.verifyApplePhoneOtp('pvt-xyz', 'oct-xyz', '123456');

    expect(result.kind).toBe('authenticated');
    if (result.kind !== 'authenticated') return;
    expect(result.user.id).toBe(99);
    expect(result.user.email).toBe('verified@example.com');
    expect(loginSpy).toHaveBeenCalledTimes(1);
    const [storedUser, storedTokens] = loginSpy.mock.calls[0] as [
      unknown,
      { accessToken: string; refreshToken: string },
    ];
    expect(storedTokens.accessToken).toBe('at-from-verify');
    expect(storedTokens.refreshToken).toBe('rt-from-verify');
    expect(storedUser).toMatchObject({ id: 99, email: 'verified@example.com' });
  });

  test('AS5: verifyApplePhoneOtp — requiresPhoneAccountSelection 분기 시 토큰 저장 없음', async () => {
    appleAuth.postAppleVerifyPhoneOtp.mockResolvedValueOnce({
      success: true,
      requiresPhoneAccountSelection: true,
      phoneAccountSelectionToken: 'sel-token-xyz',
      message: '같은 휴대폰 번호의 계정이 여러 개 있습니다.',
    });

    const result = await AuthService.verifyApplePhoneOtp('pvt-xyz', 'oct-xyz', '123456');

    expect(result.kind).toBe('requiresPhoneAccountSelection');
    if (result.kind !== 'requiresPhoneAccountSelection') return;
    expect(result.selectionToken).toBe('sel-token-xyz');
    expect(result.provider).toBe('APPLE');
    expect(loginSpy).not.toHaveBeenCalled();
  });

  test('AS6: verifyApplePhoneOtp — success=false 응답 시 kind=error + 안내 메시지', async () => {
    appleAuth.postAppleVerifyPhoneOtp.mockResolvedValueOnce({
      success: false,
      message: '인증번호가 일치하지 않습니다. 시도 횟수를 초과하면 처음부터 다시 시도해야 합니다.',
    });

    const result = await AuthService.verifyApplePhoneOtp('pvt-xyz', 'oct-xyz', '999999');

    expect(result.kind).toBe('error');
    if (result.kind !== 'error') return;
    expect(result.message).toMatch(/일치하지 않습니다/);
    expect(loginSpy).not.toHaveBeenCalled();
  });

  test('AS6-b: verifyApplePhoneOtp — 6자리가 아닌 입력은 BE 호출 없이 즉시 error', async () => {
    const result = await AuthService.verifyApplePhoneOtp('pvt-xyz', 'oct-xyz', '12');

    expect(result.kind).toBe('error');
    expect(appleAuth.postAppleVerifyPhoneOtp).not.toHaveBeenCalled();
  });

  test('AS7: loginWithApple — apple_sub 기존 매칭 (requiresPhoneVerification=false) 시 즉시 로그인 회귀', async () => {
    appleAuth.postAppleLogin.mockResolvedValueOnce({
      success: true,
      requiresPhoneVerification: false,
      accessToken: 'at-existing',
      refreshToken: 'rt-existing',
      user: {
        id: 7,
        email: 'existing@example.com',
        name: '기존 사용자',
        nickname: 'old',
        role: 'CLIENT',
        tenantId: 'tenant-a',
      },
    });

    const result = await AuthService.loginWithApple();

    expect(result.kind).toBe('authenticated');
    if (result.kind !== 'authenticated') return;
    expect(result.user.email).toBe('existing@example.com');
    expect(loginSpy).toHaveBeenCalledTimes(1);
  });

  test('AS8: 카카오/네이버 SocialLoginOutcome enum 회귀 — 기존 kind 값이 그대로 노출되고 신규 kind 가 정의된다', () => {
    // 본 회귀 테스트는 type-level + value-level 양쪽 모두 확인한다.
    // 카카오/네이버의 기존 outcome kind 가 그대로 유효해야 한다.
    const ok: SocialLoginOutcome = {
      kind: 'authenticated',
      user: {
        id: 1,
        email: 'k@example.com',
        name: 'K',
        nickname: '',
        role: 'client',
      },
    };
    const signup: SocialLoginOutcome = {
      kind: 'requiresSignup',
      provider: 'KAKAO',
      socialUserInfo: {
        provider: 'KAKAO',
        providerUserId: 'kakao-1',
        email: '',
        nickname: '',
      },
    };
    const sel: SocialLoginOutcome = {
      kind: 'requiresPhoneAccountSelection',
      provider: 'NAVER',
      selectionToken: 'sel',
    };
    const dup: SocialLoginOutcome = {
      kind: 'requiresDuplicateLoginConfirmation',
      message: 'dup',
      retryContext: { provider: 'credentials', email: 'a@b', password: 'x' },
    };
    const err: SocialLoginOutcome = { kind: 'error', message: 'fail' };
    const apple: SocialLoginOutcome = {
      kind: 'requiresApplePhoneVerification',
      phoneVerificationToken: 'pvt',
      socialUserInfo: { providerUserId: 'apple-1', email: '', name: '', isPrivateRelay: false },
    };

    expect([ok.kind, signup.kind, sel.kind, dup.kind, err.kind, apple.kind]).toEqual([
      'authenticated',
      'requiresSignup',
      'requiresPhoneAccountSelection',
      'requiresDuplicateLoginConfirmation',
      'error',
      'requiresApplePhoneVerification',
    ]);
  });
});
