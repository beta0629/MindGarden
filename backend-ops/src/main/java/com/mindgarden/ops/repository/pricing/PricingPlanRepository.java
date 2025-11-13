package com.mindgarden.ops.repository.pricing;

import com.mindgarden.ops.domain.pricing.PricingPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PricingPlanRepository extends JpaRepository<PricingPlan, UUID> {
    Optional<PricingPlan> findByPlanCode(String planCode);

    long countByActive(boolean active);
}
