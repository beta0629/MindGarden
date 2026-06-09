/**
 * provider-agnostic OAuth 휴대폰 매칭 — BE 응답 → 클라이언트 outcome 매핑 (순수 함수).
 *
 * <p>{@code AuthService.ts} 에서 사용하는 매핑 로직을 분리하여 단위 테스트 가능하게 한다.
 * 기존 Apple 전용 매퍼({@link ./applePhoneVerificationMapper}) 의 일반화 버전이며,
 * 사이드 이펙트(useAuthStore.login 등)는 AuthService 본체에 남기고 본 모듈은 응답 파싱·outcome
 * 빌더만 담당한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */
import type {
  OAuthPhoneProvider,
  OAuthPhoneSendResponse,
  OAuthPhoneVerifyResponse,
} from '@/api/auth/oauthAuth';

/** OAuth 휴대폰 OTP 발송 매핑 결과. */
export type OAuthPhoneSendMapped =
  | {
      kind: 'sent';
      challengeToken: string;
      expiresInSeconds?: number;
      resendCooldownSeconds?: number;
      maskedPhone?: string;
    }
  | {
      kind: 'cooldown';
      message: string;
      retryAfterSeconds?: number;
      code?: string;
    }
  | {
      kind: 'error';
      message: string;
      /** BE 가 내려준 실패 코드 (DAILY_LIMIT_EXCEEDED / TOKEN_EXPIRED / SEND_FAILED 등). */
      code?: string;
    };

/** OAuth 휴대폰 OTP 검증 매핑 결과 (순수 — User 변환은 AuthService 본체에서). */
export type OAuthPhoneVerifyMapped =
  | {
      kind: 'authenticated';
      accessToken: string;
      refreshToken: string;
      matchedAccount: {
        userId: number;
        tenantId?: string;
        role?: string;
      };
    }
  | {
      kind: 'requiresPhoneAccountSelection';
      selectionToken: string;
      provider: OAuthPhoneProvider;
      message?: string;
    }
  | {
      kind: 'error';
      message: string;
      code?: string;
    };

const DEFAULT_SEND_ERROR_MESSAGE = '인증번호 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.';
const DEFAULT_VERIFY_ERROR_MESSAGE = '인증번호 확인에 실패했습니다.';
const COOLDOWN_FALLBACK_MESSAGE = '잠시 후 다시 시도해 주세요.';

function isCooldownResponse(response: OAuthPhoneSendResponse): boolean {
  if (typeof response.retryAfterSeconds === 'number' && response.retryAfterSeconds > 0) {
    return true;
  }
  return response.code === 'RESEND_COOLDOWN';
}

/**
 * OAuth `/phone/send` 응답을 클라이언트 outcome 으로 매핑한다.
 */
export function mapOAuthPhoneSendResponse(
  response: OAuthPhoneSendResponse | undefined,
): OAuthPhoneSendMapped {
  if (!response) {
    return { kind: 'error', message: '서버 응답이 없습니다.' };
  }
  if (response.success && response.challengeToken) {
    return {
      kind: 'sent',
      challengeToken: response.challengeToken,
      expiresInSeconds:
        typeof response.expiresInSeconds === 'number' ? response.expiresInSeconds : undefined,
      resendCooldownSeconds:
        typeof response.resendCooldownSeconds === 'number'
          ? response.resendCooldownSeconds
          : undefined,
      maskedPhone: response.maskedPhone,
    };
  }
  if (isCooldownResponse(response)) {
    return {
      kind: 'cooldown',
      message: response.message ?? COOLDOWN_FALLBACK_MESSAGE,
      retryAfterSeconds: response.retryAfterSeconds,
      code: response.code,
    };
  }
  return {
    kind: 'error',
    message: response.message ?? DEFAULT_SEND_ERROR_MESSAGE,
    code: response.code,
  };
}

/**
 * OAuth `/phone/verify` 응답을 클라이언트 outcome 으로 매핑한다.
 */
export function mapOAuthPhoneVerifyResponse(
  response: OAuthPhoneVerifyResponse | undefined,
  provider: OAuthPhoneProvider,
): OAuthPhoneVerifyMapped {
  if (!response) {
    return { kind: 'error', message: '서버 응답이 없습니다.' };
  }

  if (response.requiresPhoneAccountSelection && response.phoneAccountSelectionToken) {
    return {
      kind: 'requiresPhoneAccountSelection',
      selectionToken: response.phoneAccountSelectionToken,
      provider,
      message: response.message,
    };
  }

  const matched = response.matchedAccount;
  if (
    response.success &&
    response.accessToken &&
    response.refreshToken &&
    matched &&
    typeof matched.userId === 'number'
  ) {
    return {
      kind: 'authenticated',
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      matchedAccount: {
        userId: matched.userId,
        tenantId: matched.tenantId ?? undefined,
        role: matched.role ?? undefined,
      },
    };
  }

  return {
    kind: 'error',
    message: response.message ?? DEFAULT_VERIFY_ERROR_MESSAGE,
    code: response.code,
  };
}
