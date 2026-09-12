/**
 * 약관·개인정보 처리방침 외부 URL 해석 유틸 (Apple G1.2 UGC SSOT).
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
