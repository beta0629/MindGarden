package com.coresolution.core.domain;

import com.coresolution.consultation.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 역할 템플릿 엔티티
 * 업종별 기본 역할 템플릿
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Entity
@Table(name = "role_templates")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class RoleTemplate extends BaseEntity {
    
    /**
     * 역할 템플릿 UUID (고유 식별자)
     */
    @Column(name = "role_template_id", length = 36, unique = true, nullable = false)
    private String roleTemplateId;
    
    /**
     * 템플릿 코드 (고유 코드)
     */
    @Column(name = "template_code", length = 50, unique = true, nullable = false)
    private String templateCode;
    
    /**
     * 템플릿명
     */
    @Column(name = "name", nullable = false, length = 255)
    private String name;
    
    /**
     * 템플릿명 (한글)
     */
    @Column(name = "name_ko", length = 255)
    private String nameKo;
    
    /**
     * 템플릿명 (영문)
     */
    @Column(name = "name_en", length = 255)
    private String nameEn;
    
    /**
     * 업종 (ACADEMY, CONSULTATION 등)
     */
    @Column(name = "business_type", length = 50)
    private String businessType;
    
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
     * 시스템 템플릿 여부 (HQ가 정의한 필수 템플릿)
     */
    @Column(name = "is_system_template")
    @Builder.Default
    private Boolean isSystemTemplate = false;
    
    /**
     * 템플릿 권한 목록
     */
    @OneToMany(mappedBy = "roleTemplate", fetch = FetchType.LAZY)
    private List<RoleTemplatePermission> permissions;
    
    /**
     * 템플릿 매핑 목록
     */
    @OneToMany(mappedBy = "roleTemplate", fetch = FetchType.LAZY)
    private List<RoleTemplateMapping> mappings;
    
    /**
     * 테넌트 역할 목록 (이 템플릿을 기반으로 생성된 역할)
     */
    @OneToMany(mappedBy = "roleTemplate", fetch = FetchType.LAZY)
    private List<TenantRole> tenantRoles;
    
    // 비즈니스 메서드
    
    /**
     * 활성 상태 확인
     */
    public boolean isActive() {
        return isActive != null && isActive && !isDeleted();
    }
    
    /**
     * 시스템 템플릿 확인
     */
    public boolean isSystemTemplate() {
        return isSystemTemplate != null && isSystemTemplate;
    }
}

