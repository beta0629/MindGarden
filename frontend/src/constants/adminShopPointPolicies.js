/**
 * 테넌트 어드민 — 포인트·리워드 정책 키·라벨 (백엔드 PointTenantPolicyKeys와 동일)
 *
 * @author CoreSolution
 * @since 2026-05-20
 */

/** @type {Readonly<{ EARN_RATE: string, EARN_CAP_PER_ORDER: string, MIN_ORDER_FOR_REDEEM: string, MAX_REDEEM_PER_ORDER: string, ALLOW_PG_MIX: string, ALLOW_POINTS_ONLY: string, HOLD_TTL_MINUTES: string }>} */
export const ADMIN_SHOP_POINT_POLICY_KEYS = {
  EARN_RATE: 'earn_rate',
  EARN_CAP_PER_ORDER: 'earn_cap_per_order',
  MIN_ORDER_FOR_REDEEM: 'min_order_for_redeem',
  MAX_REDEEM_PER_ORDER: 'max_redeem_per_order',
  ALLOW_PG_MIX: 'allow_pg_mix',
  ALLOW_POINTS_ONLY: 'allow_points_only',
  HOLD_TTL_MINUTES: 'hold_ttl_minutes'
};

/** 백엔드 PointTenantPolicyKeys 기본값과 동일 */
export const ADMIN_SHOP_HOLD_TTL_DEFAULT_MINUTES = 30;

/** @type {Readonly<{ earnRatePercentBps: string, earnCapAmountMinor: string, minOrderForRedeemMinor: string, maxRedeemAmountMinor: string, holdTtlMinutes: string, allowPgMix: string, allowPointsOnly: string }>} */
export const ADMIN_SHOP_POINT_POLICY_FIELD_LABELS = {
  earnRatePercentBps: '적립률 (basis points, 100 = 1%)',
  earnCapAmountMinor: '주문당 적립 상한(원)',
  minOrderForRedeemMinor: '포인트 사용 최소 주문액(원)',
  maxRedeemAmountMinor: '주문당 최대 사용 포인트(원)',
  holdTtlMinutes: '미결제 주문 hold TTL(분)',
  allowPgMix: '포인트 + PG 혼합 결제 허용',
  allowPointsOnly: '포인트 전액 결제 허용'
};
