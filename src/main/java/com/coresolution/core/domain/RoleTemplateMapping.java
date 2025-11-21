package com.coresolution.core.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 역할 템플릿 매핑 엔티티
 * 업종별 템플릿 자동 매핑
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Entity
@Table(name = "role_template_mappings",
       uniqueConstraints = @UniqueConstraint(columnNames = {"role_template_id", "business_type"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleTemplateMapping {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * 역할 템플릿 ID
     */
    @Column(name = "role_template_id", length = 36, nullable = false)
    private String roleTemplateId;
    
    /**
     * 업종 코드
     */
    @Column(name = "business_type", length = 50, nullable = false)
    private String businessType;
    
    /**
     * 우선순위 (낮을수록 높음)
     */
    @Column(name = "priority")
    @Builder.Default
    private Integer priority = 0;
    
    /**
     * 기본 템플릿 여부
     */
    @Column(name = "is_default")
    @Builder.Default
    private Boolean isDefault = false;
    
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
     * 역할 템플릿 (참조)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_template_id", referencedColumnName = "role_template_id", insertable = false, updatable = false)
    private RoleTemplate roleTemplate;
    
    // 비즈니스 메서드
    
    /**
     * 기본 템플릿 확인
     */
    public boolean isDefault() {
        return isDefault != null && isDefault;
    }
}

