package com.coresolution.core.repository;

import com.coresolution.core.domain.BusinessRuleMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 비즈니스 규칙 매핑 Repository
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-22
 */
@Repository
public interface BusinessRuleMappingRepository extends JpaRepository<BusinessRuleMapping, Long> {
    
    /**
     * 규칙 코드와 테넌트 ID로 활성 규칙 조회
     */
    Optional<BusinessRuleMapping> findByRuleCodeAndTenantIdAndIsActiveTrueAndIsDeletedFalse(
        String ruleCode, String tenantId);
    
    /**
     * 규칙 코드로 글로벌 활성 규칙 조회
     */
    Optional<BusinessRuleMapping> findByRuleCodeAndTenantIdIsNullAndIsActiveTrueAndIsDeletedFalse(
        String ruleCode);
    
    /**
     * 규칙 타입으로 활성 규칙 목록 조회
     */
    java.util.List<BusinessRuleMapping> findByRuleTypeAndIsActiveTrueAndIsDeletedFalseOrderByPriorityDesc(
        String ruleType);
    
    /**
     * 테넌트별 활성 규칙 목록 조회
     */
    java.util.List<BusinessRuleMapping> findByTenantIdAndIsActiveTrueAndIsDeletedFalseOrderByPriorityDesc(
        String tenantId);
}



