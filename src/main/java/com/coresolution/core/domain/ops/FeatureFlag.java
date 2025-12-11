package com.coresolution.core.domain.ops;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Feature Flag 엔티티
 * 운영 포털용 Feature Flag 관리
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Entity
@Table(name = "ops_feature_flag", indexes = {
    @Index(name = "idx_feature_flag_key", columnList = "flag_key"),
    @Index(name = "idx_feature_flag_state", columnList = "state")
})
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class FeatureFlag {
    
    /**
     * UUID 타입의 ID
     * ops_feature_flag 테이블은 binary(16) UUID를 사용
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "BINARY(16)", nullable = false, updatable = false)
    private UUID id;
    
    /**
     * 감사 필드: 생성 시간
     */
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    /**
     * 감사 필드: 수정 시간
     */
    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    /**
     * 소프트 삭제: 삭제 시간
     */
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
    
    /**
     * 소프트 삭제: 삭제 여부
     */
    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;
    
    /**
     * 버전 관리 (낙관적 잠금)
     */
    @Version
    @Column(name = "version", nullable = false)
    @Builder.Default
    private Long version = 0L;
    
    /**
     * 테넌트 ID (Multi-tenant 지원)
     */
    @Column(name = "tenant_id", length = 36)
    private String tenantId;
    
    @Column(name = "flag_key", nullable = false, unique = true, length = 64)
    private String flagKey;
    
    @Column(name = "description", length = 200)
    private String description;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "state", nullable = false, length = 16)
    @Builder.Default
    private FeatureFlagState state = FeatureFlagState.DISABLED;
    
    @Column(name = "target_scope", length = 64)
    private String targetScope;
    
    @Column(name = "expires_at")
    private Instant expiresAt;
    
    // 비즈니스 메서드
    
    /**
     * 활성화 여부 확인
     */
    public boolean isEnabled() {
        return state == FeatureFlagState.ENABLED;
    }
    
    /**
     * 만료 여부 확인
     */
    public boolean isExpired() {
        return expiresAt != null && expiresAt.isBefore(Instant.now());
    }
}

