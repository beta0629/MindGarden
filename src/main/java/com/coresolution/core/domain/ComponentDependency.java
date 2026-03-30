package com.coresolution.core.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 컴포넌트 의존성 엔티티
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Entity
@Table(name = "component_dependency",
       uniqueConstraints = @UniqueConstraint(columnNames = {"component_id", "required_component_id"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComponentDependency {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * 컴포넌트 ID
     */
    @Column(name = "component_id", length = 36, nullable = false)
    private String componentId;
    
    /**
     * 필수 컴포넌트 ID
     */
    @Column(name = "required_component_id", length = 36, nullable = false)
    private String requiredComponentId;
    
    /**
     * 의존성 유형 (REQUIRED, OPTIONAL, RECOMMENDED)
     */
    @Column(name = "dependency_type", length = 50, nullable = false)
    @Builder.Default
    private String dependencyType = "REQUIRED";
    
    /**
     * 선택적 의존성 여부
     */
    @Column(name = "is_optional")
    @Builder.Default
    private Boolean isOptional = false;
    
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
    
    /**
     * 필수 컴포넌트 (참조)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "required_component_id", referencedColumnName = "component_id", insertable = false, updatable = false)
    private ComponentCatalog requiredComponent;
}

