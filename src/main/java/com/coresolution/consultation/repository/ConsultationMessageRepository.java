package com.coresolution.consultation.repository;

import java.util.List;
import com.coresolution.consultation.entity.ConsultationMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 상담사-내담자 메시지 리포지토리
 */
@Repository
/**
 * @Deprecated - 표준화 2025-12-07: branchCode 파라미터는 레거시 호환용
 */
public interface ConsultationMessageRepository extends BaseRepository<ConsultationMessage, Long> {
    
    /**
     * 테넌트별 모든 메시지 조회 (tenantId 필터링)
     */
    @Query("SELECT m FROM ConsultationMessage m WHERE m.tenantId = :tenantId AND m.isDeleted = false ORDER BY m.createdAt DESC")
    List<ConsultationMessage> findByTenantId(@Param("tenantId") String tenantId);
    
    /**
     * 테넌트별 삭제된 메시지 조회 (tenantId 필수)
     */
    @Query("SELECT m FROM ConsultationMessage m WHERE m.tenantId = :tenantId AND m.isDeleted = true")
    List<ConsultationMessage> findAllDeletedByTenantId(@Param("tenantId") String tenantId);
    
    /**
     * 테넌트별 삭제된 메시지 수 (tenantId 필수)
     */
    @Query("SELECT COUNT(m) FROM ConsultationMessage m WHERE m.tenantId = :tenantId AND m.isDeleted = true")
    long countDeletedByTenantId(@Param("tenantId") String tenantId);
    
    /**
     * 상담사 메시지 목록 조회 (tenantId 필수)
     */
    @Query("SELECT m FROM ConsultationMessage m WHERE m.tenantId = :tenantId AND m.consultantId = :consultantId " +
           "AND (:clientId IS NULL OR m.clientId = :clientId) " +
           "AND (:status IS NULL OR m.status = :status) " +
           "AND (:isRead IS NULL OR m.isRead = :isRead) " +
           "AND (:isImportant IS NULL OR m.isImportant = :isImportant) " +
           "AND (:isUrgent IS NULL OR m.isUrgent = :isUrgent) " +
           "AND m.isDeleted = false " +
           "ORDER BY m.createdAt DESC")
    Page<ConsultationMessage> findByTenantIdAndConsultantIdAndClientIdAndStatusAndIsReadAndIsImportantAndIsUrgent(
        @Param("tenantId") String tenantId,
        @Param("consultantId") Long consultantId,
        @Param("clientId") Long clientId,
        @Param("status") String status,
        @Param("isRead") Boolean isRead,
        @Param("isImportant") Boolean isImportant,
        @Param("isUrgent") Boolean isUrgent,
        Pageable pageable);
    
    /**
     * 내담자 메시지 목록 조회 (수신자 기준, tenantId 필수)
     */
    @Query("SELECT m FROM ConsultationMessage m WHERE m.tenantId = :tenantId AND m.receiverId = :clientId " +
           "AND (:consultantId IS NULL OR m.consultantId = :consultantId) " +
           "AND (:status IS NULL OR m.status = :status) " +
           "AND (:isRead IS NULL OR m.isRead = :isRead) " +
           "AND (:isImportant IS NULL OR m.isImportant = :isImportant) " +
           "AND (:isUrgent IS NULL OR m.isUrgent = :isUrgent) " +
           "AND m.isDeleted = false " +
           "ORDER BY m.createdAt DESC")
    Page<ConsultationMessage> findByTenantIdAndClientIdAndConsultantIdAndStatusAndIsReadAndIsImportantAndIsUrgent(
        @Param("tenantId") String tenantId,
        @Param("clientId") Long clientId,
        @Param("consultantId") Long consultantId,
        @Param("status") String status,
        @Param("isRead") Boolean isRead,
        @Param("isImportant") Boolean isImportant,
        @Param("isUrgent") Boolean isUrgent,
        Pageable pageable);
    
    /**
     * 상담사 읽지 않은 메시지 수 조회 (tenantId 필수)
     */
    @Query("SELECT COUNT(m) FROM ConsultationMessage m WHERE m.tenantId = :tenantId AND m.consultantId = :consultantId " +
           "AND m.isRead = false AND m.isDeleted = false")
    Long countByTenantIdAndConsultantIdAndIsReadFalse(@Param("tenantId") String tenantId, @Param("consultantId") Long consultantId);
    
    /**
     * 내담자 읽지 않은 메시지 수 조회 (수신자 기준, tenantId 필수)
     */
    @Query("SELECT COUNT(m) FROM ConsultationMessage m WHERE m.tenantId = :tenantId AND m.receiverId = :clientId " +
           "AND m.isRead = false AND m.isDeleted = false")
    Long countByTenantIdAndClientIdAndIsReadFalse(@Param("tenantId") String tenantId, @Param("clientId") Long clientId);
    
    /**
     * 수신자 기준 읽지 않은 메시지 수 조회 (tenantId 필수)
     */
    @Query("SELECT COUNT(m) FROM ConsultationMessage m WHERE m.tenantId = :tenantId AND m.receiverId = :receiverId " +
           "AND m.isRead = false AND m.isDeleted = false")
    Long countByTenantIdAndReceiverIdAndIsReadFalse(@Param("tenantId") String tenantId, @Param("receiverId") Long receiverId);
    
    /**
     * 상담사-내담자 간 대화 목록 조회 (tenantId 필수)
     */
    @Query("SELECT m FROM ConsultationMessage m WHERE m.tenantId = :tenantId AND m.consultantId = :consultantId " +
           "AND m.clientId = :clientId AND m.isDeleted = false " +
           "ORDER BY m.createdAt ASC")
    List<ConsultationMessage> findByTenantIdAndConsultantIdAndClientIdOrderByCreatedAtAsc(
        @Param("tenantId") String tenantId,
        @Param("consultantId") Long consultantId,
        @Param("clientId") Long clientId);
    
    /**
     * 상담사 메시지 검색 (tenantId 필수)
     */
    @Query("SELECT m FROM ConsultationMessage m WHERE m.tenantId = :tenantId AND m.consultantId = :consultantId " +
           "AND (m.title LIKE %:keyword% OR m.content LIKE %:keyword%) " +
           "AND (:messageType IS NULL OR m.messageType = :messageType) " +
           "AND (:isImportant IS NULL OR m.isImportant = :isImportant) " +
           "AND (:isUrgent IS NULL OR m.isUrgent = :isUrgent) " +
           "AND m.isDeleted = false " +
           "ORDER BY m.createdAt DESC")
    Page<ConsultationMessage> findByTenantIdAndConsultantIdAndTitleContainingOrContentContainingAndMessageTypeAndIsImportantAndIsUrgent(
        @Param("tenantId") String tenantId,
        @Param("consultantId") Long consultantId,
        @Param("keyword") String keyword,
        @Param("messageType") String messageType,
        @Param("isImportant") Boolean isImportant,
        @Param("isUrgent") Boolean isUrgent,
        Pageable pageable);
    
    /**
     * 내담자 메시지 검색 (수신자 기준, tenantId 필수)
     */
    @Query("SELECT m FROM ConsultationMessage m WHERE m.tenantId = :tenantId AND m.receiverId = :clientId " +
           "AND (m.title LIKE %:keyword% OR m.content LIKE %:keyword%) " +
           "AND (:messageType IS NULL OR m.messageType = :messageType) " +
           "AND (:isImportant IS NULL OR m.isImportant = :isImportant) " +
           "AND (:isUrgent IS NULL OR m.isUrgent = :isUrgent) " +
           "AND m.isDeleted = false " +
           "ORDER BY m.createdAt DESC")
    Page<ConsultationMessage> findByTenantIdAndClientIdAndTitleContainingOrContentContainingAndMessageTypeAndIsImportantAndIsUrgent(
        @Param("tenantId") String tenantId,
        @Param("clientId") Long clientId,
        @Param("keyword") String keyword,
        @Param("messageType") String messageType,
        @Param("isImportant") Boolean isImportant,
        @Param("isUrgent") Boolean isUrgent,
        Pageable pageable);
    
    /**
     * 상담 ID로 메시지 목록 조회 (tenantId 필수)
     */
    @Query("SELECT m FROM ConsultationMessage m WHERE m.tenantId = :tenantId AND m.consultationId = :consultationId " +
           "AND m.isDeleted = false ORDER BY m.createdAt ASC")
    List<ConsultationMessage> findByTenantIdAndConsultationIdOrderByCreatedAtAsc(@Param("tenantId") String tenantId, @Param("consultationId") Long consultationId);
    
    /**
     * 중요 메시지 목록 조회 (상담사용, tenantId 필수)
     */
    @Query("SELECT m FROM ConsultationMessage m WHERE m.tenantId = :tenantId AND m.consultantId = :consultantId " +
           "AND m.isImportant = true AND m.isDeleted = false " +
           "ORDER BY m.createdAt DESC")
    List<ConsultationMessage> findImportantMessagesByTenantIdAndConsultantId(@Param("tenantId") String tenantId, @Param("consultantId") Long consultantId);
    
    /**
     * 중요 메시지 목록 조회 (내담자용 - 수신자 기준, tenantId 필수)
     */
    @Query("SELECT m FROM ConsultationMessage m WHERE m.tenantId = :tenantId AND m.receiverId = :clientId " +
           "AND m.isImportant = true AND m.isDeleted = false " +
           "ORDER BY m.createdAt DESC")
    List<ConsultationMessage> findImportantMessagesByTenantIdAndClientId(@Param("tenantId") String tenantId, @Param("clientId") Long clientId);
    
    /**
     * 긴급 메시지 목록 조회 (상담사용, tenantId 필수)
     */
    @Query("SELECT m FROM ConsultationMessage m WHERE m.tenantId = :tenantId AND m.consultantId = :consultantId " +
           "AND m.isUrgent = true AND m.isDeleted = false " +
           "ORDER BY m.createdAt DESC")
    List<ConsultationMessage> findUrgentMessagesByTenantIdAndConsultantId(@Param("tenantId") String tenantId, @Param("consultantId") Long consultantId);
    
    /**
     * 긴급 메시지 목록 조회 (내담자용 - 수신자 기준, tenantId 필수)
     */
    @Query("SELECT m FROM ConsultationMessage m WHERE m.tenantId = :tenantId AND m.receiverId = :clientId " +
           "AND m.isUrgent = true AND m.isDeleted = false " +
           "ORDER BY m.createdAt DESC")
    List<ConsultationMessage> findUrgentMessagesByTenantIdAndClientId(@Param("tenantId") String tenantId, @Param("clientId") Long clientId);
    
    // === BaseRepository 메서드 오버라이드 ===
    // 브랜치 개념 제거: findAllByTenantIdAndBranchId 메서드는 Deprecated 처리됨 (표준화 2025-12-05)
    
    /**
     * 테넌트 ID로 활성 메시지 조회
     * 
     * @param tenantId 테넌트 UUID
     * @param branchId 지점 ID (무시됨, 쿼리에서 사용하지 않음)
     * @return 활성 메시지 목록
     * @deprecated 브랜치 개념 제거됨 (표준화 2025-12-05). 레거시 호환용으로 유지되지만 새로운 코드에서는 사용하지 마세요.
     *             대신 {@link #findByTenantId(String)}를 사용하세요.
     */
    @Deprecated
    @Query("SELECT m FROM ConsultationMessage m WHERE m.tenantId = :tenantId AND m.isDeleted = false AND (:branchId IS NULL OR 1=1)")
    List<ConsultationMessage> findAllByTenantIdAndBranchId(@Param("tenantId") String tenantId, @Param("branchId") Long branchId);
    
    /**
     * 테넌트 ID로 활성 메시지 조회 (페이징)
     * 
     * @param tenantId 테넌트 UUID
     * @param branchId 지점 ID (무시됨, 쿼리에서 사용하지 않음)
     * @param pageable 페이징 정보
     * @return 활성 메시지 페이지
     * @deprecated 브랜치 개념 제거됨 (표준화 2025-12-05). 레거시 호환용으로 유지되지만 새로운 코드에서는 사용하지 마세요.
     *             대신 {@link BaseRepository#findAllByTenantId(String, Pageable)}를 사용하세요.
     */
    @Deprecated
    @Query("SELECT m FROM ConsultationMessage m WHERE m.tenantId = :tenantId AND m.isDeleted = false AND (:branchId IS NULL OR 1=1)")
    Page<ConsultationMessage> findAllByTenantIdAndBranchId(@Param("tenantId") String tenantId, @Param("branchId") Long branchId, Pageable pageable);
}
