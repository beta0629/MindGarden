package com.coresolution.core.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 역할별 메뉴 권한 엔티티
 * 
 * 관리자가 역할별로 메뉴 접근 권한을 동적으로 설정
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-12-03
 */
@Entity
@Table(name = "role_menu_permissions", indexes = {
    @Index(name = "idx_tenant", columnList = "tenant_id"),
    @Index(name = "idx_role", columnList = "tenant_role_id"),
    @Index(name = "idx_menu", columnList = "menu_id"),
    @Index(name = "idx_active", columnList = "is_active")
}, uniqueConstraints = {
    @UniqueConstraint(
        name = "uk_tenant_role_menu",
        columnNames = {"tenant_id", "tenant_role_id", "menu_id"}
    )
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleMenuPermission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;

    @Column(name = "tenant_role_id", nullable = false, length = 36)
    private String tenantRoleId;

    @Column(name = "menu_id", nullable = false)
    private Long menuId;

    @Column(name = "can_view")
    @Builder.Default
    private Boolean canView = true;

    @Column(name = "can_create")
    @Builder.Default
    private Boolean canCreate = false;

    @Column(name = "can_update")
    @Builder.Default
    private Boolean canUpdate = false;

    @Column(name = "can_delete")
    @Builder.Default
    private Boolean canDelete = false;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "assigned_by", length = 100)
    private String assignedBy;

    @Column(name = "assigned_at")
    private LocalDateTime assignedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (assignedAt == null) {
            assignedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * 모든 권한이 있는지 확인
     */
    public boolean hasAllPermissions() {
        return Boolean.TRUE.equals(canView) 
            && Boolean.TRUE.equals(canCreate)
            && Boolean.TRUE.equals(canUpdate)
            && Boolean.TRUE.equals(canDelete);
    }

    /**
     * 읽기 전용 권한인지 확인
     */
    public boolean isReadOnly() {
        return Boolean.TRUE.equals(canView)
            && Boolean.FALSE.equals(canCreate)
            && Boolean.FALSE.equals(canUpdate)
            && Boolean.FALSE.equals(canDelete);
    }

    /**
     * 권한이 있는지 확인
     */
    public boolean hasPermission() {
        return Boolean.TRUE.equals(isActive) && Boolean.TRUE.equals(canView);
    }
}

