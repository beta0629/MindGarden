package com.coresolution.core.tenant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import com.coresolution.core.domain.Tenant;
import com.coresolution.core.domain.Tenant.TenantStatus;
import com.coresolution.core.service.billing.SubscriptionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 종료 정책은 유효 구독 메서드만 부르고 tenants.subscription_status 는 보지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("TenantClosePolicy")
class TenantClosePolicyTest {

    private static final String TENANT_ID = "tenant-close-policy";
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 3, 15, 9, 0);

    @Mock
    private SubscriptionService subscriptionService;

    @Mock
    private AuditTenantSuspendedAtResolver suspendedAtResolver;

    @Mock
    private TenantCloseProperties tenantCloseProperties;

    @InjectMocks
    private TenantClosePolicy tenantClosePolicy;

    @Test
    @DisplayName("subscription_status 가 ACTIVE 여도 유효 구독이 없으면 유예 경과 시 허용")
    void ignoresTenantSubscriptionStatusColumn() {
        Tenant tenant = suspendedTenant();
        tenant.setSubscriptionStatus("ACTIVE");
        when(tenantCloseProperties.getGraceDays()).thenReturn(TenantCloseProperties.DEFAULT_GRACE_DAYS);
        when(suspendedAtResolver.findSuspendedAt(TENANT_ID))
                .thenReturn(Optional.of(NOW.minusDays(TenantCloseProperties.DEFAULT_GRACE_DAYS)));
        when(subscriptionService.hasEffectiveSubscription(TENANT_ID, NOW.toLocalDate())).thenReturn(false);

        TenantCloseDecision decision = tenantClosePolicy.evaluate(tenant, NOW);

        assertThat(decision).isEqualTo(TenantCloseDecision.ALLOWED);
        verify(subscriptionService).hasEffectiveSubscription(TENANT_ID, LocalDate.of(2026, 3, 15));
    }

    @Test
    @DisplayName("유효 구독이 있으면 거절")
    void effectiveSubscriptionBlocks() {
        Tenant tenant = suspendedTenant();
        when(tenantCloseProperties.getGraceDays()).thenReturn(TenantCloseProperties.DEFAULT_GRACE_DAYS);
        when(suspendedAtResolver.findSuspendedAt(TENANT_ID)).thenReturn(Optional.of(NOW.minusDays(40)));
        when(subscriptionService.hasEffectiveSubscription(TENANT_ID, NOW.toLocalDate())).thenReturn(true);

        assertThat(tenantClosePolicy.evaluate(tenant, NOW)).isEqualTo(TenantCloseDecision.ACTIVE_SUBSCRIPTION);
    }

    private static Tenant suspendedTenant() {
        return Tenant.builder()
                .tenantId(TENANT_ID)
                .name("정책 센터")
                .businessType("CONSULTATION")
                .status(TenantStatus.SUSPENDED)
                .build();
    }
}
