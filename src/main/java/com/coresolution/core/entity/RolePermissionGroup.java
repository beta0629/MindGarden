package com.coresolution.core.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 역할별 권한 그룹 엔티티
 * 
 * 역할에 권한 그룹을 부여하여 대시보드 섹션/메뉴/기능 접근 제어
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-12-03
 */
@Entity
@Table(name = "role_permission_groups", indexes = {
    @Index(name = "idx_tenant_role", columnList = "tenant_id,tenant_role_id"),
    @Index(name = "idx_group_code", columnList = "permission_group_code"),
    @Index(name = "idx_active", columnList = "is_active")
}, uniqueConstraints = {
    @UniqueConstraint(
        name = "uk_role_group",
        columnNames = {"tenant_id", "tenant_role_id", "permission_group_code"}
    )
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RolePermissionGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;

    @Column(name = "tenant_role_id", nullable = false, length = 36)
    private String tenantRoleId;

    @Column(name = "permission_group_code", nullable = false, length = 50)
    private String permissionGroupCode;

    @Column(name = "access_level", length = 20)
    @Builder.Default
    private String accessLevel = "READ"; // READ, WRITE, FULL

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "granted_at")
    private LocalDateTime grantedAt;

    @Column(name = "granted_by", length = 100)
    private String grantedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (grantedAt == null) {
            grantedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * FULL 접근 권한인지 확인
     */
    public boolean hasFullAccess() {
        return "FULL".equals(accessLevel);
    }

    /**
     * WRITE 이상 권한인지 확인
     */
    public boolean hasWriteAccess() {
        return hasFullAccess() || "WRITE".equals(accessLevel);
    }

    /**
     * READ 이상 권한인지 확인
     */
    public boolean hasReadAccess() {
        return hasWriteAccess() || "READ".equals(accessLevel);
    }

    /**
     * 활성 상태인지 확인
     */
    public boolean isActivePermission() {
        return Boolean.TRUE.equals(isActive) && hasReadAccess();
    }
}

