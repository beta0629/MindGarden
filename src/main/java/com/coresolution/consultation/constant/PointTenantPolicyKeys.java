package com.coresolution.consultation.constant;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

/**
 * 테넌트 포인트·리워드 정책 키(MVP subset).
 *
 * @see docs/project-management/POINT_REWARD_EARN_AND_REDEEM_SPEC.md §3
 * @author MindGarden
 * @since 2026-05-19
 */
public final class PointTenantPolicyKeys {

    public static final String EARN_RATE = "earn_rate";
    public static final String EARN_CAP_PER_ORDER = "earn_cap_per_order";
    public static final String MIN_ORDER_FOR_REDEEM = "min_order_for_redeem";
    public static final String MAX_REDEEM_PER_ORDER = "max_redeem_per_order";
    public static final String ALLOW_PG_MIX = "allow_pg_mix";
    public static final String ALLOW_POINTS_ONLY = "allow_points_only";
    public static final String HOLD_TTL_MINUTES = "hold_ttl_minutes";

    private static final Set<String> MVP_KEYS = Set.of(
            EARN_RATE,
            EARN_CAP_PER_ORDER,
            MIN_ORDER_FOR_REDEEM,
            MAX_REDEEM_PER_ORDER,
            ALLOW_PG_MIX,
            ALLOW_POINTS_ONLY,
            HOLD_TTL_MINUTES);

    private static final Map<String, Object> DEFAULTS;

    static {
        Map<String, Object> defaults = new LinkedHashMap<>();
        defaults.put(EARN_RATE, Map.of("percentBps", 0));
        defaults.put(EARN_CAP_PER_ORDER, Map.of("amountMinor", 0L));
        defaults.put(MIN_ORDER_FOR_REDEEM, Map.of("amountMinor", 0L));
        defaults.put(MAX_REDEEM_PER_ORDER, Map.of("amountMinor", 0L));
        defaults.put(ALLOW_PG_MIX, true);
        defaults.put(ALLOW_POINTS_ONLY, true);
        defaults.put(HOLD_TTL_MINUTES, Map.of("minutes", 30));
        DEFAULTS = Collections.unmodifiableMap(defaults);
    }

    private PointTenantPolicyKeys() {
    }

    /**
     * @return MVP에서 허용하는 정책 키 집합
     */
    public static Set<String> mvpKeys() {
        return MVP_KEYS;
    }

    /**
     * @return 키별 기본값(저장 행 없을 때)
     */
    public static Map<String, Object> defaultPolicies() {
        return DEFAULTS;
    }
}
