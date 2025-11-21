package com.coresolution.core.domain;

import com.coresolution.consultation.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 테넌트 구독 엔티티
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Entity
@Table(name = "tenant_subscriptions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class TenantSubscription extends BaseEntity {
    
    /**
     * 구독 상태 열거형
     */
    public enum SubscriptionStatus {
        DRAFT("초안"),
        PENDING_ACTIVATION("활성화 대기"),
        INACTIVE("비활성"),
        ACTIVE("활성"),
        SUSPENDED("일시정지"),
        CANCELLED("취소"),
        TERMINATED("종료");
        
        private final String description;
        
        SubscriptionStatus(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 청구 주기 열거형
     */
    public enum BillingCycle {
        MONTHLY("월간"),
        QUARTERLY("분기"),
        YEARLY("연간");
        
        private final String description;
        
        BillingCycle(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 구독 UUID (고유 식별자)
     */
    @Column(name = "subscription_id", length = 36, unique = true, nullable = false)
    private String subscriptionId;
    
    /**
     * 테넌트 ID (온보딩 중이면 null, 승인 후 업데이트)
     */
    @Column(name = "tenant_id", length = 36, nullable = true)
    private String tenantId;
    
    /**
     * 요금제 ID
     */
    @Column(name = "plan_id", length = 36, nullable = false)
    private String planId;
    
    /**
     * 상태 (DRAFT, PENDING_ACTIVATION, ACTIVE, SUSPENDED, CANCELLED, TERMINATED)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    @Builder.Default
    private SubscriptionStatus status = SubscriptionStatus.DRAFT;
    
    /**
     * 유효 시작일
     */
    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;
    
    /**
     * 유효 종료일
     */
    @Column(name = "effective_to")
    private LocalDate effectiveTo;
    
    /**
     * 청구 주기
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "billing_cycle", length = 20)
    @Builder.Default
    private BillingCycle billingCycle = BillingCycle.MONTHLY;
    
    /**
     * 결제 수단
     */
    @Column(name = "payment_method", length = 50)
    private String paymentMethod;
    
    /**
     * 자동 갱신 여부
     */
    @Column(name = "auto_renewal")
    @Builder.Default
    private Boolean autoRenewal = true;
    
    /**
     * 다음 청구일
     */
    @Column(name = "next_billing_date")
    private LocalDate nextBillingDate;
    
    /**
     * 테넌트 (참조)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", referencedColumnName = "tenant_id", insertable = false, updatable = false)
    private Tenant tenant;
    
    /**
     * 요금제 (참조)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", referencedColumnName = "plan_id", insertable = false, updatable = false)
    private PricingPlan plan;
    
    // 비즈니스 메서드
    
    /**
     * 활성 상태 확인
     */
    public boolean isActive() {
        return status == SubscriptionStatus.ACTIVE && !isDeleted();
    }
    
    /**
     * 유효 기간 확인
     */
    public boolean isEffective(LocalDate date) {
        if (date == null) {
            date = LocalDate.now();
        }
        return effectiveFrom != null && 
               !date.isBefore(effectiveFrom) && 
               (effectiveTo == null || !date.isAfter(effectiveTo));
    }
}

