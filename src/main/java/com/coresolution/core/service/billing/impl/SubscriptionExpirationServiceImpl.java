package com.coresolution.core.service.billing.impl;

import com.coresolution.core.domain.TenantSubscription;
import com.coresolution.core.repository.billing.TenantSubscriptionRepository;
import com.coresolution.core.service.billing.SubscriptionExpirationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 구독 만료 처리 서비스 구현체
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SubscriptionExpirationServiceImpl implements SubscriptionExpirationService {
    
    private final TenantSubscriptionRepository subscriptionRepository;
    
    @Override
    public int processExpiredSubscriptions() {
        log.info("만료된 구독 처리 시작");
        
        LocalDate today = LocalDate.now();
        List<TenantSubscription> expiredSubscriptions = subscriptionRepository
                .findByTenantIdAndStatusAndIsDeletedFalse(null, TenantSubscription.SubscriptionStatus.ACTIVE)
                .stream()
                .filter(sub -> sub.getEffectiveTo() != null && sub.getEffectiveTo().isBefore(today))
                .collect(Collectors.toList());
        
        int processedCount = 0;
        for (TenantSubscription subscription : expiredSubscriptions) {
            try {
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
    
    @Override
    @Transactional(readOnly = true)
    public List<String> findSubscriptionsExpiringWithin(int days) {
        LocalDate targetDate = LocalDate.now().plusDays(days);
        
        return subscriptionRepository
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
                .findByTenantIdAndStatusAndIsDeletedFalse(null, TenantSubscription.SubscriptionStatus.ACTIVE)
                .stream()
                .filter(sub -> sub.getEffectiveTo() != null && sub.getEffectiveTo().isBefore(finalDate))
                .map(TenantSubscription::getSubscriptionId)
                .collect(Collectors.toList());
    }
}

