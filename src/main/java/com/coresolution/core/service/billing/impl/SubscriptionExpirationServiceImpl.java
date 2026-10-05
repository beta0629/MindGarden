package com.coresolution.core.service.billing.impl;
import com.coresolution.core.domain.TenantSubscription;
import com.coresolution.core.repository.billing.TenantSubscriptionRepository;
import com.coresolution.core.service.billing.SubscriptionExpirationService;
import com.coresolution.core.tenant.TenantAccessDecision;
import com.coresolution.core.tenant.TenantAccessEvaluator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

 /**
 * 구독 만료 처리 서비스 구현체
 /**
 * 
 /**
 * @author CoreSolution
 /**
 * @version 1.0.0
 /**
 * @since 2025-01-XX
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SubscriptionExpirationServiceImpl implements SubscriptionExpirationService {
    
    private final TenantSubscriptionRepository subscriptionRepository;
    private TenantAccessEvaluator tenantAccessEvaluator;

    /**
     * 정지·종료 테넌트는 만료 처리하지 않는다.
     *
     * @param tenantAccessEvaluator 접근 판정
     */
    @Autowired(required = false)
    public void setTenantAccessEvaluator(TenantAccessEvaluator tenantAccessEvaluator) {
        this.tenantAccessEvaluator = tenantAccessEvaluator;
    }
    
    @Override
    public int processExpiredSubscriptions() {
        log.info("만료된 구독 처리 시작");
        
        LocalDate today = LocalDate.now();
        List<TenantSubscription> expiredSubscriptions = subscriptionRepository
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                .findByTenantIdAndStatusAndIsDeletedFalse(null, TenantSubscription.SubscriptionStatus.ACTIVE)
                .stream()
                .filter(sub -> sub.getEffectiveTo() != null && sub.getEffectiveTo().isBefore(today))
                .collect(Collectors.toList());
        
        int processedCount = 0;
        for (TenantSubscription subscription : expiredSubscriptions) {
            try {
                if (isTenantAccessDenied(subscription.getTenantId())) {
                    log.info("테넌트 접근 차단으로 구독 만료 처리 생략: tenantId={}, subscriptionId={}",
                            subscription.getTenantId(), subscription.getSubscriptionId());
                    continue;
                }
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                subscription.setStatus(TenantSubscription.SubscriptionStatus.SUSPENDED);
                subscription.setAutoRenewal(false);
                subscriptionRepository.save(subscription);
                processedCount++;
                
                log.info("만료된 구독 처리: subscriptionId={}, effectiveTo={}", 
                    subscription.getSubscriptionId(), subscription.getEffectiveTo());
            } catch (Exception e) {
                log.error("만료된 구독 처리 실패: subscriptionId={}, error={}", 
                    subscription.getSubscriptionId(), e.getMessage(), e);
            }
        }
        
        log.info("만료된 구독 처리 완료: 총 {}개 처리", processedCount);
        return processedCount;
    }

    private boolean isTenantAccessDenied(String tenantId) {
        if (tenantAccessEvaluator == null) {
            return false;
        }
        TenantAccessDecision decision = tenantAccessEvaluator.decide(tenantId, null);
        return !decision.isAllowed();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<String> findSubscriptionsExpiringWithin(int days) {
        LocalDate targetDate = LocalDate.now().plusDays(days);
        
        return subscriptionRepository
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                .findByTenantIdAndStatusAndIsDeletedFalse(null, TenantSubscription.SubscriptionStatus.ACTIVE)
                .stream()
                .filter(sub -> sub.getEffectiveTo() != null && 
                              !sub.getEffectiveTo().isAfter(targetDate) &&
                              !sub.getEffectiveTo().isBefore(LocalDate.now()))
                .map(TenantSubscription::getSubscriptionId)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<String> findExpiredSubscriptions(LocalDate date) {
        if (date == null) {
            date = LocalDate.now();
        }
        
        final LocalDate finalDate = date;
        return subscriptionRepository
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                .findByTenantIdAndStatusAndIsDeletedFalse(null, TenantSubscription.SubscriptionStatus.ACTIVE)
                .stream()
                .filter(sub -> sub.getEffectiveTo() != null && sub.getEffectiveTo().isBefore(finalDate))
                .map(TenantSubscription::getSubscriptionId)
                .collect(Collectors.toList());
    }
}

