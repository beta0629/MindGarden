/**
 * Apple SIWA 휴대폰 매칭 — BE 응답 → 클라이언트 outcome 매핑 (순수 함수).
 *
 * <p>{@code AuthService.ts} 에서 사용하는 매핑 로직을 분리하여 단위 테스트 가능하게 한다.
 * `applyAuthenticatedUser` 등 사이드 이펙트는 AuthService 본체에 남기고, 본 모듈은 응답
 * 파싱·outcome 빌더만 담당한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-08
 */
import type { AppleAuthLoginResponse, ApplePhoneSendResponse } from '@/api/auth/appleAuth';

/** Native 시트가 반환한 prefill 정보 — phone 입력 화면 전 단계용 */
export interface AppleNativePrefill {
  user?: string;
  email?: string | null;
  givenName?: string | null;
  familyName?: string | null;
}

export interface AppleUserPayload {
  id: number;
  email: string;
  name: string;
  nickname: string;
  role: unknown;
  profileImageUrl?: string;
  tenantId?: string;
}

export type AppleLoginMapped =
  | {
      kind: 'requiresApplePhoneVerification';
      phoneVerificationToken: string;
      socialUserInfo: {
        providerUserId: string;
        email: string;
        name: string;
        isPrivateRelay: boolean;
      };
    }
  | {
      kind: 'requiresPhoneAccountSelection';
      selectionToken: string;
      message?: string;
    }
  | {
      kind: 'authenticated';
      apiUser: AppleUserPayload;
      accessToken: string;
      refreshToken: string;
    }
  | { kind: 'error'; message: string };

/**
 * Apple SIWA `/login` 또는 `/phone/verify` 응답을 클라이언트 outcome 으로 매핑한다.
 */
export function mapAppleLoginResponseRaw(
  response: AppleAuthLoginResponse,
  native?: AppleNativePrefill | null,
): AppleLoginMapped {
  if (response.requiresPhoneVerification && response.phoneVerificationToken) {
    const social = response.socialUserInfo;
    const providerUserId =
      (social?.providerUserId && String(social.providerUserId)) || native?.user || '';
    const fallbackName = [native?.givenName ?? '', native?.familyName ?? '']
      .filter((s) => s && s.trim())
      .join(' ')
      .trim();
    return {
      kind: 'requiresApplePhoneVerification',
      phoneVerificationToken: response.phoneVerificationToken,
      socialUserInfo: {
        providerUserId,
        email: (social?.email ?? native?.email ?? '').trim(),
        name: (social?.name ?? fallbackName ?? '').trim(),
        isPrivateRelay: Boolean(social?.isPrivateRelay),
      },
    };
  }

  if (response.requiresPhoneAccountSelection && response.phoneAccountSelectionToken) {
    return {
      kind: 'requiresPhoneAccountSelection',
      selectionToken: response.phoneAccountSelectionToken,
      message: response.message,
    };
  }

  if (response.success && response.user && response.accessToken && response.refreshToken) {
    return {
      kind: 'authenticated',
      apiUser: {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name ?? '',
        nickname: response.user.nickname ?? '',
        role: response.user.role,
        profileImageUrl: response.user.profileImageUrl,
        tenantId: response.user.tenantId,
      },
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    };
  }

  if (response.requiresSignup) {
    return {
      kind: 'error',
      message:
        response.message ??
        'Apple 계정 정보가 부족합니다. 잠시 후 다시 시도하거나 다른 로그인 수단을 이용해 주세요.',
    };
  }

  return { kind: 'error', message: response.message ?? 'Apple 로그인에 실패했습니다.' };
}

export type ApplePhoneSendMapped =
  | { kind: 'sent'; otpChallengeToken: string; expiresInSeconds?: number }
  | { kind: 'cooldown'; message: string; retryAfterSeconds?: number }
  | { kind: 'error'; message: string };

/**
 * Apple SIWA `/phone/send` 응답을 클라이언트 outcome 으로 매핑한다.
 */
export function mapApplePhoneSendResponse(
  response: ApplePhoneSendResponse | undefined,
): ApplePhoneSendMapped {
  if (!response) {
    return { kind: 'error', message: '서버 응답이 없습니다.' };
  }
  if (response.success && response.otpChallengeToken) {
    return {
      kind: 'sent',
      otpChallengeToken: response.otpChallengeToken,
      expiresInSeconds:
        typeof response.expiresInSeconds === 'number' ? response.expiresInSeconds : undefined,
    };
  }
  if (response.retryAfterSeconds && response.retryAfterSeconds > 0) {
    return {
      kind: 'cooldown',
      message: response.message ?? '잠시 후 다시 시도해 주세요.',
      retryAfterSeconds: response.retryAfterSeconds,
    };
  }
  return {
    kind: 'error',
    message: response.message ?? '인증번호 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.',
  };
}
