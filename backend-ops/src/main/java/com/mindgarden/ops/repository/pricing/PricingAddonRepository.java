package com.mindgarden.ops.repository.pricing;

import com.mindgarden.ops.domain.pricing.PricingAddon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface PricingAddonRepository extends JpaRepository<PricingAddon, UUID> {
    Optional<PricingAddon> findByAddonCode(String addonCode);

    long countByActive(boolean active);

    /**
     * OPS 글로벌 애드온 카탈로그 단건 조회. {@code tenant_id} 컬럼 없음.
     *
     * @param id 애드온 PK
     * @return 존재 시 엔티티
     */
    @Query("SELECT a FROM PricingAddon a WHERE a.id = :id")
    Optional<PricingAddon> findOneById(@Param("id") UUID id);
}
