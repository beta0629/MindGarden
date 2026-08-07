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

/** 스위치 토글 즉시 반영 안내 (페이지 i18n 미연동 구간 SSOT) */
export const ADMIN_SHOP_POINT_POLICY_TOGGLE_IMMEDIATE_HINT =
  '토글 변경 시 즉시 반영됩니다. 수치 필드는 저장 버튼으로 반영됩니다.';

export const ADMIN_SHOP_POINT_POLICY_TOGGLE_SAVE_SUCCESS = '결제 허용 설정이 저장되었습니다.';
export const ADMIN_SHOP_POINT_POLICY_TOGGLE_SAVE_FAIL = '결제 허용 설정 저장에 실패했습니다.';
