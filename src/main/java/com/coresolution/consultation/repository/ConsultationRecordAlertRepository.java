package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.ConsultationRecordAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * 상담 기록 알림 리포지토리
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-01-21
 */
@Repository
public interface ConsultationRecordAlertRepository extends JpaRepository<ConsultationRecordAlert, Long> {

    /**
     * 상담사별 알림 조회
     */
    List<ConsultationRecordAlert> findByConsultantIdAndIsDeletedFalseOrderByCreatedAtDesc(Long consultantId);

    /**
     * 테넌트별 알림 조회
     */
    List<ConsultationRecordAlert> findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId);

    /**
     * 상태별 알림 조회
     */
    List<ConsultationRecordAlert> findByStatusAndIsDeletedFalseOrderByCreatedAtDesc(String status);

    /**
     * 알림 타입별 조회
     */
    List<ConsultationRecordAlert> findByAlertTypeAndIsDeletedFalseOrderByCreatedAtDesc(String alertType);

    /**
     * 고위험 알림 조회 (HIGH 이상)
     */
    @Query("SELECT a FROM ConsultationRecordAlert a WHERE a.isDeleted = false " +
           "AND a.alertType = 'RISK_DETECTED' " +
           "AND a.status = 'PENDING' ORDER BY a.createdAt DESC")
    List<ConsultationRecordAlert> findHighRiskPendingAlerts();

    /**
     * 특정 날짜의 알림 조회
     */
    List<ConsultationRecordAlert> findBySessionDateAndIsDeletedFalse(LocalDate sessionDate);

    /**
     * 상담사 + 날짜로 알림 조회
     */
    List<ConsultationRecordAlert> findByConsultantIdAndSessionDateAndIsDeletedFalse(
        Long consultantId, LocalDate sessionDate);
}
