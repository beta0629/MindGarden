package com.coresolution.core.service.billing.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;

import com.coresolution.core.domain.TenantSubscription;
import com.coresolution.core.domain.TenantSubscription.SubscriptionStatus;
import com.coresolution.core.repository.billing.TenantSubscriptionRepository;
import com.coresolution.core.tenant.TenantAccessDecision;
import com.coresolution.core.tenant.TenantAccessEvaluator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 구독 만료 스케줄은 정지·종료 테넌트를 건너뛴다.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SubscriptionExpirationServiceImpl 접근 차단")
class SubscriptionExpirationServiceImplAccessTest {

    private static final String TENANT_ID = "tenant-expire-blocked";

    @Mock
    private TenantSubscriptionRepository subscriptionRepository;

    @Mock
    private TenantAccessEvaluator tenantAccessEvaluator;

    @Test
    @DisplayName("SUSPENDED 테넌트 구독은 만료 처리하지 않음")
    void suspendedTenantSkipped() {
        TenantSubscription subscription = TenantSubscription.builder()
                .subscriptionId("sub-expired")
                .tenantId(TENANT_ID)
                .planId("plan-1")
                .status(SubscriptionStatus.ACTIVE)
                .effectiveFrom(LocalDate.now().minusDays(40))
                .effectiveTo(LocalDate.now().minusDays(1))
                .build();
        when(subscriptionRepository.findByTenantIdAndStatusAndIsDeletedFalse(null, SubscriptionStatus.ACTIVE))
                .thenReturn(List.of(subscription));
        when(tenantAccessEvaluator.decide(TENANT_ID, null)).thenReturn(TenantAccessDecision.DENY_SUSPENDED);

        SubscriptionExpirationServiceImpl service = new SubscriptionExpirationServiceImpl(subscriptionRepository);
        service.setTenantAccessEvaluator(tenantAccessEvaluator);

        int processed = service.processExpiredSubscriptions();

        assertThat(processed).isZero();
        assertThat(subscription.getStatus()).isEqualTo(SubscriptionStatus.ACTIVE);
        verify(subscriptionRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }
}
