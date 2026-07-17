package com.coresolution.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.SessionExtensionRequest;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

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
     * 테넌트 ID와 요청 ID로 단건 조회 (소프트 삭제 컬럼 없음)
     *
     * @param tenantId 테넌트 ID
     * @param id       요청 PK
     * @return 해당 테넌트의 요청
     */
    @Query("SELECT ser FROM SessionExtensionRequest ser WHERE ser.tenantId = :tenantId AND ser.id = :id")
    Optional<SessionExtensionRequest> findByTenantIdAndId(@Param("tenantId") String tenantId, @Param("id") Long id);

    /**
     * 입금 확인 중 동일 요청의 중복 처리를 막기 위해 행 잠금으로 조회한다.
     *
     * @param tenantId 테넌트 ID
     * @param id 요청 PK
     * @return 해당 테넌트의 잠긴 요청
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ser FROM SessionExtensionRequest ser WHERE ser.tenantId = :tenantId AND ser.id = :id")
    Optional<SessionExtensionRequest> findByTenantIdAndIdForUpdate(
            @Param("tenantId") String tenantId,
            @Param("id") Long id);

    /**
     * 테넌트 ID와 요청 ID로 단건 조회 (연관 엔티티 fetch join)
     */
    @Query("SELECT ser FROM SessionExtensionRequest ser " +
           "LEFT JOIN FETCH ser.mapping m " +
           "LEFT JOIN FETCH m.client c " +
           "LEFT JOIN FETCH m.consultant co " +
           "LEFT JOIN FETCH ser.requester r " +
           "LEFT JOIN FETCH ser.approvedBy ab " +
           "WHERE ser.tenantId = :tenantId AND ser.id = :id")
    Optional<SessionExtensionRequest> findByTenantIdAndIdWithDetails(
            @Param("tenantId") String tenantId, @Param("id") Long id);

    /**
     * 전체 회기 추가 요청 목록 조회 (생성일 내림차순)
     */
    List<SessionExtensionRequest> findAllByOrderByCreatedAtDesc();
    
    /**
     * 전체 회기 추가 요청 목록 조회 (매핑 정보 포함, 생성일 내림차순)
     */
    @Query("SELECT ser FROM SessionExtensionRequest ser " +
           "LEFT JOIN FETCH ser.mapping m " +
           "LEFT JOIN FETCH m.client c " +
           "LEFT JOIN FETCH m.consultant co " +
           "LEFT JOIN FETCH ser.requester r " +
           "ORDER BY ser.createdAt DESC")
    List<SessionExtensionRequest> findAllWithMappingOrderByCreatedAtDesc();
    
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
     * 테넌트·매핑·상태 조건으로 회기 추가 요청을 조회한다.
     *
     * @param tenantId 테넌트 ID
     * @param mappingId 매핑 PK
     * @param status 요청 상태
     * @return 조건에 맞는 요청 목록
     */
    @Query("SELECT ser FROM SessionExtensionRequest ser "
           + "WHERE ser.tenantId = :tenantId "
           + "AND ser.mapping.id = :mappingId "
           + "AND ser.status = :status "
           + "ORDER BY ser.createdAt ASC")
    List<SessionExtensionRequest> findByTenantIdAndMappingIdAndStatus(
            @Param("tenantId") String tenantId,
            @Param("mappingId") Long mappingId,
            @Param("status") SessionExtensionRequest.ExtensionStatus status);
    
    /**
     * 입금 확인 대기 중인 요청 목록 조회 (매핑 정보 포함)
     */
    @Query("SELECT ser FROM SessionExtensionRequest ser " +
           "LEFT JOIN FETCH ser.mapping m " +
           "LEFT JOIN FETCH m.client c " +
           "LEFT JOIN FETCH m.consultant co " +
           "LEFT JOIN FETCH ser.requester r " +
           "WHERE ser.tenantId = :tenantId AND ser.status = 'PENDING' " +
           "ORDER BY ser.createdAt ASC")
    List<SessionExtensionRequest> findPendingPaymentRequests(@Param("tenantId") String tenantId);
    
    /**
     * 관리자 승인 대기 중인 요청 목록 조회 (매핑 정보 포함)
     */
    @Query("SELECT ser FROM SessionExtensionRequest ser " +
           "LEFT JOIN FETCH ser.mapping m " +
           "LEFT JOIN FETCH m.client c " +
           "LEFT JOIN FETCH m.consultant co " +
           "LEFT JOIN FETCH ser.requester r " +
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
