/**
 * provider-agnostic OAuth 휴대폰 매칭 — 응답 매핑 helper 단위 테스트.
 *
 * <p>14 상태 중 매퍼 책임 분기:
 *  - send: sent(정상) / cooldown(retryAfter or RESEND_COOLDOWN code) / error(나머지)
 *  - verify: authenticated(단일매칭) / requiresPhoneAccountSelection / error(코드 포함)
 * </p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */
import type { OAuthPhoneSendResponse, OAuthPhoneVerifyResponse } from '@/api/auth/oauthAuth';
import {
  mapOAuthPhoneSendResponse,
  mapOAuthPhoneVerifyResponse,
} from '../oauthPhoneVerificationMapper';

describe('mapOAuthPhoneSendResponse — /phone/send 응답 매핑', () => {
  test('정상 발송: success=true + challengeToken → kind=sent (메타 포함)', () => {
    const response: OAuthPhoneSendResponse = {
      success: true,
      message: '인증번호를 발송했습니다.',
      challengeToken: 'ch-token-001',
      expiresInSeconds: 180,
      resendCooldownSeconds: 60,
      maskedPhone: '010-****-5678',
    };

    const result = mapOAuthPhoneSendResponse(response);

    expect(result.kind).toBe('sent');
    if (result.kind !== 'sent') return;
    expect(result.challengeToken).toBe('ch-token-001');
    expect(result.expiresInSeconds).toBe(180);
    expect(result.resendCooldownSeconds).toBe(60);
    expect(result.maskedPhone).toBe('010-****-5678');
  });

  test('쿨다운: success=false + retryAfterSeconds>0 → kind=cooldown', () => {
    const response: OAuthPhoneSendResponse = {
      success: false,
      message: '1분 후에 다시 시도해 주세요.',
      retryAfterSeconds: 47,
      code: 'RESEND_COOLDOWN',
    };

    const result = mapOAuthPhoneSendResponse(response);

    expect(result.kind).toBe('cooldown');
    if (result.kind !== 'cooldown') return;
    expect(result.retryAfterSeconds).toBe(47);
    expect(result.message).toBe('1분 후에 다시 시도해 주세요.');
    expect(result.code).toBe('RESEND_COOLDOWN');
  });

  test('쿨다운(RESEND_COOLDOWN code만): retryAfterSeconds 없이 코드로 분기', () => {
    const response: OAuthPhoneSendResponse = {
      success: false,
      message: '잠시 후 다시 시도해 주세요.',
      code: 'RESEND_COOLDOWN',
    };

    const result = mapOAuthPhoneSendResponse(response);

    expect(result.kind).toBe('cooldown');
    if (result.kind !== 'cooldown') return;
    expect(result.code).toBe('RESEND_COOLDOWN');
  });

  test('일 한도 초과: code=DAILY_LIMIT_EXCEEDED → kind=error (재발송 영구 비활성용 코드 보존)', () => {
    const response: OAuthPhoneSendResponse = {
      success: false,
      message: '오늘 인증 시도 횟수를 초과했습니다.',
      code: 'DAILY_LIMIT_EXCEEDED',
    };

    const result = mapOAuthPhoneSendResponse(response);

    expect(result.kind).toBe('error');
    if (result.kind !== 'error') return;
    expect(result.message).toMatch(/한도|초과/);
    expect(result.code).toBe('DAILY_LIMIT_EXCEEDED');
  });

  test('TOKEN_EXPIRED: code 보존하여 화면이 로그인 복귀 분기 가능', () => {
    const response: OAuthPhoneSendResponse = {
      success: false,
      message: '인증 세션이 만료되었습니다.',
      code: 'TOKEN_EXPIRED',
    };

    const result = mapOAuthPhoneSendResponse(response);

    expect(result.kind).toBe('error');
    if (result.kind !== 'error') return;
    expect(result.code).toBe('TOKEN_EXPIRED');
  });

  test('응답 undefined → kind=error + 서버 응답 없음 메시지', () => {
    const result = mapOAuthPhoneSendResponse(undefined);

    expect(result.kind).toBe('error');
    if (result.kind !== 'error') return;
    expect(result.message).toBe('서버 응답이 없습니다.');
  });

  test('success=true 인데 challengeToken 누락 → 안전하게 error fallback', () => {
    const response: OAuthPhoneSendResponse = {
      success: true,
      message: '인증번호를 발송했습니다.',
    };

    const result = mapOAuthPhoneSendResponse(response);

    expect(result.kind).toBe('error');
  });
});

describe('mapOAuthPhoneVerifyResponse — /phone/verify 응답 매핑', () => {
  test('단일 매칭 정상 로그인: matchedAccount + accessToken/refreshToken → kind=authenticated', () => {
    const response: OAuthPhoneVerifyResponse = {
      success: true,
      accessToken: 'at-001',
      refreshToken: 'rt-001',
      matchedAccount: {
        userId: 42,
        tenantId: 'tenant-a',
        role: 'CLIENT',
      },
    };

    const result = mapOAuthPhoneVerifyResponse(response, 'NAVER');

    expect(result.kind).toBe('authenticated');
    if (result.kind !== 'authenticated') return;
    expect(result.accessToken).toBe('at-001');
    expect(result.refreshToken).toBe('rt-001');
    expect(result.matchedAccount.userId).toBe(42);
    expect(result.matchedAccount.tenantId).toBe('tenant-a');
    expect(result.matchedAccount.role).toBe('CLIENT');
    expect(result.matchedAccount.name).toBeUndefined();
    expect(result.matchedAccount.email).toBeUndefined();
    expect(result.matchedAccount.phone).toBeUndefined();
    expect(result.matchedAccount.profileImageUrl).toBeUndefined();
  });

  test('[P1] 단일 매칭 정상 로그인 — BE 가 user 표시 필드 동봉 → matchedAccount 에 모두 전파', () => {
    const response: OAuthPhoneVerifyResponse = {
      success: true,
      accessToken: 'at-002',
      refreshToken: 'rt-002',
      matchedAccount: {
        userId: 77,
        tenantId: 'tenant-incheon-counseling-001',
        role: 'CLIENT',
        name: '홍길동',
        email: 'gildong@example.com',
        nickname: '길동',
        phone: '01012345678',
        profileImageUrl: 'https://lh3.googleusercontent.com/a-/picture',
      },
    };

    const result = mapOAuthPhoneVerifyResponse(response, 'GOOGLE');

    expect(result.kind).toBe('authenticated');
    if (result.kind !== 'authenticated') return;
    expect(result.matchedAccount.name).toBe('홍길동');
    expect(result.matchedAccount.email).toBe('gildong@example.com');
    expect(result.matchedAccount.nickname).toBe('길동');
    expect(result.matchedAccount.phone).toBe('01012345678');
    expect(result.matchedAccount.profileImageUrl).toBe(
      'https://lh3.googleusercontent.com/a-/picture',
    );
  });

  test('다중 매칭: requiresPhoneAccountSelection=true + phoneAccountSelectionToken → 후보 선택 분기', () => {
    const response: OAuthPhoneVerifyResponse = {
      success: true,
      requiresPhoneAccountSelection: true,
      phoneAccountSelectionToken: 'sel-token-001',
      message: '같은 휴대폰 번호로 가입된 계정이 여러 개 있습니다.',
    };

    const result = mapOAuthPhoneVerifyResponse(response, 'KAKAO');

    expect(result.kind).toBe('requiresPhoneAccountSelection');
    if (result.kind !== 'requiresPhoneAccountSelection') return;
    expect(result.selectionToken).toBe('sel-token-001');
    expect(result.provider).toBe('KAKAO');
    expect(result.message).toMatch(/여러 개/);
  });

  test('실패: success=false + code=OTP_INVALID → kind=error + code 보존', () => {
    const response: OAuthPhoneVerifyResponse = {
      success: false,
      code: 'OTP_INVALID',
      message: '인증번호가 일치하지 않습니다.',
    };

    const result = mapOAuthPhoneVerifyResponse(response, 'NAVER');

    expect(result.kind).toBe('error');
    if (result.kind !== 'error') return;
    expect(result.message).toMatch(/일치하지 않습니다/);
    expect(result.code).toBe('OTP_INVALID');
  });

  test('실패: code=OTP_EXPIRED → 화면에서 만료 분기 가능하도록 code 보존', () => {
    const response: OAuthPhoneVerifyResponse = {
      success: false,
      code: 'OTP_EXPIRED',
      message: '인증번호가 만료되었습니다.',
    };

    const result = mapOAuthPhoneVerifyResponse(response, 'GOOGLE');

    expect(result.kind).toBe('error');
    if (result.kind !== 'error') return;
    expect(result.code).toBe('OTP_EXPIRED');
  });

  test('응답 undefined → kind=error', () => {
    const result = mapOAuthPhoneVerifyResponse(undefined, 'APPLE');

    expect(result.kind).toBe('error');
    if (result.kind !== 'error') return;
    expect(result.message).toBe('서버 응답이 없습니다.');
  });

  test('success=true 인데 matchedAccount 없음 → 안전하게 error fallback', () => {
    const response: OAuthPhoneVerifyResponse = {
      success: true,
      accessToken: 'at-x',
      refreshToken: 'rt-x',
    };

    const result = mapOAuthPhoneVerifyResponse(response, 'NAVER');

    expect(result.kind).toBe('error');
  });
});
