package com.coresolution.core.tenant;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.coresolution.core.domain.Tenant;
import com.coresolution.core.service.billing.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * 종료 가능 여부. 유효 구독은 {@link SubscriptionService#hasEffectiveSubscription} 만 부른다.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@Component
@RequiredArgsConstructor
public class TenantClosePolicy {

    private final SubscriptionService subscriptionService;
    private final AuditTenantSuspendedAtResolver suspendedAtResolver;
    private final TenantCloseProperties tenantCloseProperties;

    /**
     * @param tenant 종료 대상
     * @param now    판정 시각 (Asia/Seoul)
     * @return 판정
     */
    public TenantCloseDecision evaluate(Tenant tenant, LocalDateTime now) {
        LocalDate today = now == null ? null : now.toLocalDate();
        boolean hasEffectiveSubscription = subscriptionService.hasEffectiveSubscription(
                tenant.getTenantId(), today);
        LocalDateTime suspendedAt = suspendedAtResolver.findSuspendedAt(tenant.getTenantId())
                .orElse(null);
        return TenantCloseRules.evaluate(
                tenant.getStatus(),
                suspendedAt,
                now,
                tenantCloseProperties.getGraceDays(),
                hasEffectiveSubscription);
    }
}
