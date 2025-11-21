package com.coresolution.core.domain.ops;

import com.coresolution.consultation.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.Instant;

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
@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class FeatureFlag extends BaseEntity {
    
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

