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
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class TenantRole extends BaseEntity {
    
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
    @Builder.Default
    private Boolean isActive = true;
    
    /**
     * 표시 순서
     */
    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;
    
    /**
     * 테넌트 (참조)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", referencedColumnName = "tenant_id", insertable = false, updatable = false)
    private Tenant tenant;
    
    /**
     * 역할 템플릿 (참조)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_template_id", referencedColumnName = "role_template_id", insertable = false, updatable = false)
    private RoleTemplate roleTemplate;
    
    /**
     * 역할 권한 목록
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

