package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.DropoutRiskAssessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DropoutRiskAssessmentRepository extends JpaRepository<DropoutRiskAssessment, Long> {

    Optional<DropoutRiskAssessment> findByIdAndIsDeletedFalse(Long id);

    Optional<DropoutRiskAssessment> findFirstByClientIdAndIsDeletedFalseOrderByAssessmentDateDesc(Long clientId);

    @Query("SELECT d FROM DropoutRiskAssessment d " +
           "WHERE d.tenantId = :tenantId " +
           "AND d.dropoutRiskLevel IN ('CRITICAL', 'HIGH') " +
           "AND d.isDeleted = false " +
           "ORDER BY d.assessmentDate DESC")
    List<DropoutRiskAssessment> findHighRiskByTenantId(@Param("tenantId") String tenantId);
}
