/**
 * Apple SIWA 휴대폰 매칭 — 응답 매핑 helper 단위 테스트.
 *
 * <p>AS1 (requiresPhoneVerification 분기), AS4 (정상 로그인 분기), AS5 (account selection 분기),
 * AS6 (실패 분기), AS7 (apple_sub 즉시 로그인 회귀) 를 본 모듈에서 검증한다.
 * AS2/AS3 (sendOtp 응답) 도 별도 describe 로 검증한다.</p>
 */

import type { AppleAuthLoginResponse, ApplePhoneSendResponse } from '@/api/auth/appleAuth';
import {
  mapAppleLoginResponseRaw,
  mapApplePhoneSendResponse,
} from '../applePhoneVerificationMapper';

describe('mapAppleLoginResponseRaw — Apple SIWA login/verify 응답 매핑', () => {
  test('AS1: requiresPhoneVerification=true + phoneVerificationToken → kind=requiresApplePhoneVerification', () => {
    const response: AppleAuthLoginResponse = {
      success: true,
      requiresPhoneVerification: true,
      phoneVerificationToken: 'pvt-token-xyz',
      socialUserInfo: {
        provider: 'APPLE',
        providerUserId: 'apple-sub-001',
        email: 'user@privaterelay.appleid.com',
        name: '홍 길동',
        isPrivateRelay: true,
      },
    };

    const result = mapAppleLoginResponseRaw(response, {
      user: 'apple-sub-native-fallback',
      email: 'native@example.com',
      givenName: '길동',
      familyName: '홍',
    });

    expect(result.kind).toBe('requiresApplePhoneVerification');
    if (result.kind !== 'requiresApplePhoneVerification') return;
    expect(result.phoneVerificationToken).toBe('pvt-token-xyz');
    expect(result.socialUserInfo).toEqual({
      providerUserId: 'apple-sub-001',
      email: 'user@privaterelay.appleid.com',
      name: '홍 길동',
      isPrivateRelay: true,
    });
  });

  test('AS1-b: requiresPhoneVerification=true + socialUserInfo 누락 시 native prefill 폴백', () => {
    const response: AppleAuthLoginResponse = {
      success: true,
      requiresPhoneVerification: true,
      phoneVerificationToken: 'pvt-2',
    };

    const result = mapAppleLoginResponseRaw(response, {
      user: 'apple-sub-fallback',
      email: 'native@example.com',
      givenName: '서연',
      familyName: '김',
    });

    expect(result.kind).toBe('requiresApplePhoneVerification');
    if (result.kind !== 'requiresApplePhoneVerification') return;
    expect(result.socialUserInfo.providerUserId).toBe('apple-sub-fallback');
    expect(result.socialUserInfo.email).toBe('native@example.com');
    expect(result.socialUserInfo.name).toBe('서연 김');
    expect(result.socialUserInfo.isPrivateRelay).toBe(false);
  });

  test('AS4: 정상 로그인 — accessToken/refreshToken/user 모두 있을 때 kind=authenticated', () => {
    const response: AppleAuthLoginResponse = {
      success: true,
      accessToken: 'at-1',
      refreshToken: 'rt-1',
      user: {
        id: 42,
        email: 'authed@example.com',
        name: '인증 사용자',
        nickname: 'authed',
        role: 'CLIENT',
        tenantId: 'tenant-a',
      },
    };

    const result = mapAppleLoginResponseRaw(response);

    expect(result.kind).toBe('authenticated');
    if (result.kind !== 'authenticated') return;
    expect(result.accessToken).toBe('at-1');
    expect(result.refreshToken).toBe('rt-1');
    expect(result.apiUser.id).toBe(42);
    expect(result.apiUser.email).toBe('authed@example.com');
    expect(result.apiUser.role).toBe('CLIENT');
  });

  test('AS5: requiresPhoneAccountSelection + phoneAccountSelectionToken → 후보 선택 분기', () => {
    const response: AppleAuthLoginResponse = {
      success: true,
      requiresPhoneAccountSelection: true,
      phoneAccountSelectionToken: 'sel-token-xyz',
      message: '같은 휴대폰 번호로 가입된 계정이 여러 개 있습니다.',
    };

    const result = mapAppleLoginResponseRaw(response);

    expect(result.kind).toBe('requiresPhoneAccountSelection');
    if (result.kind !== 'requiresPhoneAccountSelection') return;
    expect(result.selectionToken).toBe('sel-token-xyz');
    expect(result.message).toBe('같은 휴대폰 번호로 가입된 계정이 여러 개 있습니다.');
  });

  test('AS6: success=false + message 만 있을 때 kind=error (시도 초과 등)', () => {
    const response: AppleAuthLoginResponse = {
      success: false,
      message: '인증 시도 횟수를 초과했습니다. 잠시 후 다시 시도해 주세요.',
    };

    const result = mapAppleLoginResponseRaw(response);

    expect(result.kind).toBe('error');
    if (result.kind !== 'error') return;
    expect(result.message).toBe('인증 시도 횟수를 초과했습니다. 잠시 후 다시 시도해 주세요.');
  });

  test('AS6-b: success=true 이지만 token/user 모두 없으면 fallback 에러 메시지', () => {
    const response: AppleAuthLoginResponse = { success: true };

    const result = mapAppleLoginResponseRaw(response);

    expect(result.kind).toBe('error');
    if (result.kind !== 'error') return;
    expect(result.message).toBe('Apple 로그인에 실패했습니다.');
  });

  test('AS7: apple_sub 기존 매칭 사용자 — phoneVerification 없이 즉시 로그인 (회귀)', () => {
    // requiresPhoneVerification 이 없거나 false 인 경우, 즉시 로그인 분기로 가야 한다.
    const response: AppleAuthLoginResponse = {
      success: true,
      requiresPhoneVerification: false,
      accessToken: 'at-existing',
      refreshToken: 'rt-existing',
      user: {
        id: 7,
        email: 'existing@example.com',
        name: '기존 사용자',
        nickname: 'old',
        role: 'CONSULTANT',
      },
    };

    const result = mapAppleLoginResponseRaw(response);

    expect(result.kind).toBe('authenticated');
    if (result.kind !== 'authenticated') return;
    expect(result.apiUser.email).toBe('existing@example.com');
    expect(result.apiUser.role).toBe('CONSULTANT');
  });

  test('AS6-c: deprecated requiresSignup=true 단독 신호는 안내 메시지로 묶어 error 처리', () => {
    const response: AppleAuthLoginResponse = {
      success: true,
      requiresSignup: true,
    };

    const result = mapAppleLoginResponseRaw(response);

    expect(result.kind).toBe('error');
    if (result.kind !== 'error') return;
    expect(result.message).toMatch(/Apple 계정 정보가 부족/);
  });
});

describe('mapApplePhoneSendResponse — OTP 발송 응답 매핑', () => {
  test('AS2: 정상 발송 — success=true + otpChallengeToken → kind=sent', () => {
    const response: ApplePhoneSendResponse = {
      success: true,
      otpChallengeToken: 'oct-token-xyz',
      expiresInSeconds: 180,
    };

    const result = mapApplePhoneSendResponse(response);

    expect(result.kind).toBe('sent');
    if (result.kind !== 'sent') return;
    expect(result.otpChallengeToken).toBe('oct-token-xyz');
    expect(result.expiresInSeconds).toBe(180);
  });

  test('AS3: 1분 쿨다운 위반 — success=false + retryAfterSeconds → kind=cooldown', () => {
    const response: ApplePhoneSendResponse = {
      success: false,
      message: '1분 후에 다시 시도해 주세요.',
      retryAfterSeconds: 47,
    };

    const result = mapApplePhoneSendResponse(response);

    expect(result.kind).toBe('cooldown');
    if (result.kind !== 'cooldown') return;
    expect(result.retryAfterSeconds).toBe(47);
    expect(result.message).toBe('1분 후에 다시 시도해 주세요.');
  });

  test('AS3-b: 일 5회 한도 초과 — retryAfterSeconds 없이 success=false → kind=error', () => {
    const response: ApplePhoneSendResponse = {
      success: false,
      message: '오늘 인증번호 발송 한도(5회)를 초과했습니다.',
    };

    const result = mapApplePhoneSendResponse(response);

    expect(result.kind).toBe('error');
    if (result.kind !== 'error') return;
    expect(result.message).toBe('오늘 인증번호 발송 한도(5회)를 초과했습니다.');
  });

  test('응답 undefined — kind=error + 서버 응답 없음 메시지', () => {
    const result = mapApplePhoneSendResponse(undefined);

    expect(result.kind).toBe('error');
    if (result.kind !== 'error') return;
    expect(result.message).toBe('서버 응답이 없습니다.');
  });
});
