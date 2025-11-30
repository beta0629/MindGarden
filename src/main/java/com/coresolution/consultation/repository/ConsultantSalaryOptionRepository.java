package com.coresolution.consultation.repository;

import java.util.List;
import com.coresolution.consultation.entity.ConsultantSalaryOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 상담사 급여 옵션 Repository
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
@Repository
public interface ConsultantSalaryOptionRepository extends JpaRepository<ConsultantSalaryOption, Long> {
    
    // ==================== tenantId 필터링 메서드 ====================
    
    /**
     * 급여 프로필 ID로 활성화된 옵션 조회 (tenantId 필터링)
     */
    @Query("SELECT cso FROM ConsultantSalaryOption cso WHERE cso.tenantId = :tenantId AND cso.salaryProfileId = :salaryProfileId AND cso.isActive = true")
    List<ConsultantSalaryOption> findByTenantIdAndSalaryProfileIdAndActive(@Param("tenantId") String tenantId, @Param("salaryProfileId") Long salaryProfileId);
    
    /**
     * 급여 프로필 ID로 모든 옵션 조회 (tenantId 필터링)
     */
    @Query("SELECT cso FROM ConsultantSalaryOption cso WHERE cso.tenantId = :tenantId AND cso.salaryProfileId = :salaryProfileId")
    List<ConsultantSalaryOption> findByTenantIdAndSalaryProfileId(@Param("tenantId") String tenantId, @Param("salaryProfileId") Long salaryProfileId);
    
    /**
     * 옵션 타입으로 활성화된 옵션 조회 (tenantId 필터링)
     */
    @Query("SELECT cso FROM ConsultantSalaryOption cso WHERE cso.tenantId = :tenantId AND cso.optionType = :optionType AND cso.isActive = true")
    List<ConsultantSalaryOption> findByTenantIdAndOptionTypeAndActive(@Param("tenantId") String tenantId, @Param("optionType") String optionType);
    
    /**
     * 상담사 ID로 급여 옵션 조회 (JOIN) (tenantId 필터링)
     */
    @Query("SELECT cso FROM ConsultantSalaryOption cso " +
           "JOIN ConsultantSalaryProfile csp ON cso.salaryProfileId = csp.id " +
           "WHERE cso.tenantId = :tenantId AND csp.consultantId = :consultantId AND cso.isActive = true AND csp.isActive = true")
    List<ConsultantSalaryOption> findByTenantIdAndConsultantIdAndActive(@Param("tenantId") String tenantId, @Param("consultantId") Long consultantId);
    
    /**
     * 특정 옵션 타입과 금액으로 옵션 조회 (tenantId 필터링)
     */
    @Query("SELECT cso FROM ConsultantSalaryOption cso WHERE cso.tenantId = :tenantId AND cso.optionType = :optionType AND cso.optionAmount = :amount AND cso.isActive = true")
    List<ConsultantSalaryOption> findByTenantIdAndOptionTypeAndAmount(@Param("tenantId") String tenantId, @Param("optionType") String optionType, @Param("amount") java.math.BigDecimal amount);
    
    // ==================== @Deprecated 메서드 (하위 호환성) ====================
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndSalaryProfileIdAndActive 사용하세요.
     */
    @Deprecated
    @Query("SELECT cso FROM ConsultantSalaryOption cso WHERE cso.salaryProfileId = :salaryProfileId AND cso.isActive = true")
    List<ConsultantSalaryOption> findBySalaryProfileIdAndActive(@Param("salaryProfileId") Long salaryProfileId);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndSalaryProfileId 사용하세요.
     */
    @Deprecated
    List<ConsultantSalaryOption> findBySalaryProfileId(Long salaryProfileId);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndOptionTypeAndActive 사용하세요.
     */
    @Deprecated
    @Query("SELECT cso FROM ConsultantSalaryOption cso WHERE cso.optionType = :optionType AND cso.isActive = true")
    List<ConsultantSalaryOption> findByOptionTypeAndActive(@Param("optionType") String optionType);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndConsultantIdAndActive 사용하세요.
     */
    @Deprecated
    @Query("SELECT cso FROM ConsultantSalaryOption cso " +
           "JOIN ConsultantSalaryProfile csp ON cso.salaryProfileId = csp.id " +
           "WHERE csp.consultantId = :consultantId AND cso.isActive = true AND csp.isActive = true")
    List<ConsultantSalaryOption> findByConsultantIdAndActive(@Param("consultantId") Long consultantId);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndOptionTypeAndAmount 사용하세요.
     */
    @Deprecated
    @Query("SELECT cso FROM ConsultantSalaryOption cso WHERE cso.optionType = :optionType AND cso.optionAmount = :amount AND cso.isActive = true")
    List<ConsultantSalaryOption> findByOptionTypeAndAmount(@Param("optionType") String optionType, @Param("amount") java.math.BigDecimal amount);
}
