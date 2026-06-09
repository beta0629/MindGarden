/**
 * provider-agnostic OAuth 휴대폰 매칭 — BE API 클라이언트 단위 테스트.
 *
 * <p>검증 범위:
 *  - 필수 파라미터 누락 시 호출 전 throw
 *  - `apiPost` 호출 시 endpoint·body 정확성
 *  - `ApiResponse<T>` 래퍼 / 평탄 본문 양쪽 모두 unwrap
 * </p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */
import {
  postOAuthSendPhoneOtp,
  postOAuthVerifyPhoneOtp,
  type OAuthPhoneSendRequest,
  type OAuthPhoneVerifyRequest,
} from '../oauthAuth';
import { AUTH_API } from '../../endpoints';
jest.mock('../../client', () => ({
  __esModule: true,
  apiPost: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const client = require('../../client');

describe('postOAuthSendPhoneOtp — /api/v1/auth/oauth/phone/send', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('필수 파라미터(oauthProvider) 누락 시 throw', async () => {
    const req = {
      phoneVerificationToken: 'pvt-1',
      phone: '01012345678',
    } as unknown as OAuthPhoneSendRequest;

    await expect(postOAuthSendPhoneOtp(req)).rejects.toThrow(/oauthProvider/);
    expect(client.apiPost).not.toHaveBeenCalled();
  });

  test('필수 파라미터(phoneVerificationToken) 누락 시 throw', async () => {
    await expect(
      postOAuthSendPhoneOtp({
        oauthProvider: 'NAVER',
        phoneVerificationToken: '',
        phone: '01012345678',
      }),
    ).rejects.toThrow(/phoneVerificationToken/);
    expect(client.apiPost).not.toHaveBeenCalled();
  });

  test('필수 파라미터(phone) 누락 시 throw', async () => {
    await expect(
      postOAuthSendPhoneOtp({
        oauthProvider: 'NAVER',
        phoneVerificationToken: 'pvt-1',
        phone: '',
      }),
    ).rejects.toThrow(/phone/);
    expect(client.apiPost).not.toHaveBeenCalled();
  });

  test('정상 호출: 올바른 endpoint·body 로 apiPost 호출 + ApiResponse<T> 래퍼 unwrap', async () => {
    client.apiPost.mockResolvedValueOnce({
      success: true,
      message: 'ok',
      data: {
        success: true,
        challengeToken: 'ch-001',
        expiresInSeconds: 180,
        resendCooldownSeconds: 60,
        maskedPhone: '010-****-5678',
      },
    });

    const result = await postOAuthSendPhoneOtp({
      oauthProvider: 'NAVER',
      phoneVerificationToken: 'pvt-1',
      phone: '01012345678',
    });

    expect(client.apiPost).toHaveBeenCalledWith(AUTH_API.OAUTH_PHONE_SEND, {
      oauthProvider: 'NAVER',
      phoneVerificationToken: 'pvt-1',
      phone: '01012345678',
    });
    expect(result.challengeToken).toBe('ch-001');
    expect(result.maskedPhone).toBe('010-****-5678');
  });

  test('평탄 본문(ApiResponse 래퍼 없음) 도 그대로 통과', async () => {
    client.apiPost.mockResolvedValueOnce({
      success: false,
      message: '쿨다운',
      retryAfterSeconds: 30,
      code: 'RESEND_COOLDOWN',
    });

    const result = await postOAuthSendPhoneOtp({
      oauthProvider: 'KAKAO',
      phoneVerificationToken: 'pvt-2',
      phone: '01012345678',
    });

    expect(result.success).toBe(false);
    expect(result.retryAfterSeconds).toBe(30);
    expect(result.code).toBe('RESEND_COOLDOWN');
  });
});

describe('postOAuthVerifyPhoneOtp — /api/v1/auth/oauth/phone/verify', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('필수 파라미터(challengeToken) 누락 시 throw', async () => {
    await expect(
      postOAuthVerifyPhoneOtp({
        oauthProvider: 'NAVER',
        phoneVerificationToken: 'pvt-1',
        challengeToken: '',
        otpCode: '123456',
      }),
    ).rejects.toThrow(/challengeToken/);
    expect(client.apiPost).not.toHaveBeenCalled();
  });

  test('필수 파라미터(otpCode) 누락 시 throw', async () => {
    await expect(
      postOAuthVerifyPhoneOtp({
        oauthProvider: 'NAVER',
        phoneVerificationToken: 'pvt-1',
        challengeToken: 'ch-1',
        otpCode: '',
      }),
    ).rejects.toThrow(/otpCode/);
    expect(client.apiPost).not.toHaveBeenCalled();
  });

  test('정상 호출: ApiResponse 래퍼 unwrap 후 matchedAccount 반환', async () => {
    client.apiPost.mockResolvedValueOnce({
      success: true,
      data: {
        success: true,
        accessToken: 'at-1',
        refreshToken: 'rt-1',
        matchedAccount: { userId: 99, tenantId: 'tenant-a', role: 'CLIENT' },
      },
    });

    const result = await postOAuthVerifyPhoneOtp({
      oauthProvider: 'NAVER',
      phoneVerificationToken: 'pvt-1',
      challengeToken: 'ch-1',
      otpCode: '123456',
    } as OAuthPhoneVerifyRequest);

    expect(client.apiPost).toHaveBeenCalledWith(AUTH_API.OAUTH_PHONE_VERIFY, {
      oauthProvider: 'NAVER',
      phoneVerificationToken: 'pvt-1',
      challengeToken: 'ch-1',
      otpCode: '123456',
    });
    expect(result.accessToken).toBe('at-1');
    expect(result.matchedAccount?.userId).toBe(99);
  });

  test('다중 매칭 응답도 unwrap 통과', async () => {
    client.apiPost.mockResolvedValueOnce({
      success: true,
      data: {
        success: true,
        requiresPhoneAccountSelection: true,
        phoneAccountSelectionToken: 'sel-1',
      },
    });

    const result = await postOAuthVerifyPhoneOtp({
      oauthProvider: 'GOOGLE',
      phoneVerificationToken: 'pvt-1',
      challengeToken: 'ch-1',
      otpCode: '123456',
    });

    expect(result.requiresPhoneAccountSelection).toBe(true);
    expect(result.phoneAccountSelectionToken).toBe('sel-1');
  });
});
