package com.coresolution.core.repository.academy;

import com.coresolution.core.domain.academy.AcademySettlement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * 학원 정산 Repository
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
@Repository
public interface AcademySettlementRepository extends JpaRepository<AcademySettlement, Long> {
    
    /**
     * settlement_id로 조회
     */
    Optional<AcademySettlement> findBySettlementIdAndIsDeletedFalse(String settlementId);
    
    /**
     * tenant_id로 조회 (삭제되지 않은 것만)
     */
    List<AcademySettlement> findByTenantIdAndIsDeletedFalse(String tenantId);
    
    /**
     * tenant_id와 branch_id로 조회
     */
    List<AcademySettlement> findByTenantIdAndBranchIdAndIsDeletedFalse(String tenantId, Long branchId);
    
    /**
     * tenant_id와 settlement_period로 조회
     */
    Optional<AcademySettlement> findByTenantIdAndBranchIdAndSettlementPeriodAndIsDeletedFalse(
        String tenantId, Long branchId, String settlementPeriod);
    
    /**
     * 상태별 조회
     */
    List<AcademySettlement> findByTenantIdAndStatusAndIsDeletedFalse(
        String tenantId, AcademySettlement.SettlementStatus status);
    
    /**
     * 기간별 조회
     */
    @Query("SELECT s FROM AcademySettlement s WHERE s.tenantId = :tenantId AND s.periodStart <= :endDate AND s.periodEnd >= :startDate AND s.isDeleted = false")
    List<AcademySettlement> findSettlementsByDateRange(
        @Param("tenantId") String tenantId, 
        @Param("startDate") LocalDate startDate, 
        @Param("endDate") LocalDate endDate);
    
    /**
     * settlement_id 존재 여부 확인
     */
    boolean existsBySettlementIdAndIsDeletedFalse(String settlementId);
}

