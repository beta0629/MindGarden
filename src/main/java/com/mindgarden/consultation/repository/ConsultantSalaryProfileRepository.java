package com.mindgarden.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.mindgarden.consultation.entity.ConsultantSalaryProfile;
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
    
    /**
     * 상담사 ID로 활성화된 급여 프로필 조회
     */
    @Query("SELECT csp FROM ConsultantSalaryProfile csp WHERE csp.consultantId = :consultantId AND csp.isActive = true")
    Optional<ConsultantSalaryProfile> findByConsultantIdAndActive(@Param("consultantId") Long consultantId);
    
    /**
     * 상담사 ID로 모든 급여 프로필 조회
     */
    List<ConsultantSalaryProfile> findByConsultantId(Long consultantId);
    
    /**
     * 급여 유형별 급여 프로필 조회
     */
    List<ConsultantSalaryProfile> findBySalaryTypeAndIsActiveTrue(String salaryType);
    
    /**
     * 활성화된 모든 급여 프로필 조회
     */
    List<ConsultantSalaryProfile> findByIsActiveTrue();
    
    /**
     * 계약 만료된 급여 프로필 조회
     */
    @Query("SELECT csp FROM ConsultantSalaryProfile csp WHERE csp.contractEndDate < CURRENT_TIMESTAMP AND csp.isActive = true")
    List<ConsultantSalaryProfile> findExpiredProfiles();
    
    /**
     * 프리랜서 급여 프로필 조회
     */
    @Query("SELECT csp FROM ConsultantSalaryProfile csp WHERE csp.salaryType = 'FREELANCE' AND csp.isActive = true")
    List<ConsultantSalaryProfile> findFreelanceProfiles();
    
    /**
     * 정규직 급여 프로필 조회
     */
    @Query("SELECT csp FROM ConsultantSalaryProfile csp WHERE csp.salaryType = 'REGULAR' AND csp.isActive = true")
    List<ConsultantSalaryProfile> findRegularProfiles();
}
