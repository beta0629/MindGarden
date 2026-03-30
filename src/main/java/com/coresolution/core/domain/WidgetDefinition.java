package com.coresolution.core.domain;

import lombok.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 위젯 정의 엔티티
 * 
 * 목적: 개별 위젯 정의 및 권한 관리
 * 표준: DATABASE_SCHEMA_STANDARD.md 준수
 * 
 * @author CoreSolution Team
 * @since 2025-12-02
 */
@Entity
@Table(name = "widget_definitions", indexes = {
    @Index(name = "idx_tenant_id", columnList = "tenant_id"),
    @Index(name = "idx_group_id", columnList = "group_id"),
    @Index(name = "idx_widget_type", columnList = "widget_type"),
    @Index(name = "idx_business_type_role", columnList = "business_type, role_code"),
    @Index(name = "idx_tenant_business_role", columnList = "tenant_id, business_type, role_code"),
    @Index(name = "idx_is_system_managed", columnList = "is_system_managed"),
    @Index(name = "idx_is_active", columnList = "is_active"),
    @Index(name = "idx_is_deleted", columnList = "is_deleted"),
    @Index(name = "idx_display_order", columnList = "display_order")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WidgetDefinition {
    
    /**
     * 위젯 ID (UUID)
     */
    @Id
    @Column(name = "widget_id", length = 50, nullable = false)
    private String widgetId;
    
    /**
     * 테넌트 ID
     * NULL이면 시스템 위젯 (모든 테넌트 공통)
     */
    @Column(name = "tenant_id", length = 50)
    private String tenantId;
    
    /**
     * 위젯 타입 (welcome, summary-panels, statistics-grid 등)
     */
    @Column(name = "widget_type", length = 100, nullable = false)
    private String widgetType;
    
    /**
     * 위젯명
     */
    @Column(name = "widget_name", length = 100, nullable = false)
    private String widgetName;
    
    /**
     * 위젯명 (한글)
     */
    @Column(name = "widget_name_ko", length = 100, nullable = false)
    private String widgetNameKo;
    
    /**
     * 위젯명 (영문)
     */
    @Column(name = "widget_name_en", length = 100)
    private String widgetNameEn;
    
    /**
     * 위젯 그룹 ID (NULL이면 독립 위젯)
     */
    @Column(name = "group_id", length = 50)
    private String groupId;
    
    /**
     * 업종
     */
    @Column(name = "business_type", length = 50, nullable = false)
    private String businessType;
    
    /**
     * 역할 코드 (NULL이면 모든 역할)
     */
    @Column(name = "role_code", length = 50)
    private String roleCode;
    
    /**
     * 기본 설정 (JSON)
     */
    @Column(name = "default_config", columnDefinition = "JSON")
    private String defaultConfig;
    
    /**
     * 표시 순서
     */
    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;
    
    /**
     * 설명
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    /**
     * 아이콘 이름
     */
    @Column(name = "icon_name", length = 50)
    private String iconName;
    
    /**
     * 시스템 관리 여부
     * TRUE: 시스템이 관리 (추가/삭제 불가)
     * FALSE: 사용자가 관리 (추가/삭제 가능)
     */
    @Column(name = "is_system_managed", nullable = false)
    private Boolean isSystemManaged = true;
    
    /**
     * 필수 위젯 여부
     */
    @Column(name = "is_required", nullable = false)
    private Boolean isRequired = false;
    
    /**
     * 삭제 가능 여부
     */
    @Column(name = "is_deletable", nullable = false)
    private Boolean isDeletable = false;
    
    /**
     * 이동 가능 여부
     */
    @Column(name = "is_movable", nullable = false)
    private Boolean isMovable = true;
    
    /**
     * 설정 변경 가능 여부
     */
    @Column(name = "is_configurable", nullable = false)
    private Boolean isConfigurable = true;
    
    /**
     * 활성화 여부
     */
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    /**
     * 생성일시
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    /**
     * 생성자
     */
    @Column(name = "created_by", length = 100)
    private String createdBy;
    
    /**
     * 수정일시
     */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    /**
     * 수정자
     */
    @Column(name = "updated_by", length = 100)
    private String updatedBy;
    
    /**
     * 삭제 여부 (소프트 삭제)
     */
    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;
    
    /**
     * 삭제일시
     */
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
    
    /**
     * 삭제자
     */
    @Column(name = "deleted_by", length = 100)
    private String deletedBy;
    
    /**
     * 엔티티 생성 전 처리
     */
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
        if (isActive == null) {
            isActive = true;
        }
        if (isDeleted == null) {
            isDeleted = false;
        }
        if (isSystemManaged == null) {
            isSystemManaged = true;
        }
        if (isRequired == null) {
            isRequired = false;
        }
        if (isDeletable == null) {
            isDeletable = false;
        }
        if (isMovable == null) {
            isMovable = true;
        }
        if (isConfigurable == null) {
            isConfigurable = true;
        }
    }
    
    /**
     * 엔티티 수정 전 처리
     */
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    /**
     * 시스템 위젯 여부 확인
     */
    public boolean isSystemWidget() {
        return tenantId == null;
    }
    
    /**
     * 독립 위젯 여부 확인 (그룹에 속하지 않음)
     */
    public boolean isIndependentWidget() {
        return groupId == null;
    }
}

