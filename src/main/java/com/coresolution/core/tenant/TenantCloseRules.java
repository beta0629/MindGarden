package com.coresolution.core.tenant;

import java.time.LocalDateTime;

import com.coresolution.core.domain.Tenant.TenantStatus;

/**
 * 종료 상태 전이 순수 판정.
 *
 * <p>구독 여부는 호출자가 {@code hasEffectiveSubscription} 결과만 넘긴다.
 * {@code tenants.subscription_status} 는 보지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
public final class TenantCloseRules {

    private TenantCloseRules() {
    }

    /**
     * ACTIVE → SUSPENDED → CLOSED. 종료는 SUSPENDED 에서 유예가 지난 뒤에만 허용한다.
     * 정지 시각을 모르면 유예가 지나지 않은 것으로 본다.
     * 경계는 {@code suspendedAt + graceDays} 와 같은 시각부터 허용이다.
     *
     * @param status                   현재 상태
     * @param suspendedAt              정지 시각. 없으면 null
     * @param now                      판정 시각 (Asia/Seoul)
     * @param graceDays                유예 일수
     * @param hasEffectiveSubscription 유효 구독이 있으면 true
     * @return 판정
     */
    public static TenantCloseDecision evaluate(
            TenantStatus status,
            LocalDateTime suspendedAt,
            LocalDateTime now,
            int graceDays,
            boolean hasEffectiveSubscription) {
        if (status != TenantStatus.SUSPENDED) {
            return TenantCloseDecision.STATUS_NOT_ALLOWED;
        }
        if (suspendedAt == null || now == null || now.isBefore(suspendedAt.plusDays(graceDays))) {
            return TenantCloseDecision.GRACE_NOT_ELAPSED;
        }
        if (hasEffectiveSubscription) {
            return TenantCloseDecision.ACTIVE_SUBSCRIPTION;
        }
        return TenantCloseDecision.ALLOWED;
    }
}
