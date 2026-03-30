package com.coresolution.core.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 역할 템플릿 권한 엔티티
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Entity
@Table(name = "role_template_permissions",
       uniqueConstraints = @UniqueConstraint(columnNames = {"role_template_id", "permission_code"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleTemplatePermission {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * 역할 템플릿 ID
     */
    @Column(name = "role_template_id", length = 36, nullable = false)
    private String roleTemplateId;
    
    /**
     * 권한 코드
     */
    @Column(name = "permission_code", length = 100, nullable = false)
    private String permissionCode;
    
    /**
     * 권한 범위 (SELF, BRANCH, TENANT, ALL)
     */
    @Column(name = "scope", length = 50)
    private String scope;
    
    /**
     * 기본 권한 여부
     */
    @Column(name = "default_flag")
    @Builder.Default
    private Boolean defaultFlag = true;
    
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
     * 역할 템플릿 (참조)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_template_id", referencedColumnName = "role_template_id", insertable = false, updatable = false)
    private RoleTemplate roleTemplate;
}

