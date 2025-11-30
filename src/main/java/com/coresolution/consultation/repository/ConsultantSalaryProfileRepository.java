package com.coresolution.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.ConsultantSalaryProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 상담사 급여 프로필 Repository
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
@Repository
public interface ConsultantSalaryProfileRepository extends JpaRepository<ConsultantSalaryProfile, Long> {
    
    // ==================== tenantId 필터링 메서드 ====================
    
    /**
     * 상담사 ID로 활성화된 급여 프로필 조회 (tenantId 필터링)
     */
    @Query("SELECT csp FROM ConsultantSalaryProfile csp WHERE csp.tenantId = :tenantId AND csp.consultantId = :consultantId AND csp.isActive = true")
    Optional<ConsultantSalaryProfile> findByTenantIdAndConsultantIdAndActive(@Param("tenantId") String tenantId, @Param("consultantId") Long consultantId);
    
    /**
     * 상담사 ID로 모든 급여 프로필 조회 (tenantId 필터링)
     */
    @Query("SELECT csp FROM ConsultantSalaryProfile csp WHERE csp.tenantId = :tenantId AND csp.consultantId = :consultantId")
    List<ConsultantSalaryProfile> findByTenantIdAndConsultantId(@Param("tenantId") String tenantId, @Param("consultantId") Long consultantId);
    
    /**
     * 급여 유형별 급여 프로필 조회 (tenantId 필터링)
     */
    @Query("SELECT csp FROM ConsultantSalaryProfile csp WHERE csp.tenantId = :tenantId AND csp.salaryType = :salaryType AND csp.isActive = true")
    List<ConsultantSalaryProfile> findByTenantIdAndSalaryTypeAndIsActiveTrue(@Param("tenantId") String tenantId, @Param("salaryType") String salaryType);
    
    /**
     * 활성화된 모든 급여 프로필 조회 (tenantId 필터링)
     */
    @Query("SELECT csp FROM ConsultantSalaryProfile csp WHERE csp.tenantId = :tenantId AND csp.isActive = true")
    List<ConsultantSalaryProfile> findByTenantIdAndIsActiveTrue(@Param("tenantId") String tenantId);
    
    /**
     * 계약 만료된 급여 프로필 조회 (tenantId 필터링)
     */
    @Query("SELECT csp FROM ConsultantSalaryProfile csp WHERE csp.tenantId = :tenantId AND csp.contractEndDate < CURRENT_TIMESTAMP AND csp.isActive = true")
    List<ConsultantSalaryProfile> findExpiredProfilesByTenantId(@Param("tenantId") String tenantId);
    
    /**
     * 프리랜서 급여 프로필 조회 (tenantId 필터링)
     */
    @Query("SELECT csp FROM ConsultantSalaryProfile csp WHERE csp.tenantId = :tenantId AND csp.salaryType = 'FREELANCE' AND csp.isActive = true")
    List<ConsultantSalaryProfile> findFreelanceProfilesByTenantId(@Param("tenantId") String tenantId);
    
    /**
     * 정규직 급여 프로필 조회 (tenantId 필터링)
     */
    @Query("SELECT csp FROM ConsultantSalaryProfile csp WHERE csp.tenantId = :tenantId AND csp.salaryType = 'REGULAR' AND csp.isActive = true")
    List<ConsultantSalaryProfile> findRegularProfilesByTenantId(@Param("tenantId") String tenantId);
    
    /**
     * 지점별 활성화된 급여 프로필 조회 (tenantId 필터링)
     */
    @Query("SELECT csp FROM ConsultantSalaryProfile csp WHERE csp.tenantId = :tenantId AND csp.isActive = true")
    List<ConsultantSalaryProfile> findByTenantIdAndBranchCodeAndIsActiveTrue(@Param("tenantId") String tenantId, @Param("branchCode") String branchCode);
    
    // ==================== @Deprecated 메서드 (하위 호환성) ====================
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndConsultantIdAndActive 사용하세요.
     */
    @Deprecated
    @Query("SELECT csp FROM ConsultantSalaryProfile csp WHERE csp.consultantId = :consultantId AND csp.isActive = true")
    Optional<ConsultantSalaryProfile> findByConsultantIdAndActive(@Param("consultantId") Long consultantId);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndConsultantId 사용하세요.
     */
    @Deprecated
    List<ConsultantSalaryProfile> findByConsultantId(Long consultantId);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndSalaryTypeAndIsActiveTrue 사용하세요.
     */
    @Deprecated
    List<ConsultantSalaryProfile> findBySalaryTypeAndIsActiveTrue(String salaryType);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndIsActiveTrue 사용하세요.
     */
    @Deprecated
    List<ConsultantSalaryProfile> findByIsActiveTrue();
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findExpiredProfilesByTenantId 사용하세요.
     */
    @Deprecated
    @Query("SELECT csp FROM ConsultantSalaryProfile csp WHERE csp.contractEndDate < CURRENT_TIMESTAMP AND csp.isActive = true")
    List<ConsultantSalaryProfile> findExpiredProfiles();
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findFreelanceProfilesByTenantId 사용하세요.
     */
    @Deprecated
    @Query("SELECT csp FROM ConsultantSalaryProfile csp WHERE csp.salaryType = 'FREELANCE' AND csp.isActive = true")
    List<ConsultantSalaryProfile> findFreelanceProfiles();
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findRegularProfilesByTenantId 사용하세요.
     */
    @Deprecated
    @Query("SELECT csp FROM ConsultantSalaryProfile csp WHERE csp.salaryType = 'REGULAR' AND csp.isActive = true")
    List<ConsultantSalaryProfile> findRegularProfiles();
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndBranchCodeAndIsActiveTrue 사용하세요.
     */
    @Deprecated
    @Query("SELECT csp FROM ConsultantSalaryProfile csp WHERE csp.isActive = true")
    List<ConsultantSalaryProfile> findByBranchCodeAndIsActiveTrue(@Param("branchCode") String branchCode);
}
