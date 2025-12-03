package com.coresolution.core.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 메뉴 엔티티
 * 
 * 계층형 메뉴 구조 지원
 * - 일반 대시보드 메뉴 (모든 역할)
 * - 관리자 전용 메뉴 (ADMIN만)
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-12-03
 */
@Entity
@Table(name = "menus", indexes = {
    @Index(name = "idx_parent", columnList = "parent_menu_id"),
    @Index(name = "idx_role", columnList = "required_role"),
    @Index(name = "idx_min_role", columnList = "min_required_role"),
    @Index(name = "idx_location", columnList = "menu_location"),
    @Index(name = "idx_admin_only", columnList = "is_admin_only"),
    @Index(name = "idx_active", columnList = "is_active")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Menu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "menu_code", nullable = false, unique = true, length = 50)
    private String menuCode;

    @Column(name = "menu_name", nullable = false, length = 100)
    private String menuName;

    @Column(name = "menu_name_en", length = 100)
    private String menuNameEn;

    @Column(name = "menu_path", length = 200)
    private String menuPath;

    @Column(name = "parent_menu_id")
    private Long parentMenuId;

    @Column(name = "depth")
    @Builder.Default
    private Integer depth = 0;

    @Column(name = "required_role", nullable = false, length = 50)
    private String requiredRole;

    @Column(name = "min_required_role", nullable = false, length = 50)
    @Builder.Default
    private String minRequiredRole = "CLIENT";

    @Column(name = "menu_location", nullable = false, length = 20)
    @Builder.Default
    private String menuLocation = "DASHBOARD";

    @Column(name = "is_admin_only")
    @Builder.Default
    private Boolean isAdminOnly = false;

    @Column(name = "icon", length = 50)
    private String icon;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;

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
     * 관리자 전용 메뉴인지 확인
     */
    public boolean isAdminOnlyMenu() {
        return Boolean.TRUE.equals(isAdminOnly);
    }

    /**
     * 최상위 메뉴인지 확인
     */
    public boolean isRootMenu() {
        return parentMenuId == null || depth == 0;
    }

    /**
     * 활성 상태인지 확인
     */
    public boolean isActiveMenu() {
        return Boolean.TRUE.equals(isActive);
    }
}

