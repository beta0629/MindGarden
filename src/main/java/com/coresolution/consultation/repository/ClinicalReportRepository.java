package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.ClinicalReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 임상 보고서 리포지토리
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-01-21
 */
@Repository
public interface ClinicalReportRepository extends JpaRepository<ClinicalReport, Long> {

    /**
     * 상담 기록 ID로 임상 보고서 목록 조회
     */
    List<ClinicalReport> findByConsultationRecordIdAndIsDeletedFalse(Long consultationRecordId);

    /**
     * 상담 기록 ID와 보고서 타입으로 조회
     */
    Optional<ClinicalReport> findByConsultationRecordIdAndReportTypeAndIsDeletedFalse(
        Long consultationRecordId, String reportType);

    /**
     * 테넌트 ID로 보고서 목록 조회
     */
    List<ClinicalReport> findByTenantIdAndIsDeletedFalse(String tenantId);

    /**
     * 검토되지 않은 보고서 조회
     */
    List<ClinicalReport> findByHumanReviewedFalseAndIsDeletedFalse();

    /**
     * 보고서 타입별 조회
     */
    List<ClinicalReport> findByReportTypeAndIsDeletedFalse(String reportType);

    /**
     * AI 모델별 보고서 조회
     */
    List<ClinicalReport> findByAiModelUsedAndIsDeletedFalse(String aiModelUsed);

    /**
     * 테넌트 + 검토 상태로 조회
     */
    @Query("SELECT cr FROM ClinicalReport cr WHERE cr.tenantId = :tenantId " +
           "AND cr.humanReviewed = :humanReviewed AND cr.isDeleted = false " +
           "ORDER BY cr.createdAt DESC")
    List<ClinicalReport> findByTenantIdAndHumanReviewed(
        @Param("tenantId") String tenantId,
        @Param("humanReviewed") Boolean humanReviewed);

    /**
     * ID로 조회 (삭제되지 않은 것만)
     */
    Optional<ClinicalReport> findByIdAndIsDeletedFalse(Long id);
}
