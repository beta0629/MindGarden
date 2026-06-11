/**
 * OTP 푸시(`data.type === 'otp_delivery'`) 전용 라우팅·판별 캡슐화.
 *
 * <p>백엔드 SSOT:
 * {@code com.coresolution.consultation.constant.MobilePushCanonicalTypes#OTP_DELIVERY}
 * + {@code com.coresolution.consultation.service.impl.MobilePushDispatchServiceImpl#dispatchAuthenticationOtp}.
 * push 페이로드는 일반 12종(P1–P12) 라우팅(`pushNavigation`) 과 별개로 처리한다:
 * <ul>
 *   <li>역할(client/consultant/admin) 과 무관 — 인증 흐름의 본인확인 푸시.</li>
 *   <li>사용자 알림 카테고리 설정 우회 — 보안 의무 통지.</li>
 *   <li>{@code data.otpToken} 만 라우트 파라미터로 전달, 평문 OTP 는 페이로드에 없음.</li>
 *   <li>화면(`/(otp)/current`) 진입 후 `GET /api/v1/auth/otp/current` 로 6자리 1회 조회.</li>
 * </ul></p>
 *
 * <p>로그·UI 외부 노출 가능한 식별자는 모두 마스킹한다(PR #227 NCP SENS 패턴 유지).</p>
 *
 * @author MindGarden
 * @since 2026-06-12
 */

/** 백엔드 {@code MobilePushCanonicalTypes.OTP_DELIVERY} 와 1:1 SSOT — 별칭 미허용. */
export const OTP_DELIVERY_PUSH_TYPE = 'otp_delivery';

/** {@code AuthController#getCurrentOtp} 쿼리 파라미터 이름 — 라우트 파라미터와 정합. */
export const OTP_CURRENT_QUERY_PARAM = 'otpToken';

/** expo-router 라우트 — `(otp)` 그룹의 current 화면. */
export const OTP_CURRENT_ROUTE = '/(otp)/current';

/** 백엔드 {@code OtpPurpose} 코드 SSOT (`data.purpose`). */
export type OtpPushPurpose =
  | 'login_verification'
  | 'phone_change'
  | 'signup_verification'
  | 'generic';

const OTP_PUSH_PURPOSE_VALUES: ReadonlySet<OtpPushPurpose> = new Set<OtpPushPurpose>([
  'login_verification',
  'phone_change',
  'signup_verification',
  'generic',
]);

/**
 * 사용자 명령상의 단순 표기 ({@code data.purpose === "OTP"}) 도 호환 (대소문자·공백 무관).
 *
 * <p>현재 백엔드는 {@code OtpPurpose} enum code (소문자 snake_case) 만 전송하지만,
 * 어떤 표기로 들어와도 OTP 푸시로 인식한다(완료 조건의 표시 패리티 보장).</p>
 */
function looksLikePurposeOtpAlias(raw: unknown): boolean {
  if (typeof raw !== 'string') {
    return false;
  }
  return raw.trim().toUpperCase() === 'OTP';
}

/**
 * 푸시 `data` payload 가 OTP 발송 채널인지 판별.
 *
 * <p>판별 우선순위 (어느 하나라도 만족하면 OTP):
 * <ol>
 *   <li>{@code data.type === 'otp_delivery'} (백엔드 canonical SSOT).</li>
 *   <li>{@code data.purpose} 가 백엔드 {@link OtpPurpose} 코드 4종 중 하나.</li>
 *   <li>{@code data.purpose === 'OTP'} (alias).</li>
 * </ol></p>
 */
export function isOtpDeliveryPushData(data: Record<string, unknown> | null | undefined): boolean {
  if (!data) {
    return false;
  }
  const type = data['type'];
  if (typeof type === 'string' && type.trim() === OTP_DELIVERY_PUSH_TYPE) {
    return true;
  }
  const purposeRaw = data['purpose'];
  if (typeof purposeRaw === 'string') {
    const purposeNormalized = purposeRaw.trim().toLowerCase() as OtpPushPurpose;
    if (OTP_PUSH_PURPOSE_VALUES.has(purposeNormalized)) {
      return true;
    }
  }
  return looksLikePurposeOtpAlias(purposeRaw);
}

/**
 * push payload 의 OTP 1회 조회 토큰 추출 (없으면 null).
 *
 * <p>토큰은 화면 진입 시 {@code /api/v1/auth/otp/current?otpToken=...} 호출용으로만 사용한다.
 * 평문 OTP 가 페이로드에 동봉되어 들어왔더라도 본 함수는 그것을 절대 읽지 않는다.</p>
 */
export function extractOtpToken(data: Record<string, unknown> | null | undefined): string | null {
  if (!data) {
    return null;
  }
  const raw = data['otpToken'];
  if (typeof raw !== 'string') {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** push payload {@code data.purpose} 를 정규화된 OTP 분류로 환원 (없으면 generic). */
export function normalizeOtpPurpose(
  data: Record<string, unknown> | null | undefined,
): OtpPushPurpose {
  if (!data) {
    return 'generic';
  }
  const raw = data['purpose'];
  if (typeof raw !== 'string') {
    return 'generic';
  }
  const normalized = raw.trim().toLowerCase() as OtpPushPurpose;
  if (OTP_PUSH_PURPOSE_VALUES.has(normalized)) {
    return normalized;
  }
  return 'generic';
}

export interface OtpRouteHref {
  /** expo-router `pathname` (그룹 포함). */
  readonly pathname: typeof OTP_CURRENT_ROUTE;
  /** expo-router `params` — otpToken 미포함 시에도 화면이 안전 폴백 분기 가능하도록 항상 전달. */
  readonly params: {
    readonly otpToken?: string;
    readonly purpose: OtpPushPurpose;
  };
}

/**
 * push payload → {@code router.push} 에 그대로 넘길 수 있는 OTP 라우트 객체.
 *
 * <p>{@code data.otpToken} 이 없는 경우에도 화면 폴백 표시를 위해 라우트는 항상 반환한다.
 * 화면(`/(otp)/current`) 은 otpToken 부재 시 "다시 시도 / SMS 폴백 안내" UI 만 노출한다.</p>
 */
export function buildOtpRouteHref(data: Record<string, unknown> | null | undefined): OtpRouteHref {
  const token = extractOtpToken(data);
  return {
    pathname: OTP_CURRENT_ROUTE,
    params: {
      ...(token ? { otpToken: token } : {}),
      purpose: normalizeOtpPurpose(data),
    },
  };
}

/**
 * 로그 출력용 OTP 토큰 마스킹 — 평문 노출 금지(PR #227 NCP SENS 패턴 유지).
 */
export function maskOtpTokenForLog(token: string | null | undefined): string {
  if (!token) {
    return '(none)';
  }
  const trimmed = token.trim();
  if (trimmed.length <= 6) {
    return '***';
  }
  return `${trimmed.slice(0, 4)}…(${trimmed.length})`;
}
