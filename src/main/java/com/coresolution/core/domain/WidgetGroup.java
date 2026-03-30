package com.coresolution.core.domain;

import lombok.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 위젯 그룹 엔티티
 * 
 * 목적: 업종별/역할별 위젯 그룹 관리
 * 표준: DATABASE_SCHEMA_STANDARD.md 준수
 * 
 * @author CoreSolution Team
 * @since 2025-12-02
 */
@Entity
@Table(name = "widget_groups", indexes = {
    @Index(name = "idx_tenant_id", columnList = "tenant_id"),
    @Index(name = "idx_business_type_role", columnList = "business_type, role_code"),
    @Index(name = "idx_tenant_business_role", columnList = "tenant_id, business_type, role_code"),
    @Index(name = "idx_is_active", columnList = "is_active"),
    @Index(name = "idx_is_deleted", columnList = "is_deleted"),
    @Index(name = "idx_display_order", columnList = "display_order")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WidgetGroup {
    
    /**
     * 위젯 그룹 ID (UUID)
     */
    @Id
    @Column(name = "group_id", length = 50, nullable = false)
    private String groupId;
    
    /**
     * 테넌트 ID
     * NULL이면 시스템 그룹 (모든 테넌트 공통)
     */
    @Column(name = "tenant_id", length = 50)
    private String tenantId;
    
    /**
     * 그룹명
     */
    @Column(name = "group_name", length = 100, nullable = false)
    private String groupName;
    
    /**
     * 그룹명 (한글)
     */
    @Column(name = "group_name_ko", length = 100, nullable = false)
    private String groupNameKo;
    
    /**
     * 그룹명 (영문)
     */
    @Column(name = "group_name_en", length = 100)
    private String groupNameEn;
    
    /**
     * 업종 (CONSULTATION, ACADEMY, HOSPITAL, FOOD_SERVICE, RETAIL)
     */
    @Column(name = "business_type", length = 50, nullable = false)
    private String businessType;
    
    /**
     * 역할 코드 (ADMIN, CONSULTANT, CLIENT, STAFF)
     */
    @Column(name = "role_code", length = 50, nullable = false)
    private String roleCode;
    
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
    }
    
    /**
     * 엔티티 수정 전 처리
     */
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    /**
     * 시스템 그룹 여부 확인
     */
    public boolean isSystemGroup() {
        return tenantId == null;
    }
}

