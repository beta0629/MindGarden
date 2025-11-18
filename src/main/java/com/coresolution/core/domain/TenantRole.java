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
 * 테넌트 역할 엔티티
 * 테넌트 커스텀 역할 (템플릿 기반 복제)
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Entity
@Table(name = "tenant_roles")
@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class TenantRole extends BaseEntity {
    
    // 관계 필드를 제외한 생성자 (Builder용)
    @lombok.Builder(toBuilder = true, builderMethodName = "builder", buildMethodName = "build")
    public TenantRole(String tenantRoleId, String tenantId, String roleTemplateId,
                      String name, String nameKo, String nameEn,
                      String description, String descriptionKo, String descriptionEn,
                      Boolean isActive, Integer displayOrder) {
        this.tenantRoleId = tenantRoleId;
        this.tenantId = tenantId;
        this.roleTemplateId = roleTemplateId;
        this.name = name;
        this.nameKo = nameKo;
        this.nameEn = nameEn;
        this.description = description;
        this.descriptionKo = descriptionKo;
        this.descriptionEn = descriptionEn;
        this.isActive = isActive != null ? isActive : true;
        this.displayOrder = displayOrder != null ? displayOrder : 0;
    }
    
    /**
     * 테넌트 역할 UUID (고유 식별자)
     */
    @Column(name = "tenant_role_id", length = 36, unique = true, nullable = false)
    private String tenantRoleId;
    
    /**
     * 테넌트 ID
     */
    @Column(name = "tenant_id", length = 36, nullable = false)
    private String tenantId;
    
    /**
     * 역할 템플릿 ID (템플릿 기반 복제 시)
     */
    @Column(name = "role_template_id", length = 36)
    private String roleTemplateId;
    
    /**
     * 역할명
     */
    @Column(name = "name", nullable = false, length = 255)
    private String name;
    
    /**
     * 역할명 (한글)
     */
    @Column(name = "name_ko", length = 255)
    private String nameKo;
    
    /**
     * 역할명 (영문)
     */
    @Column(name = "name_en", length = 255)
    private String nameEn;
    
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
    private Boolean isActive = true;
    
    /**
     * 표시 순서
     */
    @Column(name = "display_order")
    private Integer displayOrder = 0;
    
    /**
     * 테넌트 (참조)
     * Note: @Builder에서 제외 (관계 필드, setter로 설정)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", referencedColumnName = "tenant_id", insertable = false, updatable = false)
    private Tenant tenant;
    
    /**
     * 역할 템플릿 (참조)
     * Note: 순환 참조 문제로 제거 (RoleTemplate이 TenantRole을 참조함)
     * roleTemplateId를 통해 Repository에서 조회하여 사용
     */
    // @ManyToOne(fetch = FetchType.LAZY)
    // @JoinColumn(name = "role_template_id", referencedColumnName = "role_template_id", insertable = false, updatable = false)
    // private RoleTemplate roleTemplate;
    
    /**
     * 역할 권한 목록
     * Note: @Builder에서 제외 (관계 필드, setter로 설정)
     */
    @OneToMany(mappedBy = "tenantRole", fetch = FetchType.LAZY)
    private List<RolePermission> permissions;
    
    // 비즈니스 메서드
    
    /**
     * 활성 상태 확인
     */
    public boolean isActive() {
        return isActive != null && isActive && !isDeleted();
    }
}

