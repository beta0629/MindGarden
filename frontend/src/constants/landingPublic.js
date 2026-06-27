/**
 * Landing Public 페이지 정적 상수
 *
 * Design v2 Refine v2 W3 — Landing 페이지의 i18n 미주입 시 fallback 상수.
 * 실서비스에서는 `react-i18next` t() 함수가 항상 우선 사용됨.
 *
 * (constants 파일은 하드코딩 검사에서 자동 제외 처리됨)
 *
 * @author CoreSolution
 * @since 2026-06-16
 */

/* ── Trust 배지 키 ── */
export const LANDING_TRUST_BADGE_KEY_ISO27001 = 'iso27001';
export const LANDING_TRUST_BADGE_KEY_SOC2 = 'soc2';
export const LANDING_TRUST_BADGE_KEY_GDPR = 'gdpr';
export const LANDING_TRUST_BADGE_KEY_KISA = 'kisaIsms';

export const LANDING_TRUST_BADGE_DEFAULT_ORDER = [
  LANDING_TRUST_BADGE_KEY_ISO27001,
  LANDING_TRUST_BADGE_KEY_SOC2,
  LANDING_TRUST_BADGE_KEY_GDPR,
  LANDING_TRUST_BADGE_KEY_KISA,
];

export const LANDING_TRUST_BADGE_DEFAULT_LABELS = {
  [LANDING_TRUST_BADGE_KEY_ISO27001]: 'ISO 27001',
  [LANDING_TRUST_BADGE_KEY_SOC2]: 'SOC 2',
  [LANDING_TRUST_BADGE_KEY_GDPR]: 'GDPR',
  [LANDING_TRUST_BADGE_KEY_KISA]: 'KISA-ISMS',
};

export const LANDING_TRUST_BADGE_DEFAULT_ARIA_LABEL = 'Security certifications';

/* ── DashboardPreview 기본 텍스트 ── */
export const LANDING_DASHBOARD_PREVIEW_DEFAULT_ALT = 'Core Solution Dashboard Preview';

/* ── SocialProofLogos 키 ── */
export const LANDING_SOCIAL_PROOF_LOGO_KEYS = [
  { key: 'acme', name: 'ACME' },
  { key: 'globex', name: 'Globex' },
  { key: 'initech', name: 'INITECH' },
  { key: 'umbrella', name: 'Umbrella' },
  { key: 'cyberdyne', name: 'CYBERDYNE' },
];

/* ── 라우트 (LandingPage CTA) ── */
export const LANDING_ROUTE_SIGNUP = '/onboarding';
export const LANDING_ROUTE_DEMO = '/onboarding';
export const LANDING_ROUTE_CONTACT = '/onboarding';

/* ── i18n 네임스페이스 ── */
export const LANDING_I18N_NAMESPACE = 'common';
