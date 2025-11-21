package com.coresolution.core.repository.ops;

import com.coresolution.core.domain.ops.FeatureFlag;
import com.coresolution.core.domain.ops.FeatureFlagState;
import com.coresolution.consultation.repository.BaseRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Feature Flag Repository
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Repository
public interface FeatureFlagRepository extends BaseRepository<FeatureFlag, Long> {
    
    /**
     * flag_key로 Feature Flag 조회
     */
    Optional<FeatureFlag> findByFlagKey(String flagKey);
    
    /**
     * 상태별 Feature Flag 개수 조회
     */
    @Query("SELECT COUNT(f) FROM FeatureFlag f WHERE f.state = :state AND f.isDeleted = false")
    long countByState(@Param("state") FeatureFlagState state);
    
    /**
     * 활성화된 Feature Flag 목록 조회
     */
    @Query("SELECT f FROM FeatureFlag f WHERE f.state = 'ENABLED' AND f.isDeleted = false")
    List<FeatureFlag> findAllEnabled();
    
    /**
     * 만료되지 않은 Feature Flag 목록 조회
     */
    @Query("SELECT f FROM FeatureFlag f WHERE (f.expiresAt IS NULL OR f.expiresAt > CURRENT_TIMESTAMP) AND f.isDeleted = false")
    List<FeatureFlag> findAllNotExpired();
}

