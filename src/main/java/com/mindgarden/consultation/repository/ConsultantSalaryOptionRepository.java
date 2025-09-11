package com.mindgarden.consultation.repository;

import java.util.List;
import com.mindgarden.consultation.entity.ConsultantSalaryOption;
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
    
    /**
     * 급여 프로필 ID로 활성화된 옵션 조회
     */
    @Query("SELECT cso FROM ConsultantSalaryOption cso WHERE cso.salaryProfileId = :salaryProfileId AND cso.isActive = true")
    List<ConsultantSalaryOption> findBySalaryProfileIdAndActive(@Param("salaryProfileId") Long salaryProfileId);
    
    /**
     * 급여 프로필 ID로 모든 옵션 조회
     */
    List<ConsultantSalaryOption> findBySalaryProfileId(Long salaryProfileId);
    
    /**
     * 옵션 타입으로 활성화된 옵션 조회
     */
    @Query("SELECT cso FROM ConsultantSalaryOption cso WHERE cso.optionType = :optionType AND cso.isActive = true")
    List<ConsultantSalaryOption> findByOptionTypeAndActive(@Param("optionType") String optionType);
    
    /**
     * 상담사 ID로 급여 옵션 조회 (JOIN)
     */
    @Query("SELECT cso FROM ConsultantSalaryOption cso " +
           "JOIN ConsultantSalaryProfile csp ON cso.salaryProfileId = csp.id " +
           "WHERE csp.consultantId = :consultantId AND cso.isActive = true AND csp.isActive = true")
    List<ConsultantSalaryOption> findByConsultantIdAndActive(@Param("consultantId") Long consultantId);
    
    /**
     * 특정 옵션 타입과 금액으로 옵션 조회
     */
    @Query("SELECT cso FROM ConsultantSalaryOption cso WHERE cso.optionType = :optionType AND cso.optionAmount = :amount AND cso.isActive = true")
    List<ConsultantSalaryOption> findByOptionTypeAndAmount(@Param("optionType") String optionType, @Param("amount") java.math.BigDecimal amount);
}
