package com.coresolution.core.domain;

import com.mindgarden.consultation.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 컴포넌트 카탈로그 엔티티
 * 제공 컴포넌트 메타데이터
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Entity
@Table(name = "component_catalog")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ComponentCatalog extends BaseEntity {
    
    /**
     * 컴포넌트 UUID (고유 식별자)
     */
    @Column(name = "component_id", length = 36, unique = true, nullable = false)
    private String componentId;
    
    /**
     * 컴포넌트 코드 (고유 코드)
     */
    @Column(name = "component_code", length = 50, unique = true, nullable = false)
    private String componentCode;
    
    /**
     * 컴포넌트명
     */
    @Column(name = "name", nullable = false, length = 255)
    private String name;
    
    /**
     * 컴포넌트명 (한글)
     */
    @Column(name = "name_ko", length = 255)
    private String nameKo;
    
    /**
     * 컴포넌트명 (영문)
     */
    @Column(name = "name_en", length = 255)
    private String nameEn;
    
    /**
     * 카테고리 (CORE, ADDON, INTEGRATION 등)
     */
    @Column(name = "category", length = 50, nullable = false)
    private String category;
    
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
     * 핵심 컴포넌트 여부
     */
    @Column(name = "is_core")
    @Builder.Default
    private Boolean isCore = false;
    
    /**
     * 활성화 여부
     */
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
    
    /**
     * 컴포넌트 버전
     */
    @Column(name = "component_version", length = 20)
    private String componentVersion;
    
    /**
     * 표시 순서
     */
    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;
    
    /**
     * 아이콘 URL
     */
    @Column(name = "icon_url", length = 500)
    private String iconUrl;
    
    /**
     * 문서 URL
     */
    @Column(name = "documentation_url", length = 500)
    private String documentationUrl;
    
    /**
     * 스크린샷 URL 목록 (JSON)
     */
    @Column(name = "screenshot_urls", columnDefinition = "JSON")
    private String screenshotUrls;
    
    /**
     * 컴포넌트 기능 목록
     */
    @OneToMany(mappedBy = "component", fetch = FetchType.LAZY)
    private List<ComponentFeature> features;
    
    /**
     * 컴포넌트 과금 정책 목록
     */
    @OneToMany(mappedBy = "component", fetch = FetchType.LAZY)
    private List<ComponentPricing> pricingList;
    
    /**
     * 컴포넌트 의존성 목록
     */
    @OneToMany(mappedBy = "component", fetch = FetchType.LAZY)
    private List<ComponentDependency> dependencies;
    
    /**
     * 테넌트 컴포넌트 목록
     */
    @OneToMany(mappedBy = "component", fetch = FetchType.LAZY)
    private List<TenantComponent> tenantComponents;
    
    // 비즈니스 메서드
    
    /**
     * 활성 상태 확인
     */
    public boolean isActive() {
        return isActive != null && isActive && !isDeleted();
    }
    
    /**
     * 핵심 컴포넌트 확인
     */
    public boolean isCore() {
        return isCore != null && isCore;
    }
}

