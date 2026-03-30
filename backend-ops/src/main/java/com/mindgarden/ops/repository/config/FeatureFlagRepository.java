package com.mindgarden.ops.repository.config;

import com.mindgarden.ops.domain.config.FeatureFlag;
import com.mindgarden.ops.domain.config.FeatureFlagState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface FeatureFlagRepository extends JpaRepository<FeatureFlag, UUID> {
    Optional<FeatureFlag> findByFlagKey(String flagKey);

    long countByState(FeatureFlagState state);

    /**
     * OPS 글로벌 플래그 카탈로그 단건 조회. {@code tenant_id} 컬럼 없음.
     *
     * @param id 플래그 PK
     * @return 존재 시 엔티티
     */
    @Query("SELECT f FROM FeatureFlag f WHERE f.id = :id")
    Optional<FeatureFlag> findOneById(@Param("id") UUID id);
}
