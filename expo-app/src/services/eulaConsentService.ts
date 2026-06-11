/**
 * Apple G1.2 UGC (P2-C) — EULA(이용약관) 동의 API.
 *
 * <p>BE `UserEulaConsentController` 와 1:1 매핑 — 부팅 시 동의 상태 조회 및 동의 저장.</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
import { apiGet, apiPost } from '@/api/client';
import { USER_API } from '@/api/endpoints';
import { unwrapApiResponse } from '@/api/unwrapApiResponse';

export interface UserEulaConsentResponseDto {
  currentVersion: string;
  acceptedVersion: string | null;
  acceptedAt: string | null;
  marketingConsent: boolean;
  requiresReconsent: boolean;
}

export interface UserEulaConsentRequestDto {
  termsConsent: boolean;
  privacyConsent: boolean;
  marketingConsent: boolean;
  termsVersion: string;
}

/**
 * GET /api/v1/users/me/eula-consent — 부팅 시 게이트 판정.
 *
 * @returns 동의 상태 (requiresReconsent=true 면 EULA 화면 표시)
 */
export async function fetchEulaConsentStatus(): Promise<UserEulaConsentResponseDto> {
  const raw = await apiGet<unknown>(USER_API.EULA_CONSENT);
  const data = unwrapApiResponse<UserEulaConsentResponseDto>(raw);
  if (!data) {
    throw new Error('EULA_STATUS_PARSE_FAILED');
  }
  return data;
}

/**
 * POST /api/v1/users/me/eula-consent — 동의 저장.
 *
 * @param body 동의 본문
 * @returns 저장 후 상태 (requiresReconsent=false 기대)
 */
export async function submitEulaConsent(
  body: UserEulaConsentRequestDto,
): Promise<UserEulaConsentResponseDto> {
  const raw = await apiPost<unknown>(USER_API.EULA_CONSENT, body);
  const data = unwrapApiResponse<UserEulaConsentResponseDto>(raw);
  if (!data) {
    throw new Error('EULA_SUBMIT_PARSE_FAILED');
  }
  return data;
}
