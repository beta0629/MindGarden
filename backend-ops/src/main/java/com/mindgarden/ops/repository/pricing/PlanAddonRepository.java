package com.mindgarden.ops.repository.pricing;

import com.mindgarden.ops.domain.pricing.PlanAddonMapping;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PlanAddonRepository extends JpaRepository<PlanAddonMapping, UUID> {
    Optional<PlanAddonMapping> findByPlanIdAndAddonId(UUID planId, UUID addonId);
}
