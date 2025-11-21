package com.coresolution.core.domain;

import com.coresolution.consultation.entity.BaseEntity;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.Branch;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 사용자 역할 할당 엔티티
 * 사용자와 테넌트 역할의 매핑 (브랜치별 권한 지원)
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Entity
@Table(name = "user_role_assignments",
       indexes = {
           @Index(name = "idx_user_role_user_id", columnList = "user_id"),
           @Index(name = "idx_user_role_tenant_id", columnList = "tenant_id"),
           @Index(name = "idx_user_role_tenant_role_id", columnList = "tenant_role_id"),
           @Index(name = "idx_user_role_branch_id", columnList = "branch_id"),
           @Index(name = "idx_user_role_active", columnList = "is_active"),
           @Index(name = "idx_user_role_effective", columnList = "effective_from, effective_to")
       },
       uniqueConstraints = {
           @UniqueConstraint(name = "uk_user_role_tenant_branch", 
                           columnNames = {"user_id", "tenant_id", "tenant_role_id", "branch_id"})
       })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class UserRoleAssignment extends BaseEntity {
    
    /**
     * 할당 ID (UUID)
     */
    @Column(name = "assignment_id", length = 36, unique = true, nullable = false)
    private String assignmentId;
    
    /**
     * 사용자 ID
     */
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    /**
     * 테넌트 ID
     */
    @Column(name = "tenant_id", length = 36, nullable = false)
    private String tenantId;
    
    /**
     * 테넌트 역할 ID
     */
    @Column(name = "tenant_role_id", length = 36, nullable = false)
    private String tenantRoleId;
    
    /**
     * 브랜치 ID (선택, NULL = 전체 브랜치)
     */
    @Column(name = "branch_id")
    private Long branchId;
    
    /**
     * 역할 시작일
     */
    @Column(name = "effective_from", nullable = false)
    @Builder.Default
    private LocalDate effectiveFrom = LocalDate.now();
    
    /**
     * 역할 종료일 (NULL = 무기한)
     */
    @Column(name = "effective_to")
    private LocalDate effectiveTo;
    
    /**
     * 활성 여부
     */
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
    
    /**
     * 할당한 사용자 ID
     */
    @Column(name = "assigned_by", length = 100)
    private String assignedBy;
    
    /**
     * 할당 사유
     */
    @Column(name = "assignment_reason", columnDefinition = "TEXT")
    private String assignmentReason;
    
    /**
     * 사용자 (참조)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", insertable = false, updatable = false)
    private User user;
    
    /**
     * 테넌트 역할 (참조)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_role_id", referencedColumnName = "tenant_role_id", insertable = false, updatable = false)
    private TenantRole tenantRole;
    
    /**
     * 브랜치 (참조)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", referencedColumnName = "id", insertable = false, updatable = false)
    private Branch branch;
    
    // 비즈니스 메서드
    
    /**
     * 현재 유효한 할당인지 확인
     */
    public boolean isCurrentlyEffective() {
        if (!isActive || isDeleted()) {
            return false;
        }
        
        LocalDate today = LocalDate.now();
        
        // 시작일 체크
        if (effectiveFrom != null && today.isBefore(effectiveFrom)) {
            return false;
        }
        
        // 종료일 체크
        if (effectiveTo != null && today.isAfter(effectiveTo)) {
            return false;
        }
        
        return true;
    }
    
    /**
     * 전체 브랜치에 할당되었는지 확인
     */
    public boolean isAllBranches() {
        return branchId == null;
    }
    
    /**
     * 특정 브랜치에 할당되었는지 확인
     */
    public boolean isSpecificBranch() {
        return branchId != null;
    }
}

