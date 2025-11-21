package com.coresolution.consultation.entity;

import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 역할-권한 매핑 엔티티
 * 특정 역할이 어떤 권한을 가지고 있는지 정의하는 테이블
 */
@Entity
@Table(name = "role_permissions", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"role_name", "permission_code"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RolePermission {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "role_name", nullable = false, length = 50)
    private String roleName;
    
    @Column(name = "permission_code", nullable = false, length = 100)
    private String permissionCode;
    
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
    
    @Column(name = "granted_by", length = 100)
    private String grantedBy;
    
    @Column(name = "granted_at")
    private LocalDateTime grantedAt;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    // 권한 부여를 위한 정적 메서드
    public static RolePermission grant(String roleName, String permissionCode, String grantedBy) {
        return RolePermission.builder()
            .roleName(roleName)
            .permissionCode(permissionCode)
            .isActive(true)
            .grantedBy(grantedBy)
            .grantedAt(LocalDateTime.now())
            .build();
    }
}
