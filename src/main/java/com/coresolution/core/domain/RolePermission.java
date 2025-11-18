package com.coresolution.core.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 역할 권한 엔티티
 * 테넌트 역할에 부여된 권한/정책
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Entity(name = "TenantRolePermission")
@Table(name = "role_permissions",
       uniqueConstraints = @UniqueConstraint(columnNames = {"tenant_role_id", "permission_code"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RolePermission {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * 테넌트 역할 ID
     */
    @Column(name = "tenant_role_id", length = 36, nullable = false)
    private String tenantRoleId;
    
    /**
     * 권한 코드
     */
    @Column(name = "permission_code", length = 100, nullable = false)
    private String permissionCode;
    
    /**
     * ABAC 정책 (JSON) - branch_id, tenant_id 등 조건 포함
     */
    @Column(name = "policy_json", columnDefinition = "JSON")
    private String policyJson;
    
    /**
     * 권한 범위 (SELF, BRANCH, TENANT, ALL)
     */
    @Column(name = "scope", length = 50)
    private String scope;
    
    /**
     * 권한 부여한 사용자
     */
    @Column(name = "granted_by", length = 100)
    private String grantedBy;
    
    /**
     * 권한 부여 일시
     */
    @Column(name = "granted_at")
    @Builder.Default
    private LocalDateTime grantedAt = LocalDateTime.now();
    
    /**
     * 비고
     */
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
    
    /**
     * 생성일시
     */
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    /**
     * 수정일시
     */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    /**
     * 테넌트 역할 (참조)
     * 주의: 외래 키는 Flyway 마이그레이션으로 관리되므로 Hibernate가 자동 생성하지 않음
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_role_id", referencedColumnName = "tenant_role_id", 
                insertable = false, updatable = false, 
                foreignKey = @ForeignKey(value = ConstraintMode.NO_CONSTRAINT))
    private TenantRole tenantRole;
}

