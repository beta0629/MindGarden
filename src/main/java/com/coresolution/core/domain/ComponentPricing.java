package com.coresolution.core.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 컴포넌트 과금 정책 엔티티
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Entity
@Table(name = "component_pricing")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComponentPricing {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * 컴포넌트 ID
     */
    @Column(name = "component_id", length = 36, nullable = false)
    private String componentId;
    
    /**
     * 과금 유형 (FIXED, USAGE, TIERED 등)
     */
    @Column(name = "pricing_type", length = 50, nullable = false)
    private String pricingType;
    
    /**
     * 기본 요금
     */
    @Column(name = "fee_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal feeAmount = BigDecimal.ZERO;
    
    /**
     * 통화
     */
    @Column(name = "currency", length = 10)
    @Builder.Default
    private String currency = "KRW";
    
    /**
     * 사용량 단위 (API_CALL, USER_COUNT, STORAGE_GB 등)
     */
    @Column(name = "usage_unit", length = 50)
    private String usageUnit;
    
    /**
     * 사용량 한도
     */
    @Column(name = "usage_limit")
    private Integer usageLimit;
    
    /**
     * 초과 사용 요금률
     */
    @Column(name = "overage_rate", precision = 15, scale = 2)
    private BigDecimal overageRate;
    
    /**
     * 요금제에 기본 포함 여부
     */
    @Column(name = "is_included_in_plan")
    @Builder.Default
    private Boolean isIncludedInPlan = false;
    
    /**
     * 적용 가능한 요금제 ID 목록 (JSON)
     */
    @Column(name = "pricing_plan_ids_json", columnDefinition = "JSON")
    private String pricingPlanIdsJson;
    
    /**
     * 추가 메타데이터 (JSON)
     */
    @Column(name = "metadata_json", columnDefinition = "JSON")
    private String metadataJson;
    
    /**
     * 생성일시
     */
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    /**
     * 수정일시
     */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    /**
     * 컴포넌트 (참조)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "component_id", referencedColumnName = "component_id", insertable = false, updatable = false)
    private ComponentCatalog component;
}

