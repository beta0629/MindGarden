package com.coresolution.core.repository;

import com.coresolution.core.domain.PricingPlan;
import com.coresolution.consultation.repository.BaseRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 요금제 Repository
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Repository
public interface PricingPlanRepository extends BaseRepository<PricingPlan, Long> {
    
    /**
     * plan_code로 요금제 조회
     */
    Optional<PricingPlan> findByPlanCode(String planCode);
    
    /**
     * plan_id로 요금제 조회
     */
    Optional<PricingPlan> findByPlanId(String planId);
    
    /**
     * 활성화된 요금제 목록 조회
     */
    @Query("SELECT p FROM PricingPlan p WHERE p.isActive = true AND p.isDeleted = false ORDER BY p.displayOrder ASC")
    List<PricingPlan> findAllActive();
    
    /**
     * 활성화된 요금제 개수 조회
     */
    @Query("SELECT COUNT(p) FROM PricingPlan p WHERE p.isActive = true AND p.isDeleted = false")
    long countByIsActiveTrue();
}

