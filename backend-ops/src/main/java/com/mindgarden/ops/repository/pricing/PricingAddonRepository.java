package com.mindgarden.ops.repository.pricing;

import com.mindgarden.ops.domain.pricing.PricingAddon;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PricingAddonRepository extends JpaRepository<PricingAddon, UUID> {
    Optional<PricingAddon> findByAddonCode(String addonCode);

    long countByActive(boolean active);
}
