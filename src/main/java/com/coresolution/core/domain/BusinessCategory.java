package com.coresolution.core.domain;

import java.util.List;
import com.coresolution.consultation.entity.BaseEntity;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * 업종 대분류 카테고리 엔티티
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Entity
@Table(name = "business_categories")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "categoryItems", "parentCategory", "childCategories"})
public class BusinessCategory extends BaseEntity {
    
    /**
     * 카테고리 UUID (고유 식별자)
     */
    @Column(name = "category_id", length = 36, unique = true, nullable = false)
    private String categoryId;
    
    /**
     * 카테고리 코드 (고유 코드)
     */
    @Column(name = "category_code", length = 50, unique = true, nullable = false)
    private String categoryCode;
    
    /**
     * 카테고리명 (한글)
     */
    @Column(name = "name_ko", nullable = false, length = 255)
    private String nameKo;
    
    /**
     * 카테고리명 (영문)
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
     * 상위 카테고리 ID (다단계 계층 지원)
     */
    @Column(name = "parent_category_id", length = 36)
    private String parentCategoryId;
    
    /**
     * 계층 레벨 (1=대분류, 2=중분류, 3=소분류)
     */
    @Column(name = "level")
    @Builder.Default
    private Integer level = 1;
    
    /**
     * 카테고리별 메타데이터 (컴포넌트 매핑, 요금제 추천 등)
     */
    @Column(name = "metadata_json", columnDefinition = "JSON")
    private String metadataJson;
    
    /**
     * 카테고리별 설정 (온보딩 플로우, 권한 템플릿 등)
     */
    @Column(name = "settings_json", columnDefinition = "JSON")
    private String settingsJson;
    
    /**
     * 상위 카테고리 (자기 참조)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_category_id", referencedColumnName = "category_id", insertable = false, updatable = false)
    private BusinessCategory parentCategory;
    
    /**
     * 하위 카테고리 목록
     */
    @OneToMany(mappedBy = "parentCategory", fetch = FetchType.LAZY)
    private List<BusinessCategory> childCategories;
    
    /**
     * 카테고리 아이템 목록
     */
    @OneToMany(mappedBy = "category", fetch = FetchType.LAZY)
    private List<BusinessCategoryItem> categoryItems;
    
    // 비즈니스 메서드
    
    /**
     * 활성 상태 확인
     */
    public boolean isActive() {
        return isActive != null && isActive && !isDeleted();
    }
    
    /**
     * 루트 카테고리 확인 (상위 카테고리가 없음)
     */
    public boolean isRoot() {
        return parentCategoryId == null || parentCategoryId.isEmpty();
    }
}

