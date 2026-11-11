/**
 * 약관·개인정보 처리방침 외부 URL 해석 유틸 (Apple G1.2 UGC SSOT).
 *
 * @author MindGarden
 * @since 2026-06-11
 */
import { buildPublicLegalWebUrl } from '@/utils/buildPublicLegalWebUrl';

export interface LegalUrls {
  terms: string;
  privacy: string;
}

/**
 * 약관·개인정보 URL 해석.
 * env 가 있으면 우선. 없으면 공개 웹 호스트 빌더로 `/legal/*` 경로를 만든다
 * (API origin 의 `/privacy`·`/terms` 는 공개 법적 페이지와 불일치할 수 있음).
 */
export function resolveLegalUrls(tenantCode?: string | null): LegalUrls {
  const termsEnv = process.env.EXPO_PUBLIC_TERMS_URL?.trim();
  const privacyEnv = process.env.EXPO_PUBLIC_PRIVACY_URL?.trim();
  if (termsEnv && privacyEnv) {
    return { terms: termsEnv, privacy: privacyEnv };
  }
  return {
    terms: termsEnv || buildPublicLegalWebUrl('/legal/terms', tenantCode),
    privacy: privacyEnv || buildPublicLegalWebUrl('/legal/privacy', tenantCode),
  };
}
