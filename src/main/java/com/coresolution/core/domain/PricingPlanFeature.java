package com.coresolution.core.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 요금제별 기능/한도 엔티티
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Entity
@Table(name = "pricing_plan_features",
       uniqueConstraints = @UniqueConstraint(columnNames = {"plan_id", "feature_code"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PricingPlanFeature {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * 요금제 ID
     */
    @Column(name = "plan_id", length = 36, nullable = false)
    private String planId;
    
    /**
     * 기능 코드
     */
    @Column(name = "feature_code", length = 50, nullable = false)
    private String featureCode;
    
    /**
     * 기능명
     */
    @Column(name = "feature_name", nullable = false, length = 255)
    private String featureName;
    
    /**
     * 기능명 (한글)
     */
    @Column(name = "feature_name_ko", length = 255)
    private String featureNameKo;
    
    /**
     * 기능명 (영문)
     */
    @Column(name = "feature_name_en", length = 255)
    private String featureNameEn;
    
    /**
     * 기능 레벨 (BASIC, STANDARD, PREMIUM, UNLIMITED)
     */
    @Column(name = "feature_level", length = 50)
    private String featureLevel;
    
    /**
     * 포함 여부
     */
    @Column(name = "included_flag")
    @Builder.Default
    private Boolean includedFlag = true;
    
    /**
     * 한도 값 (NULL이면 무제한)
     */
    @Column(name = "limit_value")
    private Long limitValue;
    
    /**
     * 한도 단위
     */
    @Column(name = "limit_unit", length = 50)
    private String limitUnit;
    
    /**
     * 비고
     */
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
    
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
     * 요금제 (참조)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", referencedColumnName = "plan_id", insertable = false, updatable = false)
    private PricingPlan plan;
    
    // 비즈니스 메서드
    
    /**
     * 무제한 여부 확인
     */
    public boolean isUnlimited() {
        return limitValue == null;
    }
}

