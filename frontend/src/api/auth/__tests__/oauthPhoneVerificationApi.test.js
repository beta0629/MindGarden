/**
 * oauthPhoneVerificationApi — StandardizedApi 호출 mock 단위 테스트.
 *
 * Phase 3C — `docs/design-system/OAUTH_PHONE_VERIFICATION_UX_SPEC.md`
 *
 * @author MindGarden
 * @since 2026-06-09
 */

import StandardizedApi from '../../../utils/standardizedApi';
import {
  sendOAuthPhoneOtp,
  verifyOAuthPhoneOtp,
  mapOAuthPhoneSendResponse,
  mapOAuthPhoneVerifyResponse
} from '../oauthPhoneVerificationApi';

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn()
  }
}));

describe('oauthPhoneVerificationApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendOAuthPhoneOtp — 입력 검증', () => {
    test.each([
      [{}, /oauthProvider/],
      [{ oauthProvider: 'NAVER' }, /phoneVerificationToken/],
      [{ oauthProvider: 'NAVER', phoneVerificationToken: 't' }, /phone/]
    ])('필수 인자 누락 시 즉시 에러 (%#)', async (payload, pattern) => {
      await expect(sendOAuthPhoneOtp(payload)).rejects.toThrow(pattern);
      expect(StandardizedApi.post).not.toHaveBeenCalled();
    });

    test('provider 는 대문자 정규화 후 전송', async () => {
      StandardizedApi.post.mockResolvedValueOnce({
        success: true,
        challengeToken: 'c1',
        expiresInSeconds: 180,
        maskedPhone: '010-****-5678'
      });
      await sendOAuthPhoneOtp({
        oauthProvider: 'naver',
        phoneVerificationToken: 't1',
        phone: '01012345678'
      });
      expect(StandardizedApi.post).toHaveBeenCalledWith('/api/v1/auth/oauth/phone/send', {
        oauthProvider: 'NAVER',
        phoneVerificationToken: 't1',
        phone: '01012345678'
      });
    });

    test('ApiResponse 봉투를 풀어서 평탄화된 객체 반환', async () => {
      StandardizedApi.post.mockResolvedValueOnce({
        success: true,
        data: { success: true, challengeToken: 'c1', expiresInSeconds: 300 }
      });
      const result = await sendOAuthPhoneOtp({
        oauthProvider: 'KAKAO',
        phoneVerificationToken: 't',
        phone: '01099998888'
      });
      expect(result.success).toBe(true);
      expect(result.challengeToken).toBe('c1');
      expect(result.expiresInSeconds).toBe(300);
    });
  });

  describe('verifyOAuthPhoneOtp — 입력 검증', () => {
    test.each([
      [{}, /oauthProvider/],
      [{ oauthProvider: 'NAVER' }, /phoneVerificationToken/],
      [{ oauthProvider: 'NAVER', phoneVerificationToken: 't' }, /challengeToken/],
      [
        { oauthProvider: 'NAVER', phoneVerificationToken: 't', challengeToken: 'c' },
        /otpCode/
      ]
    ])('필수 인자 누락 시 즉시 에러 (%#)', async (payload, pattern) => {
      await expect(verifyOAuthPhoneOtp(payload)).rejects.toThrow(pattern);
      expect(StandardizedApi.post).not.toHaveBeenCalled();
    });

    test('정상 호출 시 payload 그대로 전송', async () => {
      StandardizedApi.post.mockResolvedValueOnce({
        success: true,
        accessToken: 'a',
        refreshToken: 'r',
        matchedAccount: { userId: 1, tenantId: 'tA', role: 'CLIENT' }
      });
      await verifyOAuthPhoneOtp({
        oauthProvider: 'naver',
        phoneVerificationToken: 't',
        challengeToken: 'c',
        otpCode: '123456'
      });
      expect(StandardizedApi.post).toHaveBeenCalledWith(
        '/api/v1/auth/oauth/phone/verify',
        expect.objectContaining({
          oauthProvider: 'NAVER',
          phoneVerificationToken: 't',
          challengeToken: 'c',
          otpCode: '123456'
        })
      );
    });
  });

  describe('mapOAuthPhoneSendResponse', () => {
    test('정상 발송 → kind=sent', () => {
      const r = mapOAuthPhoneSendResponse({
        success: true,
        challengeToken: 'c1',
        expiresInSeconds: 300,
        resendCooldownSeconds: 60,
        maskedPhone: '010-****-5678'
      });
      expect(r).toEqual({
        kind: 'sent',
        challengeToken: 'c1',
        expiresInSeconds: 300,
        resendCooldownSeconds: 60,
        maskedPhone: '010-****-5678'
      });
    });

    test('RESEND_COOLDOWN 코드 → kind=cooldown', () => {
      const r = mapOAuthPhoneSendResponse({
        success: false,
        code: 'RESEND_COOLDOWN',
        retryAfterSeconds: 30,
        maskedPhone: '010-****-5678'
      });
      expect(r.kind).toBe('cooldown');
      expect(r.retryAfterSeconds).toBe(30);
    });

    test('retryAfterSeconds 양수만 있어도 cooldown', () => {
      const r = mapOAuthPhoneSendResponse({
        success: false,
        retryAfterSeconds: 15
      });
      expect(r.kind).toBe('cooldown');
      expect(r.retryAfterSeconds).toBe(15);
    });

    test('실패 코드 → kind=error', () => {
      const r = mapOAuthPhoneSendResponse({
        success: false,
        code: 'DAILY_LIMIT_EXCEEDED',
        message: '오늘 한도 초과'
      });
      expect(r.kind).toBe('error');
      expect(r.code).toBe('DAILY_LIMIT_EXCEEDED');
      expect(r.message).toBe('오늘 한도 초과');
    });

    test('null/undefined 응답 → kind=error', () => {
      expect(mapOAuthPhoneSendResponse(null).kind).toBe('error');
      expect(mapOAuthPhoneSendResponse(undefined).kind).toBe('error');
    });
  });

  describe('mapOAuthPhoneVerifyResponse', () => {
    test('단일 매칭 → kind=authenticated', () => {
      const r = mapOAuthPhoneVerifyResponse({
        success: true,
        accessToken: 'a',
        refreshToken: 'r',
        matchedAccount: { userId: 1, tenantId: 'tA', role: 'CLIENT' }
      });
      expect(r.kind).toBe('authenticated');
      expect(r.accessToken).toBe('a');
      expect(r.matchedAccount).toEqual({ userId: 1, tenantId: 'tA', role: 'CLIENT' });
    });

    test('다중 매칭 → kind=requiresPhoneAccountSelection', () => {
      const r = mapOAuthPhoneVerifyResponse({
        success: true,
        requiresPhoneAccountSelection: true,
        phoneAccountSelectionToken: 'sel1'
      });
      expect(r.kind).toBe('requiresPhoneAccountSelection');
      expect(r.phoneAccountSelectionToken).toBe('sel1');
    });

    test('실패 → kind=error', () => {
      const r = mapOAuthPhoneVerifyResponse({
        success: false,
        code: 'OTP_INVALID',
        message: '인증번호 불일치'
      });
      expect(r.kind).toBe('error');
      expect(r.code).toBe('OTP_INVALID');
    });

    test('null 응답 → kind=error', () => {
      expect(mapOAuthPhoneVerifyResponse(null).kind).toBe('error');
    });
  });
});
