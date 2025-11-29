package com.coresolution.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.SalaryProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SalaryProfileRepository extends JpaRepository<SalaryProfile, Long> {
    
    List<SalaryProfile> findByIsActiveTrue();
    
    List<SalaryProfile> findByBranchCodeAndIsActiveTrue(String branchCode);
    
    Optional<SalaryProfile> findByProfileNameAndBranchCode(String profileName, String branchCode);
    
    /**
     * 테넌트별 지점용 활성 프로필 조회 (테넌트 필터링)
     */
    @Query("SELECT sp FROM SalaryProfile sp WHERE sp.tenantId = :tenantId AND sp.isActive = true AND (sp.branchCode = :branchCode OR sp.branchCode IS NULL)")
    List<SalaryProfile> findActiveProfilesForBranchByTenantId(@Param("tenantId") String tenantId, @Param("branchCode") String branchCode);
    
    /**
     * @Deprecated - 🚨 위험: 모든 테넌트 급여 프로필 노출!
     */
    @Deprecated
    @Query("SELECT sp FROM SalaryProfile sp WHERE sp.isActive = true AND (sp.branchCode = :branchCode OR sp.branchCode IS NULL)")
    List<SalaryProfile> findActiveProfilesForBranch(@Param("branchCode") String branchCode);
}
