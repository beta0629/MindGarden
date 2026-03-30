package com.coresolution.core.repository.billing;

import com.coresolution.core.domain.TenantSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 테넌트 구독 Repository
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Repository
public interface TenantSubscriptionRepository extends JpaRepository<TenantSubscription, Long> {
    
    /**
     * 구독 ID로 조회
     */
    Optional<TenantSubscription> findBySubscriptionId(String subscriptionId);
    
    /**
     * 테넌트 ID로 활성 구독 조회
     */
    List<TenantSubscription> findByTenantIdAndIsDeletedFalse(String tenantId);
    
    /**
     * 테넌트 ID로 활성 구독 조회 (ACTIVE 상태만)
     */
    List<TenantSubscription> findByTenantIdAndStatusAndIsDeletedFalse(
            String tenantId, 
            TenantSubscription.SubscriptionStatus status);
    
    /**
     * 테넌트 ID로 최신 구독 조회
     */
    Optional<TenantSubscription> findFirstByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId);
}

