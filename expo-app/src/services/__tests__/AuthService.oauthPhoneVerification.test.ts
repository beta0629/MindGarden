/**
 * provider-agnostic OAuth 휴대폰 매칭 — AuthService 신규 메서드 통합 단위 테스트.
 *
 * <p>본 테스트는 디자이너 산출물의 14 상태 중 AuthService 계층 책임 분기를 검증한다.
 * RN 컴포넌트 테스트 인프라(@testing-library/react-native) 가 없으므로 화면
 * (`oauth-phone-link.tsx`) 자체는 Apple 베이스(`apple-phone-link.tsx`)와 동일 패턴으로
 * 유틸·매퍼·AuthService 통합 테스트로 등가 검증한다.</p>
 *
 * 분기 ID:
 *  - OA1: loginWithKakao/Naver → requiresOAuthPhoneVerification 응답 dispatch
 *  - OA2/OA3: sendOAuthPhoneOtp 정상/쿨다운
 *  - OA4: verifyOAuthPhoneOtp 단일 매칭 정상 로그인 + 토큰 저장
 *  - OA5: verifyOAuthPhoneOtp 다중 매칭 (requiresPhoneAccountSelection)
 *  - OA6: verifyOAuthPhoneOtp 실패 (code 보존)
 *  - OA7: 6자리 미달 입력은 BE 호출 없이 즉시 error
 *  - OA8: SocialLoginOutcome enum 회귀 — 기존 kind + 신규 kind 모두 유효
 *  - OA9: Apple OTP 흐름 회귀 — 신규 메서드가 Apple 흐름을 건드리지 않음
 *
 * @author MindGarden
 * @since 2026-06-09
 */

import { AuthService, type SocialLoginOutcome } from '../AuthService';

(globalThis as unknown as { __DEV__: boolean }).__DEV__ = false;

// react-native, expo-constants, expo SDK 의 네이티브 모듈 의존을 차단한다.
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  NativeModules: { RNNaverLogin: {}, RNKakaoLogins: {} },
}));

jest.mock('@react-native-seoul/kakao-login', () => ({
  __esModule: true,
  login: jest.fn(),
  logout: jest.fn(),
  getProfile: jest.fn(),
}));

// `@react-native-google-signin/google-signin` 은 ESM 으로 publish 되어 jest 가 transform 하지 못한다.
// AuthService 가 import 만 해도 module load 시점에 SyntaxError 가 나므로, 본 suite 의 OAuth 휴대폰
// 흐름은 GOOGLE 도구 미사용 → SDK 호출이 발생하지 않아 stub mock 으로 충분하다.
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
const oauthAuth = require('@/api/auth/oauthAuth');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const apiClient = require('@/api/client');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const kakaoSdk = require('@react-native-seoul/kakao-login');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const naverSdkModule = require('@react-native-seoul/naver-login');
const naverSdk = naverSdkModule.default;

describe('AuthService — provider-agnostic OAuth 휴대폰 매칭 흐름', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('OA1: loginWithKakao/Naver → BE 가 requiresOAuthPhoneVerification 분기', () => {
    test('Kakao: BE 응답에 requiresOAuthPhoneVerification=true → kind=requiresOAuthPhoneVerification', async () => {
      kakaoSdk.login.mockResolvedValueOnce({ accessToken: 'kakao-at' });
      kakaoSdk.getProfile.mockResolvedValueOnce({
        id: 12345,
        email: 'kakao@example.com',
        nickname: 'kakaoNick',
        profileImageUrl: 'https://img/k.png',
      });
      apiClient.apiPost.mockResolvedValueOnce({
        success: true,
        requiresOAuthPhoneVerification: true,
        phoneVerificationToken: 'pvt-kakao-001',
        socialUserInfo: {
          email: 'kakao@example.com',
          nickname: 'kakaoNick',
          provider: 'KAKAO',
          socialId: '12345',
        },
      });

      const result = await AuthService.loginWithKakao();

      expect(result.kind).toBe('requiresOAuthPhoneVerification');
      if (result.kind !== 'requiresOAuthPhoneVerification') return;
      expect(result.provider).toBe('KAKAO');
      expect(result.phoneVerificationToken).toBe('pvt-kakao-001');
      expect(result.socialUserInfo.email).toBe('kakao@example.com');
      expect(result.socialUserInfo.name).toBe('kakaoNick');
      expect(loginSpy).not.toHaveBeenCalled();
    });

    test('Naver: BE 응답에 requiresOAuthPhoneVerification=true → kind=requiresOAuthPhoneVerification + name 누락 안전', async () => {
      naverSdk.login.mockResolvedValueOnce({
        successResponse: { accessToken: 'naver-at' },
      });
      naverSdk.getProfile.mockResolvedValueOnce({
        response: {
          id: 'naver-id-001',
          email: 'naver@example.com',
          nickname: 'naverNick',
          profile_image: 'https://img/n.png',
        },
      });
      apiClient.apiPost.mockResolvedValueOnce({
        success: true,
        requiresOAuthPhoneVerification: true,
        phoneVerificationToken: 'pvt-naver-001',
        socialUserInfo: {
          email: 'naver@example.com',
          nickname: '',
          provider: 'NAVER',
          socialId: 'naver-id-001',
        },
      });

      const result = await AuthService.loginWithNaver();

      expect(result.kind).toBe('requiresOAuthPhoneVerification');
      if (result.kind !== 'requiresOAuthPhoneVerification') return;
      expect(result.provider).toBe('NAVER');
      expect(result.phoneVerificationToken).toBe('pvt-naver-001');
      expect(result.socialUserInfo.email).toBe('naver@example.com');
      expect(result.socialUserInfo.name).toBe('');
    });
  });

  describe('OA2/OA3: sendOAuthPhoneOtp', () => {
    test('OA2: 정상 발송 → kind=sent + challengeToken + 메타', async () => {
      oauthAuth.postOAuthSendPhoneOtp.mockResolvedValueOnce({
        success: true,
        challengeToken: 'ch-001',
        expiresInSeconds: 180,
        resendCooldownSeconds: 60,
        maskedPhone: '010-****-5678',
      });

      const result = await AuthService.sendOAuthPhoneOtp('NAVER', 'pvt-naver-001', '01012345678');

      expect(result.kind).toBe('sent');
      if (result.kind !== 'sent') return;
      expect(result.challengeToken).toBe('ch-001');
      expect(result.expiresInSeconds).toBe(180);
      expect(result.resendCooldownSeconds).toBe(60);
      expect(result.maskedPhone).toBe('010-****-5678');
      expect(oauthAuth.postOAuthSendPhoneOtp).toHaveBeenCalledWith({
        oauthProvider: 'NAVER',
        phoneVerificationToken: 'pvt-naver-001',
        phone: '01012345678',
      });
    });

    test('OA3: 쿨다운(retryAfterSeconds) → kind=cooldown + 안내 + code 보존', async () => {
      oauthAuth.postOAuthSendPhoneOtp.mockResolvedValueOnce({
        success: false,
        message: '잠시 후 다시 시도해 주세요.',
        retryAfterSeconds: 47,
        code: 'RESEND_COOLDOWN',
      });

      const result = await AuthService.sendOAuthPhoneOtp('KAKAO', 'pvt-kakao-001', '01012345678');

      expect(result.kind).toBe('cooldown');
      if (result.kind !== 'cooldown') return;
      expect(result.retryAfterSeconds).toBe(47);
      expect(result.code).toBe('RESEND_COOLDOWN');
    });

    test('OA3-b: 일 한도 초과 응답 → kind=error + code=DAILY_LIMIT_EXCEEDED 보존', async () => {
      oauthAuth.postOAuthSendPhoneOtp.mockResolvedValueOnce({
        success: false,
        message: '오늘 인증 시도 횟수를 초과했습니다.',
        code: 'DAILY_LIMIT_EXCEEDED',
      });

      const result = await AuthService.sendOAuthPhoneOtp('NAVER', 'pvt-naver-001', '01012345678');

      expect(result.kind).toBe('error');
      if (result.kind !== 'error') return;
      expect(result.code).toBe('DAILY_LIMIT_EXCEEDED');
    });

    test('필수 파라미터 누락 시 BE 호출 없이 즉시 error', async () => {
      const r1 = await AuthService.sendOAuthPhoneOtp('NAVER', '', '01012345678');
      const r2 = await AuthService.sendOAuthPhoneOtp('NAVER', 'pvt-1', '');
      expect(r1.kind).toBe('error');
      expect(r2.kind).toBe('error');
      expect(oauthAuth.postOAuthSendPhoneOtp).not.toHaveBeenCalled();
    });
  });

  describe('OA4/OA5/OA6: verifyOAuthPhoneOtp', () => {
    test('OA4: 단일 매칭 정상 → kind=authenticated + 토큰 저장(useAuthStore.login 호출)', async () => {
      oauthAuth.postOAuthVerifyPhoneOtp.mockResolvedValueOnce({
        success: true,
        accessToken: 'at-verify-001',
        refreshToken: 'rt-verify-001',
        matchedAccount: { userId: 99, tenantId: 'tenant-a', role: 'CLIENT' },
      });

      const result = await AuthService.verifyOAuthPhoneOtp(
        'NAVER',
        'pvt-naver-001',
        'ch-001',
        '123456',
      );

      expect(result.kind).toBe('authenticated');
      if (result.kind !== 'authenticated') return;
      expect(result.user.id).toBe(99);
      expect(result.user.tenantId).toBe('tenant-a');
      expect(loginSpy).toHaveBeenCalledTimes(1);
      const [storedUser, storedTokens] = loginSpy.mock.calls[0] as [
        unknown,
        { accessToken: string; refreshToken: string },
      ];
      expect(storedTokens.accessToken).toBe('at-verify-001');
      expect(storedTokens.refreshToken).toBe('rt-verify-001');
      expect(storedUser).toMatchObject({ id: 99 });
    });

    test('OA5: 다중 매칭 → kind=requiresPhoneAccountSelection + provider 보존, 토큰 저장 없음', async () => {
      oauthAuth.postOAuthVerifyPhoneOtp.mockResolvedValueOnce({
        success: true,
        requiresPhoneAccountSelection: true,
        phoneAccountSelectionToken: 'sel-token-001',
        message: '같은 휴대폰 번호 계정이 여러 개 있습니다.',
      });

      const result = await AuthService.verifyOAuthPhoneOtp(
        'KAKAO',
        'pvt-kakao-001',
        'ch-001',
        '123456',
      );

      expect(result.kind).toBe('requiresPhoneAccountSelection');
      if (result.kind !== 'requiresPhoneAccountSelection') return;
      expect(result.selectionToken).toBe('sel-token-001');
      expect(result.provider).toBe('KAKAO');
      expect(loginSpy).not.toHaveBeenCalled();
    });

    test('OA6: success=false + code=OTP_INVALID → kind=error + 안내 + code 보존', async () => {
      oauthAuth.postOAuthVerifyPhoneOtp.mockResolvedValueOnce({
        success: false,
        code: 'OTP_INVALID',
        message: '인증번호가 일치하지 않습니다.',
      });

      const result = await AuthService.verifyOAuthPhoneOtp(
        'NAVER',
        'pvt-naver-001',
        'ch-001',
        '999999',
      );

      expect(result.kind).toBe('error');
      if (result.kind !== 'error') return;
      expect(result.message).toMatch(/일치하지 않습니다/);
      expect(result.code).toBe('OTP_INVALID');
      expect(loginSpy).not.toHaveBeenCalled();
    });

    test('OA7: 6자리가 아닌 입력은 BE 호출 없이 즉시 error', async () => {
      const result = await AuthService.verifyOAuthPhoneOtp(
        'NAVER',
        'pvt-naver-001',
        'ch-001',
        '12',
      );

      expect(result.kind).toBe('error');
      expect(oauthAuth.postOAuthVerifyPhoneOtp).not.toHaveBeenCalled();
    });
  });

  describe('OA8: SocialLoginOutcome enum 회귀 — 기존 kind + 신규 kind 모두 유효', () => {
    test('타입 + 값 레벨 모두 신규 requiresOAuthPhoneVerification 가 노출되고 기존 kind 가 유지된다', () => {
      const ok: SocialLoginOutcome = {
        kind: 'authenticated',
        user: { id: 1, email: 'k@example.com', name: 'K', nickname: '', role: 'client' },
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
        socialUserInfo: {
          providerUserId: 'apple-1',
          email: '',
          name: '',
          isPrivateRelay: false,
        },
      };
      const oauth: SocialLoginOutcome = {
        kind: 'requiresOAuthPhoneVerification',
        phoneVerificationToken: 'pvt-2',
        provider: 'NAVER',
        socialUserInfo: { providerUserId: 'naver-1', email: '', name: '' },
      };

      expect([ok.kind, signup.kind, sel.kind, dup.kind, err.kind, apple.kind, oauth.kind]).toEqual([
        'authenticated',
        'requiresSignup',
        'requiresPhoneAccountSelection',
        'requiresDuplicateLoginConfirmation',
        'error',
        'requiresApplePhoneVerification',
        'requiresOAuthPhoneVerification',
      ]);
    });
  });

  describe('OA9: Apple OTP 흐름 회귀 — 신규 메서드가 Apple API 를 호출하지 않는다', () => {
    test('OAuth send/verify 호출 후에도 Apple API mock 은 0회', async () => {
      oauthAuth.postOAuthSendPhoneOtp.mockResolvedValueOnce({
        success: true,
        challengeToken: 'ch-x',
        expiresInSeconds: 180,
      });
      oauthAuth.postOAuthVerifyPhoneOtp.mockResolvedValueOnce({
        success: false,
        code: 'OTP_INVALID',
        message: 'no',
      });

      await AuthService.sendOAuthPhoneOtp('NAVER', 'pvt', '01012345678');
      await AuthService.verifyOAuthPhoneOtp('NAVER', 'pvt', 'ch-x', '123456');

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const appleAuth = require('@/api/auth/appleAuth');
      expect(appleAuth.postAppleSendPhoneOtp).not.toHaveBeenCalled();
      expect(appleAuth.postAppleVerifyPhoneOtp).not.toHaveBeenCalled();
      expect(appleAuth.postAppleLogin).not.toHaveBeenCalled();
    });
  });
});
