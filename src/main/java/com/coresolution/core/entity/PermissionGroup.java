package com.coresolution.core.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 권한 그룹 엔티티
 * 
 * 대시보드 섹션, 메뉴, 기능 단위로 권한을 그룹화
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-12-03
 */
@Entity
@Table(name = "permission_groups", indexes = {
    @Index(name = "idx_group_type", columnList = "group_type"),
    @Index(name = "idx_parent_group", columnList = "parent_group_code"),
    @Index(name = "idx_active", columnList = "is_active"),
    @Index(name = "idx_tenant", columnList = "tenant_id")
}, uniqueConstraints = {
    @UniqueConstraint(
        name = "uk_tenant_group_code",
        columnNames = {"tenant_id", "group_code"}
    )
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", length = 36)
    private String tenantId; // NULL = 시스템 그룹

    @Column(name = "group_code", nullable = false, length = 50)
    private String groupCode;

    @Column(name = "group_name", nullable = false, length = 100)
    private String groupName;

    @Column(name = "group_name_en", length = 100)
    private String groupNameEn;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "group_type", nullable = false, length = 20)
    private String groupType; // DASHBOARD_SECTION, MENU, FEATURE

    @Column(name = "parent_group_code", length = 50)
    private String parentGroupCode;

    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;

    @Column(name = "icon", length = 50)
    private String icon;

    @Column(name = "color_code", length = 7)
    private String colorCode;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * 시스템 그룹인지 확인 (tenant_id = NULL)
     */
    public boolean isSystemGroup() {
        return tenantId == null || tenantId.isEmpty();
    }

    /**
     * 테넌트 그룹인지 확인
     */
    public boolean isTenantGroup() {
        return !isSystemGroup();
    }

    /**
     * 최상위 그룹인지 확인
     */
    public boolean isRootGroup() {
        return parentGroupCode == null || parentGroupCode.isEmpty();
    }

    /**
     * 활성 상태인지 확인
     */
    public boolean isActiveGroup() {
        return Boolean.TRUE.equals(isActive);
    }
}

