package com.mindgarden.ops.repository.config;

import com.mindgarden.ops.domain.config.FeatureFlag;
import com.mindgarden.ops.domain.config.FeatureFlagState;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface FeatureFlagRepository extends JpaRepository<FeatureFlag, UUID> {
    Optional<FeatureFlag> findByFlagKey(String flagKey);

    long countByState(FeatureFlagState state);
}
