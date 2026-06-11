/**
 * 약관·개인정보 처리방침 외부 URL 해석 유틸 (Apple G1.2 UGC SSOT).
 *
 * <p>{@code EXPO_PUBLIC_TERMS_URL} / {@code EXPO_PUBLIC_PRIVACY_URL} 환경변수가 있으면 우선,
 * 없으면 `apiBaseUrl` origin + `/terms` / `/privacy` 로 폴백. EULA 동의 화면(`eula-consent`)
 * 과 소셜 가입 화면(`social-signup`) 이 동일 로직을 공유한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
import { getApiBaseUrl } from '@/config/apiBaseUrl';

export interface LegalUrls {
  terms: string;
  privacy: string;
}

function webOriginFromApiBase(): string {
  try {
    return new URL(getApiBaseUrl()).origin;
  } catch {
    return '';
  }
}

/**
 * 약관·개인정보 URL 해석.
 *
 * @returns 둘 다 비어 있을 수 있음 (호출부에서 null check 필요)
 */
export function resolveLegalUrls(): LegalUrls {
  const termsEnv = process.env.EXPO_PUBLIC_TERMS_URL?.trim();
  const privacyEnv = process.env.EXPO_PUBLIC_PRIVACY_URL?.trim();
  if (termsEnv && privacyEnv) {
    return { terms: termsEnv, privacy: privacyEnv };
  }
  const origin = webOriginFromApiBase();
  return {
    terms: termsEnv || (origin ? `${origin}/terms` : ''),
    privacy: privacyEnv || (origin ? `${origin}/privacy` : ''),
  };
}
