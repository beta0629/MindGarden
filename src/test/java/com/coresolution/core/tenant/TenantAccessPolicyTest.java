package com.coresolution.core.tenant;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.core.domain.Tenant.TenantStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 테넌트 접근 정책. ACTIVE 는 통과, SUSPENDED·CLOSED 는 차단, Ops 경로는 예외.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@DisplayName("TenantAccessPolicy")
class TenantAccessPolicyTest {

    private final TenantAccessPolicy policy = new TenantAccessPolicy();

    @Test
    @DisplayName("ACTIVE 보호 API 는 허용")
    void activeApiAllowed() {
        assertThat(policy.decide(TenantStatus.ACTIVE, "/api/v1/schedules")).isEqualTo(TenantAccessDecision.ALLOW);
    }

    @Test
    @DisplayName("PENDING 은 이 정책에서 막지 않음")
    void pendingAllowed() {
        assertThat(policy.allows(TenantStatus.PENDING, "/api/v1/consultations")).isTrue();
    }

    @Test
    @DisplayName("SUSPENDED 보호 API 는 차단")
    void suspendedApiDenied() {
        assertThat(policy.decide(TenantStatus.SUSPENDED, "/api/v1/schedules"))
                .isEqualTo(TenantAccessDecision.DENY_SUSPENDED);
    }

    @Test
    @DisplayName("CLOSED 보호 API 는 차단")
    void closedApiDenied() {
        assertThat(policy.decide(TenantStatus.CLOSED, "/api/v1/auth/refresh"))
                .isEqualTo(TenantAccessDecision.DENY_CLOSED);
    }

    @Test
    @DisplayName("경로가 없는 로그인·스케줄 판정도 SUSPENDED 를 막음")
    void suspendedWithoutPathDenied() {
        assertThat(policy.decide(TenantStatus.SUSPENDED, null)).isEqualTo(TenantAccessDecision.DENY_SUSPENDED);
        assertThat(policy.decide(TenantStatus.CLOSED, null)).isEqualTo(TenantAccessDecision.DENY_CLOSED);
    }

    @Test
    @DisplayName("Ops 경로는 SUSPENDED·CLOSED 도 허용")
    void opsPathExempt() {
        assertThat(policy.decide(TenantStatus.SUSPENDED, "/api/v1/ops/tenants")).isEqualTo(TenantAccessDecision.ALLOW);
        assertThat(policy.decide(TenantStatus.CLOSED, "/api/v1/ops/tenants/tenant-a/close?includeClosed=true"))
                .isEqualTo(TenantAccessDecision.ALLOW);
        assertThat(policy.decide(TenantStatus.SUSPENDED, "/api/v1/ops")).isEqualTo(TenantAccessDecision.ALLOW);
    }

    @Test
    @DisplayName("ops 접두만 비슷한 경로는 예외가 아님")
    void opsPrefixLookalikeDenied() {
        assertThat(policy.decide(TenantStatus.SUSPENDED, "/api/v1/ops-extra/tenants"))
                .isEqualTo(TenantAccessDecision.DENY_SUSPENDED);
    }
}
