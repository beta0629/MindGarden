/**
 * googleWebOAuth2Service — `@react-oauth/google` 웹 흐름과 BE `/social-login` 매칭 단위 테스트.
 *
 * `StandardizedApi.post` 를 mock 하여 BE 응답 분기별로 outcome 매핑이 정확한지 확인한다.
 *
 * @author MindGarden
 * @since 2026-06-10
 */

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    post: jest.fn()
  }
}));

const StandardizedApi = require('../../../utils/standardizedApi').default;
const {
  mapGoogleSocialLoginResponse,
  requestGoogleSocialLogin
} = require('../googleWebOAuth2Service');

describe('googleWebOAuth2Service', () => {
  beforeEach(() => {
    StandardizedApi.post.mockReset();
  });

  describe('mapGoogleSocialLoginResponse', () => {
    test('정상 인증 응답을 authenticated outcome 으로 매핑한다.', () => {
      const envelope = {
        success: true,
        user: { id: 100, email: 'a@example.com', role: 'CLIENT' },
        accessToken: 'jwt-access',
        refreshToken: 'jwt-refresh',
        sessionId: 'sess-1'
      };
      const outcome = mapGoogleSocialLoginResponse(envelope, 'g-access', null);
      expect(outcome.kind).toBe('authenticated');
      expect(outcome.user).toEqual(envelope.user);
      expect(outcome.accessToken).toBe('jwt-access');
      expect(outcome.refreshToken).toBe('jwt-refresh');
      expect(outcome.sessionId).toBe('sess-1');
    });

    test('requiresOAuthPhoneVerification + phoneVerificationToken 응답을 OTP outcome 으로 매핑한다.', () => {
      const envelope = {
        success: true,
        requiresOAuthPhoneVerification: true,
        phoneVerificationToken: 'phone-token-1',
        tenantId: 'tenant-A',
        socialUserInfo: {
          email: 'b@example.com',
          nickname: '닉',
          name: '홍길동',
          socialId: 'sub-1234'
        }
      };
      const outcome = mapGoogleSocialLoginResponse(envelope, null, 'id-token-x');
      expect(outcome.kind).toBe('requiresOAuthPhoneVerification');
      expect(outcome.phoneVerificationToken).toBe('phone-token-1');
      expect(outcome.tenantId).toBe('tenant-A');
      expect(outcome.socialUserInfo.providerUserId).toBe('sub-1234');
      expect(outcome.socialUserInfo.email).toBe('b@example.com');
    });

    test('requiresPhoneAccountSelection + selectionToken 응답을 계정 선택 outcome 으로 매핑한다.', () => {
      const envelope = {
        requiresPhoneAccountSelection: true,
        selectionToken: 'sel-1',
        tenantId: 'tenant-B',
        message: '동일 전화 다계정'
      };
      const outcome = mapGoogleSocialLoginResponse(envelope);
      expect(outcome.kind).toBe('requiresPhoneAccountSelection');
      expect(outcome.selectionToken).toBe('sel-1');
      expect(outcome.tenantId).toBe('tenant-B');
    });

    test('requiresSignup 응답을 가입 분기 outcome 으로 매핑한다.', () => {
      const envelope = {
        requiresSignup: true,
        socialUserInfo: {
          provider: 'GOOGLE',
          email: 'new@example.com',
          nickname: '신규',
          socialId: 'sub-9999'
        },
        message: '회원가입 필요'
      };
      const outcome = mapGoogleSocialLoginResponse(envelope, 'g-access', null);
      expect(outcome.kind).toBe('requiresSignup');
      expect(outcome.socialUserInfo.providerUserId).toBe('sub-9999');
      expect(outcome.socialUserInfo.email).toBe('new@example.com');
      expect(outcome.rawAccessToken).toBe('g-access');
    });

    test('빈 응답이면 error 로 매핑한다.', () => {
      expect(mapGoogleSocialLoginResponse(null).kind).toBe('error');
      expect(mapGoogleSocialLoginResponse({}).kind).toBe('error');
    });

    test('success=false 인 평문 메시지 응답을 error 로 매핑한다.', () => {
      const outcome = mapGoogleSocialLoginResponse({
        success: false,
        message: '내부 오류'
      });
      expect(outcome.kind).toBe('error');
      expect(outcome.message).toBe('내부 오류');
    });
  });

  describe('requestGoogleSocialLogin', () => {
    test('두 토큰이 모두 비어 있으면 BE 호출 없이 즉시 error 반환.', async() => {
      const outcome = await requestGoogleSocialLogin({});
      expect(outcome.kind).toBe('error');
      expect(StandardizedApi.post).not.toHaveBeenCalled();
    });

    test('accessToken 만 보유 시 BE 에 accessToken 만 전송한다.', async() => {
      StandardizedApi.post.mockResolvedValueOnce({
        success: true,
        user: { id: 1, email: 'x@example.com', role: 'CLIENT' },
        accessToken: 'jwt'
      });
      const outcome = await requestGoogleSocialLogin({ accessToken: 'g-access' });
      expect(StandardizedApi.post).toHaveBeenCalledTimes(1);
      const [, body, options] = StandardizedApi.post.mock.calls[0];
      expect(body).toEqual({ provider: 'GOOGLE', accessToken: 'g-access' });
      expect(options).toEqual({ unwrapApiEnvelope: false });
      expect(outcome.kind).toBe('authenticated');
    });

    test('idToken 만 보유 시 BE 에 idToken 만 전송한다(P0 폴백 흐름).', async() => {
      StandardizedApi.post.mockResolvedValueOnce({
        requiresOAuthPhoneVerification: true,
        phoneVerificationToken: 'phone-1'
      });
      const outcome = await requestGoogleSocialLogin({ idToken: 'g-id' });
      const [, body] = StandardizedApi.post.mock.calls[0];
      expect(body).toEqual({ provider: 'GOOGLE', idToken: 'g-id' });
      expect(outcome.kind).toBe('requiresOAuthPhoneVerification');
    });

    test('두 토큰 모두 보유 시 BE 에 함께 전송한다.', async() => {
      StandardizedApi.post.mockResolvedValueOnce({
        requiresSignup: true,
        socialUserInfo: { socialId: 'sub-1', email: 'n@example.com' }
      });
      await requestGoogleSocialLogin({ accessToken: 'g-access', idToken: 'g-id' });
      const [, body] = StandardizedApi.post.mock.calls[0];
      expect(body).toEqual({
        provider: 'GOOGLE',
        accessToken: 'g-access',
        idToken: 'g-id'
      });
    });

    test('StandardizedApi 가 throw 하면 error outcome 으로 변환한다.', async() => {
      StandardizedApi.post.mockRejectedValueOnce(new Error('네트워크 오류'));
      const outcome = await requestGoogleSocialLogin({ accessToken: 'g-access' });
      expect(outcome.kind).toBe('error');
      expect(outcome.message).toBe('네트워크 오류');
    });
  });
});
