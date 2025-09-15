package com.mindgarden.consultation.repository;

import com.mindgarden.consultation.entity.SessionExtensionRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 회기 추가 요청 리포지토리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Repository
public interface SessionExtensionRequestRepository extends JpaRepository<SessionExtensionRequest, Long> {
    
    /**
     * 전체 회기 추가 요청 목록 조회 (생성일 내림차순)
     */
    List<SessionExtensionRequest> findAllByOrderByCreatedAtDesc();
    
    /**
     * 상태별 회기 추가 요청 목록 조회
     */
    List<SessionExtensionRequest> findByStatusOrderByCreatedAtDesc(SessionExtensionRequest.ExtensionStatus status);
    
    /**
     * 요청자별 회기 추가 요청 목록 조회
     */
    List<SessionExtensionRequest> findByRequesterIdOrderByCreatedAtDesc(Long requesterId);
    
    /**
     * 매핑별 회기 추가 요청 목록 조회
     */
    List<SessionExtensionRequest> findByMappingIdOrderByCreatedAtDesc(Long mappingId);
    
    /**
     * 입금 확인 대기 중인 요청 목록 조회
     */
    @Query("SELECT ser FROM SessionExtensionRequest ser " +
           "WHERE ser.status = 'PENDING' " +
           "ORDER BY ser.createdAt ASC")
    List<SessionExtensionRequest> findPendingPaymentRequests();
    
    /**
     * 관리자 승인 대기 중인 요청 목록 조회
     */
    @Query("SELECT ser FROM SessionExtensionRequest ser " +
           "WHERE ser.status = 'PAYMENT_CONFIRMED' " +
           "ORDER BY ser.createdAt ASC")
    List<SessionExtensionRequest> findPendingAdminApprovalRequests();
    
    /**
     * 승인된 요청 목록 조회
     */
    @Query("SELECT ser FROM SessionExtensionRequest ser " +
           "WHERE ser.status = 'ADMIN_APPROVED' " +
           "ORDER BY ser.approvedAt DESC")
    List<SessionExtensionRequest> findApprovedRequests();
    
    /**
     * 거부된 요청 목록 조회
     */
    @Query("SELECT ser FROM SessionExtensionRequest ser " +
           "WHERE ser.status = 'REJECTED' " +
           "ORDER BY ser.rejectedAt DESC")
    List<SessionExtensionRequest> findRejectedRequests();
    
    /**
     * 완료된 요청 목록 조회
     */
    @Query("SELECT ser FROM SessionExtensionRequest ser " +
           "WHERE ser.status = 'COMPLETED' " +
           "ORDER BY ser.updatedAt DESC")
    List<SessionExtensionRequest> findCompletedRequests();
    
    /**
     * 특정 기간 내 요청 통계
     */
    @Query("SELECT ser.status, COUNT(ser) FROM SessionExtensionRequest ser " +
           "WHERE ser.createdAt >= :startDate AND ser.createdAt <= :endDate " +
           "GROUP BY ser.status")
    List<Object[]> getRequestStatsByPeriod(@Param("startDate") java.time.LocalDateTime startDate, 
                                          @Param("endDate") java.time.LocalDateTime endDate);
    
    /**
     * 요청자별 요청 통계
     */
    @Query("SELECT ser.requester.id, ser.requester.name, COUNT(ser), SUM(ser.packagePrice) " +
           "FROM SessionExtensionRequest ser " +
           "GROUP BY ser.requester.id, ser.requester.name " +
           "ORDER BY COUNT(ser) DESC")
    List<Object[]> getRequestStatsByRequester();
}
