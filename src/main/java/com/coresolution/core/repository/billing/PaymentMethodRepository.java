package com.coresolution.core.repository.billing;

import com.coresolution.core.domain.billing.PaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 결제 수단 Repository
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Repository
public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, Long> {
    
    /**
     * 결제 수단 ID로 조회
     */
    Optional<PaymentMethod> findByPaymentMethodId(String paymentMethodId);
    
    /**
     * 테넌트 ID로 활성 결제 수단 조회
     */
    List<PaymentMethod> findByTenantIdAndIsActiveTrueAndIsDeletedFalse(String tenantId);
    
    /**
     * 테넌트의 기본 결제 수단 조회
     */
    Optional<PaymentMethod> findByTenantIdAndIsDefaultTrueAndIsActiveTrueAndIsDeletedFalse(String tenantId);
}

