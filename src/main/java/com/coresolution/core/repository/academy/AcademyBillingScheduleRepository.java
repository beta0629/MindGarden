package com.coresolution.core.repository.academy;

import com.coresolution.core.domain.academy.AcademyBillingSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * 학원 청구 스케줄 Repository
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
@Repository
public interface AcademyBillingScheduleRepository extends JpaRepository<AcademyBillingSchedule, Long> {
    
    /**
     * billing_schedule_id로 조회
     */
    Optional<AcademyBillingSchedule> findByBillingScheduleIdAndIsDeletedFalse(String billingScheduleId);
    
    /**
     * tenant_id로 조회 (삭제되지 않은 것만)
     */
    List<AcademyBillingSchedule> findByTenantIdAndIsDeletedFalse(String tenantId);
    
    /**
     * tenant_id와 branch_id로 조회
     */
    List<AcademyBillingSchedule> findByTenantIdAndBranchIdAndIsDeletedFalse(String tenantId, Long branchId);
    
    /**
     * 활성 청구 스케줄 조회
     */
    @Query("SELECT s FROM AcademyBillingSchedule s WHERE s.tenantId = :tenantId AND s.isActive = true AND s.isDeleted = false")
    List<AcademyBillingSchedule> findActiveSchedules(@Param("tenantId") String tenantId);
    
    /**
     * 청구 예정인 스케줄 조회
     */
    @Query("SELECT s FROM AcademyBillingSchedule s WHERE s.tenantId = :tenantId AND s.isActive = true AND s.isDeleted = false AND s.nextBillingDate <= :date")
    List<AcademyBillingSchedule> findSchedulesDueForBilling(@Param("tenantId") String tenantId, @Param("date") LocalDate date);
    
    /**
     * billing_schedule_id 존재 여부 확인
     */
    boolean existsByBillingScheduleIdAndIsDeletedFalse(String billingScheduleId);
}

