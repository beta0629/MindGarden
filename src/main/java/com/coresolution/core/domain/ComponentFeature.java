package com.coresolution.core.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 컴포넌트 기능 정의 엔티티
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Entity
@Table(name = "component_features", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"component_id", "feature_code"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComponentFeature {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * 컴포넌트 ID
     */
    @Column(name = "component_id", length = 36, nullable = false)
    private String componentId;
    
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
     * 의존성 정보 (JSON)
     */
    @Column(name = "dependency_json", columnDefinition = "JSON")
    private String dependencyJson;
    
    /**
     * 필수 컴포넌트 목록 (JSON)
     */
    @Column(name = "required_components_json", columnDefinition = "JSON")
    private String requiredComponentsJson;
    
    /**
     * 충돌 컴포넌트 목록 (JSON)
     */
    @Column(name = "conflicts_with_json", columnDefinition = "JSON")
    private String conflictsWithJson;
    
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
     * 컴포넌트 (참조)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "component_id", referencedColumnName = "component_id", insertable = false, updatable = false)
    private ComponentCatalog component;
}

