package com.mindgarden.ops.repository.pricing;

import com.mindgarden.ops.domain.pricing.PricingPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface PricingPlanRepository extends JpaRepository<PricingPlan, UUID> {
    Optional<PricingPlan> findByPlanCode(String planCode);

    long countByActive(boolean active);

    /**
     * OPS 글로벌 요금제 카탈로그 단건 조회. {@code tenant_id} 컬럼 없음.
     *
     * @param id 요금제 PK
     * @return 존재 시 엔티티
     */
    @Query("SELECT p FROM PricingPlan p WHERE p.id = :id")
    Optional<PricingPlan> findOneById(@Param("id") UUID id);
}
