package com.coresolution.core.tenant;

/**
 * 종료(close) 상태 전이 판정.
 *
 * <p>허용은 SUSPENDED 이고 유예가 지났으며 유효 구독이 없을 때뿐이다.
 * CLOSED 에서는 다른 상태로 가지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
public enum TenantCloseDecision {

    ALLOWED,
    STATUS_NOT_ALLOWED,
    GRACE_NOT_ELAPSED,
    ACTIVE_SUBSCRIPTION
}
