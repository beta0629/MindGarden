package com.coresolution.core.service.billing.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;

import com.coresolution.core.domain.TenantSubscription;
import com.coresolution.core.domain.TenantSubscription.SubscriptionStatus;
import com.coresolution.core.repository.PricingPlanRepository;
import com.coresolution.core.repository.billing.PaymentMethodRepository;
import com.coresolution.core.repository.billing.TenantSubscriptionRepository;
import com.coresolution.core.service.billing.SubscriptionPlanChangeService;
import com.coresolution.core.service.billing.SubscriptionRefundService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 유효 구독 판정. 저장소가 돌려준 ACTIVE·미삭제 행에 isActive·isEffective 를 적용한다.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SubscriptionServiceImpl 유효 구독")
class SubscriptionServiceImplEffectiveSubscriptionTest {

    private static final String TENANT_ID = "tenant-subscription-effective";
    private static final LocalDate TODAY = LocalDate.of(2026, 5, 10);

    @Mock
    private TenantSubscriptionRepository subscriptionRepository;

    @Mock
    private PricingPlanRepository pricingPlanRepository;

    @Mock
    private PaymentMethodRepository paymentMethodRepository;

    @Mock
    private SubscriptionRefundService refundService;

    @Mock
    private SubscriptionPlanChangeService planChangeService;

    @InjectMocks
    private SubscriptionServiceImpl subscriptionService;

    @Test
    @DisplayName("오늘이 시작·종료일에 포함되면 유효")
    void effectiveOnBoundary() {
        when(subscriptionRepository.findByTenantIdAndStatusAndIsDeletedFalse(
                TENANT_ID, SubscriptionStatus.ACTIVE))
                .thenReturn(List.of(subscription(TODAY, TODAY)));

        assertThat(subscriptionService.hasEffectiveSubscription(TENANT_ID, TODAY)).isTrue();
    }

    @Test
    @DisplayName("종료일 다음 날이면 유효하지 않음")
    void dayAfterEffectiveToIsNotEffective() {
        when(subscriptionRepository.findByTenantIdAndStatusAndIsDeletedFalse(
                TENANT_ID, SubscriptionStatus.ACTIVE))
                .thenReturn(List.of(subscription(TODAY.minusDays(10), TODAY.minusDays(1))));

        assertThat(subscriptionService.hasEffectiveSubscription(TENANT_ID, TODAY)).isFalse();
    }

    @Test
    @DisplayName("시작일 전이면 유효하지 않음")
    void beforeEffectiveFromIsNotEffective() {
        when(subscriptionRepository.findByTenantIdAndStatusAndIsDeletedFalse(
                TENANT_ID, SubscriptionStatus.ACTIVE))
                .thenReturn(List.of(subscription(TODAY.plusDays(1), null)));

        assertThat(subscriptionService.hasEffectiveSubscription(TENANT_ID, TODAY)).isFalse();
    }

    @Test
    @DisplayName("행이 없으면 유효하지 않음")
    void emptyIsNotEffective() {
        when(subscriptionRepository.findByTenantIdAndStatusAndIsDeletedFalse(
                TENANT_ID, SubscriptionStatus.ACTIVE))
                .thenReturn(List.of());

        assertThat(subscriptionService.hasEffectiveSubscription(TENANT_ID, TODAY)).isFalse();
    }

    private static TenantSubscription subscription(LocalDate from, LocalDate to) {
        TenantSubscription subscription = TenantSubscription.builder()
                .subscriptionId("sub-1")
                .tenantId(TENANT_ID)
                .planId("plan-1")
                .status(SubscriptionStatus.ACTIVE)
                .effectiveFrom(from)
                .effectiveTo(to)
                .build();
        subscription.setIsDeleted(false);
        return subscription;
    }
}
