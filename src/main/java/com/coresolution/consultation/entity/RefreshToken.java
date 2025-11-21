package com.coresolution.consultation.entity;

import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Refresh Token 저장소 엔티티
 * Phase 3: Refresh Token을 데이터베이스에 저장하여 관리
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Entity
@Table(
    name = "refresh_token_store",
    indexes = {
        @Index(name = "idx_user_id", columnList = "user_id"),
        @Index(name = "idx_tenant_id", columnList = "tenant_id"),
        @Index(name = "idx_token_id", columnList = "token_id"),
        @Index(name = "idx_expires_at", columnList = "expires_at"),
        @Index(name = "idx_revoked", columnList = "revoked"),
        @Index(name = "idx_user_tenant", columnList = "user_id,tenant_id")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshToken {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;
    
    @Column(name = "token_id", nullable = false, unique = true, length = 36)
    private String tokenId; // UUID
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "tenant_id", length = 36)
    private String tenantId;
    
    @Column(name = "branch_id")
    private Long branchId;
    
    @Column(name = "device_id", length = 100)
    private String deviceId;
    
    @Column(name = "ip_address", length = 45)
    private String ipAddress;
    
    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;
    
    @Column(name = "refresh_token_hash", nullable = false, length = 255)
    private String refreshTokenHash; // 보안을 위해 해시값 저장
    
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
    
    @Column(name = "revoked", nullable = false)
    @Builder.Default
    private Boolean revoked = false;
    
    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    /**
     * Refresh Token이 만료되었는지 확인
     */
    public boolean isExpired() {
        return expiresAt != null && expiresAt.isBefore(LocalDateTime.now());
    }
    
    /**
     * Refresh Token이 유효한지 확인 (만료되지 않았고 무효화되지 않음)
     */
    public boolean isValid() {
        return !revoked && !isExpired();
    }
    
    /**
     * Refresh Token 무효화
     */
    public void revoke() {
        this.revoked = true;
        this.revokedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
}

