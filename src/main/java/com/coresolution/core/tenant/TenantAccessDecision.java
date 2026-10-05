package com.coresolution.core.tenant;

/**
 * 테넌트 접근 판정 결과.
 *
 * <p>상태 비교는 {@link TenantAccessPolicy} 한 곳에서만 한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
public enum TenantAccessDecision {

    ALLOW,
    DENY_SUSPENDED,
    DENY_CLOSED;

    /**
     * @return 요청·발송·스케줄을 계속해도 되면 true
     */
    public boolean isAllowed() {
        return this == ALLOW;
    }
}
