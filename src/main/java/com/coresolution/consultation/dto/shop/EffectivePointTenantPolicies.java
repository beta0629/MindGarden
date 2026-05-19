package com.coresolution.consultation.dto.shop;

import com.coresolution.consultation.constant.PointTenantPolicyKeys;
import java.util.Map;

/**
 * 체크아웃에 적용할 테넌트 포인트 정책(타입 변환).
 *
 * @author MindGarden
 * @since 2026-05-19
 */
public record EffectivePointTenantPolicies(
        long minOrderForRedeemMinor,
        long maxRedeemPerOrderMinor,
        boolean allowPgMix,
        boolean allowPointsOnly,
        int earnRatePercentBps,
        long earnCapPerOrderMinor) {

    /** 포인트 전액 결제 시 적립 기준: subtotal (스펙 §3 과세/할인 후 기준 금액) */
    private static final boolean EARN_ON_SUBTOTAL_FOR_POINTS_ONLY = true;

    /**
     * 병합된 정책 맵을 체크아웃용 타입으로 변환한다.
     *
     * @param policies {@link PointTenantPolicyKeys} 기준 병합 맵
     * @return 타입 변환된 정책
     */
    public static EffectivePointTenantPolicies fromPoliciesMap(Map<String, Object> policies) {
        return new EffectivePointTenantPolicies(
                readAmountMinor(policies.get(PointTenantPolicyKeys.MIN_ORDER_FOR_REDEEM)),
                readAmountMinor(policies.get(PointTenantPolicyKeys.MAX_REDEEM_PER_ORDER)),
                readBoolean(policies.get(PointTenantPolicyKeys.ALLOW_PG_MIX), true),
                readBoolean(policies.get(PointTenantPolicyKeys.ALLOW_POINTS_ONLY), true),
                readPercentBps(policies.get(PointTenantPolicyKeys.EARN_RATE)),
                readAmountMinor(policies.get(PointTenantPolicyKeys.EARN_CAP_PER_ORDER)));
    }

    /**
     * PAID 시 적립 포인트(원)를 산출한다.
     * <p>
     * PG·혼합 결제: {@code cashDueMinor}(현금 결제분) 기준.
     * 포인트 전액({@code cashDueMinor=0}): 스펙 §3 subtotal 기준 또는 0 — {@link #EARN_ON_SUBTOTAL_FOR_POINTS_ONLY}.
     *
     * @param subtotalMinor   주문 소계(과세/할인 후)
     * @param cashDueMinor    PG 청구액(현금 결제분)
     * @return 적립 포인트(원), 0이면 적립 없음
     */
    public long computeEarnAmountMinor(long subtotalMinor, long cashDueMinor) {
        if (earnRatePercentBps <= 0) {
            return 0L;
        }
        long basisMinor = resolveEarnBasisMinor(subtotalMinor, cashDueMinor);
        if (basisMinor <= 0L) {
            return 0L;
        }
        long raw = basisMinor * (long) earnRatePercentBps / 10_000L;
        if (earnCapPerOrderMinor > 0L) {
            raw = Math.min(raw, earnCapPerOrderMinor);
        }
        return raw;
    }

    private long resolveEarnBasisMinor(long subtotalMinor, long cashDueMinor) {
        if (cashDueMinor > 0L) {
            return cashDueMinor;
        }
        if (cashDueMinor == 0L && subtotalMinor > 0L && EARN_ON_SUBTOTAL_FOR_POINTS_ONLY) {
            return subtotalMinor;
        }
        return 0L;
    }

    private static int readPercentBps(Object value) {
        if (value instanceof Map<?, ?> map) {
            Object percentBps = map.get("percentBps");
            if (percentBps instanceof Number number) {
                return number.intValue();
            }
        }
        return 0;
    }

    private static long readAmountMinor(Object value) {
        if (value instanceof Map<?, ?> map) {
            Object amountMinor = map.get("amountMinor");
            if (amountMinor instanceof Number number) {
                return number.longValue();
            }
        }
        return 0L;
    }

    private static boolean readBoolean(Object value, boolean defaultValue) {
        if (value instanceof Boolean bool) {
            return bool;
        }
        return defaultValue;
    }
}
