package com.coresolution.core.domain;

import com.coresolution.consultation.entity.BaseEntity;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * 요금제 정의 엔티티
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Entity
@Table(name = "pricing_plans")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "features", "subscriptions"})
public class PricingPlan extends BaseEntity {
    
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
     * 요금제 UUID (고유 식별자)
     */
    @Column(name = "plan_id", length = 36, unique = true, nullable = false)
    private String planId;
    
    /**
     * 요금제 코드 (STARTER, STANDARD, PREMIUM)
     */
    @Column(name = "plan_code", length = 50, unique = true, nullable = false)
    private String planCode;
    
    /**
     * 요금제명
     */
    @Column(name = "name", nullable = false, length = 255)
    private String name;
    
    /**
     * 요금제명 (한글)
     */
    @Column(name = "name_ko", length = 255)
    private String nameKo;
    
    /**
     * 요금제명 (영문)
     */
    @Column(name = "name_en", length = 255)
    private String nameEn;
    
    /**
     * 기본 요금
     */
    @Column(name = "base_fee", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal baseFee = BigDecimal.ZERO;
    
    /**
     * 통화
     */
    @Column(name = "currency", length = 10)
    @Builder.Default
    private String currency = "KRW";
    
    /**
     * 청구 주기
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "billing_cycle", length = 20)
    @Builder.Default
    private BillingCycle billingCycle = BillingCycle.MONTHLY;
    
    /**
     * 한도 정보 (JSON)
     */
    @Column(name = "limits_json", columnDefinition = "JSON")
    private String limitsJson;
    
    /**
     * 포함 기능 목록 (JSON)
     */
    @Column(name = "features_json", columnDefinition = "JSON")
    private String featuresJson;
    
    /**
     * 활성화 여부
     */
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
    
    /**
     * 표시 순서
     */
    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;
    
    /**
     * 설명
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    /**
     * 설명 (한글)
     */
    @Column(name = "description_ko", columnDefinition = "TEXT")
    private String descriptionKo;
    
    /**
     * 설명 (영문)
     */
    @Column(name = "description_en", columnDefinition = "TEXT")
    private String descriptionEn;
    
    /**
     * 요금제 기능 목록
     */
    @OneToMany(mappedBy = "plan", fetch = FetchType.LAZY)
    private List<PricingPlanFeature> features;
    
    /**
     * 테넌트 구독 목록
     */
    @OneToMany(mappedBy = "plan", fetch = FetchType.LAZY)
    private List<TenantSubscription> subscriptions;
    
    // 비즈니스 메서드
    
    /**
     * 활성 상태 확인
     */
    public boolean isActive() {
        return isActive != null && isActive && !isDeleted();
    }
}

