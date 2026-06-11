/**
 * Push-first OTP 1회 조회 클라이언트 서비스.
 *
 * <p>백엔드 SSOT: {@code AuthController#getCurrentOtp}
 * (PR #224 — push body 평문 OTP 제거 후속, 2026-06-11).
 * push 페이로드의 {@code data.otpToken} 으로 인증된 사용자만 6자리 OTP 를 1회 조회한다.</p>
 *
 * <p>보안 정책 (호출측 의무):
 * <ul>
 *   <li>UI 표시 외 어떤 경로로도 평문 OTP 를 로그·저장·외부 전송 금지.</li>
 *   <li>호출 후 즉시 invalidate 되므로 재호출은 항상 404 (사용자 알림 메시지에 노출 금지).</li>
 *   <li>네트워크 오류·404 모두 동일하게 "조회 실패" 로 처리 (존재 여부 oracle 방지).</li>
 * </ul></p>
 *
 * @author MindGarden
 * @since 2026-06-12
 */
import { apiGet } from '../api/client';
import { AUTH_API } from '../api/endpoints';
import { unwrapApiResponse } from '../api/unwrapApiResponse';

export interface FetchCurrentOtpResult {
  /** 6자리 OTP — UI 표시 외 사용 금지. */
  readonly otp: string;
}

/** 표준 OTP 자릿수 — 백엔드와 동일. */
const OTP_CODE_LENGTH = 6;

function isPlausibleOtpCode(value: unknown): value is string {
  return typeof value === 'string' && value.length === OTP_CODE_LENGTH && /^\d{6}$/.test(value);
}

/**
 * push 발송된 OTP 를 1회 조회.
 *
 * @param otpToken push payload {@code data.otpToken}
 * @returns 6자리 OTP 또는 null (만료·불일치·소비됨·네트워크 오류 모두 null 로 통일)
 */
export async function fetchCurrentOtp(otpToken: string): Promise<FetchCurrentOtpResult | null> {
  const trimmed = otpToken?.trim();
  if (!trimmed) {
    return null;
  }
  try {
    const raw = await apiGet<unknown>(AUTH_API.OTP_CURRENT, { otpToken: trimmed });
    const data = unwrapApiResponse<Record<string, unknown>>(raw);
    if (!data) {
      return null;
    }
    const candidate = data['otp'];
    if (!isPlausibleOtpCode(candidate)) {
      return null;
    }
    return { otp: candidate };
  } catch {
    return null;
  }
}
