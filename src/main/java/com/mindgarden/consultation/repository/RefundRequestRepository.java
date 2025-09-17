package com.mindgarden.consultation.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.mindgarden.consultation.entity.RefundRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 환불 요청 Repository
 */
@Repository
public interface RefundRequestRepository extends JpaRepository<RefundRequest, Long> {

    /**
     * 매핑 ID로 환불 요청 조회
     */
    List<RefundRequest> findByMappingIdOrderByCreatedAtDesc(Long mappingId);

    /**
     * 상태별 환불 요청 조회
     */
    List<RefundRequest> findByStatusOrderByCreatedAtDesc(RefundRequest.RefundStatus status);

    /**
     * ERP 상태별 환불 요청 조회
     */
    List<RefundRequest> findByErpStatusOrderByCreatedAtDesc(RefundRequest.ErpIntegrationStatus erpStatus);

    /**
     * 요청자별 환불 요청 조회
     */
    List<RefundRequest> findByRequestedByIdOrderByCreatedAtDesc(Long requestedById);

    /**
     * 기간별 환불 요청 조회
     */
    @Query("SELECT r FROM RefundRequest r WHERE r.requestedAt BETWEEN :startDate AND :endDate ORDER BY r.requestedAt DESC")
    List<RefundRequest> findByRequestedAtBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    /**
     * ERP 재시도 대상 조회 (실패 후 일정 시간 경과)
     */
    @Query("SELECT r FROM RefundRequest r WHERE r.erpStatus = :status AND r.updatedAt < :beforeTime ORDER BY r.updatedAt ASC")
    List<RefundRequest> findErpRetryTargets(@Param("status") RefundRequest.ErpIntegrationStatus status, @Param("beforeTime") LocalDateTime beforeTime);

    /**
     * 내담자별 환불 요청 조회
     */
    @Query("SELECT r FROM RefundRequest r WHERE r.mapping.client.id = :clientId ORDER BY r.createdAt DESC")
    List<RefundRequest> findByClientId(@Param("clientId") Long clientId);

    /**
     * 상담사별 환불 요청 조회
     */
    @Query("SELECT r FROM RefundRequest r WHERE r.mapping.consultant.id = :consultantId ORDER BY r.createdAt DESC")
    List<RefundRequest> findByConsultantId(@Param("consultantId") Long consultantId);

    /**
     * ERP 참조 번호로 환불 요청 조회
     */
    Optional<RefundRequest> findByErpReferenceNumber(String erpReferenceNumber);

    /**
     * 특정 기간의 완료된 환불 요청 통계
     */
    @Query("SELECT COUNT(r), SUM(r.refundAmount), SUM(r.refundSessions) FROM RefundRequest r WHERE r.status = 'COMPLETED' AND r.completedAt BETWEEN :startDate AND :endDate")
    Object[] getRefundStatistics(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    /**
     * 사유별 환불 요청 통계
     */
    @Query("SELECT r.reasonCode, COUNT(r), SUM(r.refundAmount) FROM RefundRequest r WHERE r.requestedAt BETWEEN :startDate AND :endDate GROUP BY r.reasonCode ORDER BY COUNT(r) DESC")
    List<Object[]> getRefundStatisticsByReason(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    /**
     * 월별 환불 요청 통계
     */
    @Query("SELECT FUNCTION('DATE_FORMAT', r.requestedAt, '%Y-%m') as month, COUNT(r), SUM(r.refundAmount), SUM(r.refundSessions) FROM RefundRequest r WHERE r.requestedAt BETWEEN :startDate AND :endDate GROUP BY FUNCTION('DATE_FORMAT', r.requestedAt, '%Y-%m') ORDER BY month DESC")
    List<Object[]> getMonthlyRefundStatistics(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}
