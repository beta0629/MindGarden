package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.MultimodalEmotionReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 멀티모달 감정 통합 리포트 리포지토리
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-01-21
 */
@Repository
public interface MultimodalEmotionReportRepository extends JpaRepository<MultimodalEmotionReport, Long> {

    Optional<MultimodalEmotionReport> findByIdAndIsDeletedFalse(Long id);

    Optional<MultimodalEmotionReport> findByConsultationRecordIdAndIsDeletedFalse(Long consultationRecordId);

    @Query("SELECT m FROM MultimodalEmotionReport m " +
           "WHERE m.consultationRecordId IN " +
           "(SELECT cr.id FROM ConsultationRecord cr " +
           " WHERE cr.clientId = :clientId " +
           " AND cr.isDeleted = false) " +
           "AND m.isDeleted = false " +
           "ORDER BY m.createdAt DESC")
    List<MultimodalEmotionReport> findByClientIdOrderByCreatedAtDesc(@Param("clientId") Long clientId);

    @Query("SELECT m FROM MultimodalEmotionReport m " +
           "WHERE m.tenantId = :tenantId " +
           "AND m.overallRiskLevel IN ('CRITICAL', 'HIGH') " +
           "AND m.isDeleted = false " +
           "ORDER BY m.createdAt DESC")
    List<MultimodalEmotionReport> findHighRiskByTenantId(@Param("tenantId") String tenantId);
}
