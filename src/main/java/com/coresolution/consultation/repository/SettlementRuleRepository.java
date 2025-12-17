package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.SettlementRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 정산 규칙 Repository
 * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
 */
@Repository
public interface SettlementRuleRepository extends JpaRepository<SettlementRule, Long> {
    
    /**
     * 테넌트별 활성 규칙 목록 조회
     */
    @Query("SELECT r FROM SettlementRule r WHERE r.tenantId = :tenantId AND r.isActive = true AND r.isDeleted = false ORDER BY r.createdAt DESC")
    List<SettlementRule> findActiveByTenantId(@Param("tenantId") String tenantId);
    
    /**
     * 테넌트별 업종별 활성 규칙 조회
     */
    @Query("SELECT r FROM SettlementRule r WHERE r.tenantId = :tenantId AND r.businessType = :businessType AND r.isActive = true AND r.isDeleted = false")
    List<SettlementRule> findActiveByTenantIdAndBusinessType(@Param("tenantId") String tenantId, 
                                                               @Param("businessType") SettlementRule.BusinessType businessType);
    
    /**
     * 테넌트별 정산 유형별 활성 규칙 조회
     */
    @Query("SELECT r FROM SettlementRule r WHERE r.tenantId = :tenantId AND r.settlementType = :settlementType AND r.isActive = true AND r.isDeleted = false")
    List<SettlementRule> findActiveByTenantIdAndSettlementType(@Param("tenantId") String tenantId,
                                                                 @Param("settlementType") SettlementRule.SettlementType settlementType);
    
    /**
     * 테넌트별 ID로 조회 (삭제되지 않은 것만)
     */
    @Query("SELECT r FROM SettlementRule r WHERE r.tenantId = :tenantId AND r.id = :id AND r.isDeleted = false")
    Optional<SettlementRule> findByTenantIdAndId(@Param("tenantId") String tenantId, @Param("id") Long id);
}

