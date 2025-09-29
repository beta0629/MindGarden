package com.mindgarden.consultation.entity;

import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 권한 엔티티
 * 시스템의 모든 권한을 정의하는 테이블
 */
@Entity
@Table(name = "permissions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Permission {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "permission_code", nullable = false, unique = true, length = 100)
    private String permissionCode;
    
    @Column(name = "permission_name", nullable = false, length = 200)
    private String permissionName;
    
    @Column(name = "permission_description", columnDefinition = "TEXT")
    private String permissionDescription;
    
    @Column(name = "category", length = 50)
    private String category;
    
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    // 권한 코드로 검색하기 위한 정적 메서드
    public static Permission of(String permissionCode, String permissionName, String category) {
        return Permission.builder()
            .permissionCode(permissionCode)
            .permissionName(permissionName)
            .category(category)
            .isActive(true)
            .build();
    }
}
