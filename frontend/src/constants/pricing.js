/**
 * Pricing 페이지 상수 (Public Pricing v2)
 *
 * 매직 넘버 / 매직 문자열 추출.
 * 가격 데이터는 src/data/pricingPlans.json 에 위치.
 *
 * @author CoreSolution
 * @since 2026-06-16
 */

/** 결제 주기 */
export const PRICING_BILLING_CYCLE = Object.freeze({
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
});

/** 카드 시각 변형 — Spec §9 (PricingPlanCard variant) */
export const PRICING_PLAN_VARIANT = Object.freeze({
  STARTER: 'starter',
  POPULAR: 'popular',
  ENTERPRISE_DARK: 'enterprise-dark',
});

/** Plan 아이콘 키 — PricingPlanIcon 매핑 */
export const PRICING_PLAN_ICON = Object.freeze({
  STARTER: 'starter',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
});

/** 연간 결제 할인율 (Spec §3.2 — "연간 (20% 할인)") */
export const PRICING_YEARLY_DISCOUNT_RATE = 0.2;

/** 통화 기호 (Locale) */
export const PRICING_DEFAULT_CURRENCY = '₩';

/** 라우트 */
export const PRICING_ONBOARDING_PATH = '/onboarding';

/** Trust Badge 키 (Spec §3.4) */
export const PRICING_TRUST_BADGE_KEYS = Object.freeze([
  'iso27001',
  'soc2',
  'gdpr',
  'kisaIsms',
]);

/** Compare Toggle 대상 영역 ID */
export const PRICING_COMPARE_TARGET_ID = 'pricing-feature-matrix-section';
