package com.coresolution.core.domain;

import com.coresolution.consultation.entity.BaseEntity;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * 업종 소분류 카테고리 아이템 엔티티
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Entity
@Table(name = "business_category_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "category"})
public class BusinessCategoryItem extends BaseEntity {
    
    /**
     * 카테고리 아이템 UUID (고유 식별자)
     */
    @Column(name = "item_id", length = 36, unique = true, nullable = false)
    private String itemId;
    
    /**
     * 대분류 카테고리 ID
     */
    @Column(name = "category_id", length = 36, nullable = false)
    private String categoryId;
    
    /**
     * 아이템 코드 (고유 코드)
     */
    @Column(name = "item_code", length = 50, unique = true, nullable = false)
    private String itemCode;
    
    /**
     * 아이템명 (한글)
     */
    @Column(name = "name_ko", nullable = false, length = 255)
    private String nameKo;
    
    /**
     * 아이템명 (영문)
     */
    @Column(name = "name_en", length = 255)
    private String nameEn;
    
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
     * business_type 코드 (tenants.business_type과 매핑)
     */
    @Column(name = "business_type", length = 50, nullable = false)
    private String businessType;
    
    /**
     * 아이콘 URL
     */
    @Column(name = "icon_url", length = 500)
    private String iconUrl;
    
    /**
     * 표시 순서
     */
    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;
    
    /**
     * 활성화 여부
     */
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
    
    /**
     * 기본 컴포넌트 목록 (자동 활성화) - JSON
     */
    @Column(name = "default_components_json", columnDefinition = "JSON")
    private String defaultComponentsJson;
    
    /**
     * 추천 요금제 ID 목록 - JSON
     */
    @Column(name = "recommended_plan_ids_json", columnDefinition = "JSON")
    private String recommendedPlanIdsJson;
    
    /**
     * 기본 역할 템플릿 ID 목록 - JSON
     */
    @Column(name = "default_role_template_ids_json", columnDefinition = "JSON")
    private String defaultRoleTemplateIdsJson;
    
    /**
     * 온보딩 플로우 설정 - JSON
     */
    @Column(name = "onboarding_flow_json", columnDefinition = "JSON")
    private String onboardingFlowJson;
    
    /**
     * 카테고리별 Feature Flag 기본값 - JSON
     */
    @Column(name = "feature_flags_json", columnDefinition = "JSON")
    private String featureFlagsJson;
    
    /**
     * 추가 메타데이터 (통계, 분석 등) - JSON
     */
    @Column(name = "metadata_json", columnDefinition = "JSON")
    private String metadataJson;
    
    /**
     * 대분류 카테고리 (참조)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", referencedColumnName = "category_id", insertable = false, updatable = false)
    private BusinessCategory category;
    
    // 비즈니스 메서드
    
    /**
     * 활성 상태 확인
     */
    public boolean isActive() {
        return isActive != null && isActive && !isDeleted();
    }
}

