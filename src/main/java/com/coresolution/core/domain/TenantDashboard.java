package com.coresolution.core.domain;

import com.coresolution.consultation.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

/**
 * 테넌트 대시보드 엔티티
 * 테넌트별 역할별 대시보드 설정
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Entity
@Table(name = "tenant_dashboards",
       indexes = {
           @Index(name = "idx_tenant_dashboard_tenant_id", columnList = "tenant_id"),
           @Index(name = "idx_tenant_dashboard_tenant_role_id", columnList = "tenant_role_id"),
           @Index(name = "idx_tenant_dashboard_is_active", columnList = "is_active"),
           @Index(name = "idx_tenant_dashboard_display_order", columnList = "display_order")
       },
       uniqueConstraints = {
           @UniqueConstraint(name = "uk_tenant_dashboard_role", 
                           columnNames = {"tenant_id", "tenant_role_id"})
       })
@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class TenantDashboard extends BaseEntity {
    
    /**
     * 대시보드 ID (UUID)
     */
    @Column(name = "dashboard_id", length = 36, unique = true, nullable = false)
    private String dashboardId;
    
    /**
     * 테넌트 ID
     */
    @Column(name = "tenant_id", length = 36, nullable = false)
    private String tenantId;
    
    /**
     * 테넌트 역할 ID (이 대시보드를 볼 수 있는 역할)
     */
    @Column(name = "tenant_role_id", length = 36, nullable = false)
    private String tenantRoleId;
    
    /**
     * 대시보드 이름 (테넌트 관리자가 설정 가능)
     */
    @Column(name = "dashboard_name", nullable = false, length = 255)
    private String dashboardName;
    
    /**
     * 대시보드 이름 (한글)
     */
    @Column(name = "dashboard_name_ko", length = 255)
    private String dashboardNameKo;
    
    /**
     * 대시보드 이름 (영문)
     */
    @Column(name = "dashboard_name_en", length = 255)
    private String dashboardNameEn;
    
    /**
     * 대시보드 설명
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    /**
     * 대시보드 타입 (STUDENT, TEACHER, ADMIN 등)
     */
    @Column(name = "dashboard_type", length = 50)
    private String dashboardType;
    
    /**
     * 기본 대시보드 여부 (온보딩 시 자동 생성된 대시보드)
     */
    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private Boolean isDefault = false;
    
    /**
     * 활성화 여부
     */
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
    
    /**
     * 표시 순서
     */
    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;
    
    /**
     * 대시보드 설정 (JSON) - 위젯 구성, 레이아웃 등
     */
    @Column(name = "dashboard_config", columnDefinition = "JSON")
    private String dashboardConfig;
    
    /**
     * 테넌트 (참조)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", referencedColumnName = "tenant_id", 
                insertable = false, updatable = false,
                foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private Tenant tenant;
    
    /**
     * 테넌트 역할 (참조)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_role_id", referencedColumnName = "tenant_role_id", 
                insertable = false, updatable = false,
                foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private TenantRole tenantRole;
}

