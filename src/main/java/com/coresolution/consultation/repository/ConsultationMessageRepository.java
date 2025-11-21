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
public interface ConsultationMessageRepository extends BaseRepository<ConsultationMessage, Long> {
    
    /**
     * 상담사 메시지 목록 조회
     */
    @Query("SELECT m FROM ConsultationMessage m WHERE m.consultantId = :consultantId " +
           "AND (:clientId IS NULL OR m.clientId = :clientId) " +
           "AND (:status IS NULL OR m.status = :status) " +
           "AND (:isRead IS NULL OR m.isRead = :isRead) " +
           "AND (:isImportant IS NULL OR m.isImportant = :isImportant) " +
           "AND (:isUrgent IS NULL OR m.isUrgent = :isUrgent) " +
           "AND m.isDeleted = false " +
           "ORDER BY m.createdAt DESC")
    Page<ConsultationMessage> findByConsultantIdAndClientIdAndStatusAndIsReadAndIsImportantAndIsUrgent(
        @Param("consultantId") Long consultantId,
        @Param("clientId") Long clientId,
        @Param("status") String status,
        @Param("isRead") Boolean isRead,
        @Param("isImportant") Boolean isImportant,
        @Param("isUrgent") Boolean isUrgent,
        Pageable pageable);
    
    /**
     * 내담자 메시지 목록 조회 (수신자가 내담자인 메시지만 조회 - 프라이버시 보호)
     */
    @Query("SELECT m FROM ConsultationMessage m WHERE m.receiverId = :clientId " +
           "AND (:consultantId IS NULL OR m.consultantId = :consultantId) " +
           "AND (:status IS NULL OR m.status = :status) " +
           "AND (:isRead IS NULL OR m.isRead = :isRead) " +
           "AND (:isImportant IS NULL OR m.isImportant = :isImportant) " +
           "AND (:isUrgent IS NULL OR m.isUrgent = :isUrgent) " +
           "AND m.isDeleted = false " +
           "ORDER BY m.createdAt DESC")
    Page<ConsultationMessage> findByClientIdAndConsultantIdAndStatusAndIsReadAndIsImportantAndIsUrgent(
        @Param("clientId") Long clientId,
        @Param("consultantId") Long consultantId,
        @Param("status") String status,
        @Param("isRead") Boolean isRead,
        @Param("isImportant") Boolean isImportant,
        @Param("isUrgent") Boolean isUrgent,
        Pageable pageable);
    
    /**
     * 상담사 읽지 않은 메시지 수 조회
     */
    @Query("SELECT COUNT(m) FROM ConsultationMessage m WHERE m.consultantId = :consultantId " +
           "AND m.isRead = false AND m.isDeleted = false")
    Long countByConsultantIdAndIsReadFalse(@Param("consultantId") Long consultantId);
    
    /**
     * 내담자 읽지 않은 메시지 수 조회 (수신자 기준 - 프라이버시 보호)
     */
    @Query("SELECT COUNT(m) FROM ConsultationMessage m WHERE m.receiverId = :clientId " +
           "AND m.isRead = false AND m.isDeleted = false")
    Long countByClientIdAndIsReadFalse(@Param("clientId") Long clientId);
    
    /**
     * 수신자 기준 읽지 않은 메시지 수 조회
     */
    @Query("SELECT COUNT(m) FROM ConsultationMessage m WHERE m.receiverId = :receiverId " +
           "AND m.isRead = false AND m.isDeleted = false")
    Long countByReceiverIdAndIsReadFalse(@Param("receiverId") Long receiverId);
    
    /**
     * 상담사-내담자 간 대화 목록 조회
     */
    @Query("SELECT m FROM ConsultationMessage m WHERE m.consultantId = :consultantId " +
           "AND m.clientId = :clientId AND m.isDeleted = false " +
           "ORDER BY m.createdAt ASC")
    List<ConsultationMessage> findByConsultantIdAndClientIdOrderByCreatedAtAsc(
        @Param("consultantId") Long consultantId,
        @Param("clientId") Long clientId);
    
    /**
     * 상담사 메시지 검색
     */
    @Query("SELECT m FROM ConsultationMessage m WHERE m.consultantId = :consultantId " +
           "AND (m.title LIKE %:keyword% OR m.content LIKE %:keyword%) " +
           "AND (:messageType IS NULL OR m.messageType = :messageType) " +
           "AND (:isImportant IS NULL OR m.isImportant = :isImportant) " +
           "AND (:isUrgent IS NULL OR m.isUrgent = :isUrgent) " +
           "AND m.isDeleted = false " +
           "ORDER BY m.createdAt DESC")
    Page<ConsultationMessage> findByConsultantIdAndTitleContainingOrContentContainingAndMessageTypeAndIsImportantAndIsUrgent(
        @Param("consultantId") Long consultantId,
        @Param("keyword") String keyword,
        @Param("messageType") String messageType,
        @Param("isImportant") Boolean isImportant,
        @Param("isUrgent") Boolean isUrgent,
        Pageable pageable);
    
    /**
     * 내담자 메시지 검색 (수신자 기준 - 프라이버시 보호)
     */
    @Query("SELECT m FROM ConsultationMessage m WHERE m.receiverId = :clientId " +
           "AND (m.title LIKE %:keyword% OR m.content LIKE %:keyword%) " +
           "AND (:messageType IS NULL OR m.messageType = :messageType) " +
           "AND (:isImportant IS NULL OR m.isImportant = :isImportant) " +
           "AND (:isUrgent IS NULL OR m.isUrgent = :isUrgent) " +
           "AND m.isDeleted = false " +
           "ORDER BY m.createdAt DESC")
    Page<ConsultationMessage> findByClientIdAndTitleContainingOrContentContainingAndMessageTypeAndIsImportantAndIsUrgent(
        @Param("clientId") Long clientId,
        @Param("keyword") String keyword,
        @Param("messageType") String messageType,
        @Param("isImportant") Boolean isImportant,
        @Param("isUrgent") Boolean isUrgent,
        Pageable pageable);
    
    /**
     * 상담 ID로 메시지 목록 조회
     */
    @Query("SELECT m FROM ConsultationMessage m WHERE m.consultationId = :consultationId " +
           "AND m.isDeleted = false ORDER BY m.createdAt ASC")
    List<ConsultationMessage> findByConsultationIdOrderByCreatedAtAsc(@Param("consultationId") Long consultationId);
    
    /**
     * 중요 메시지 목록 조회 (상담사용)
     */
    @Query("SELECT m FROM ConsultationMessage m WHERE m.consultantId = :consultantId " +
           "AND m.isImportant = true AND m.isDeleted = false " +
           "ORDER BY m.createdAt DESC")
    List<ConsultationMessage> findImportantMessagesByConsultantId(@Param("consultantId") Long consultantId);
    
    /**
     * 중요 메시지 목록 조회 (내담자용 - 수신자 기준, 프라이버시 보호)
     */
    @Query("SELECT m FROM ConsultationMessage m WHERE m.receiverId = :clientId " +
           "AND m.isImportant = true AND m.isDeleted = false " +
           "ORDER BY m.createdAt DESC")
    List<ConsultationMessage> findImportantMessagesByClientId(@Param("clientId") Long clientId);
    
    /**
     * 긴급 메시지 목록 조회 (상담사용)
     */
    @Query("SELECT m FROM ConsultationMessage m WHERE m.consultantId = :consultantId " +
           "AND m.isUrgent = true AND m.isDeleted = false " +
           "ORDER BY m.createdAt DESC")
    List<ConsultationMessage> findUrgentMessagesByConsultantId(@Param("consultantId") Long consultantId);
    
    /**
     * 긴급 메시지 목록 조회 (내담자용 - 수신자 기준, 프라이버시 보호)
     */
    @Query("SELECT m FROM ConsultationMessage m WHERE m.receiverId = :clientId " +
           "AND m.isUrgent = true AND m.isDeleted = false " +
           "ORDER BY m.createdAt DESC")
    List<ConsultationMessage> findUrgentMessagesByClientId(@Param("clientId") Long clientId);
    
    // === BaseRepository 메서드 오버라이드 ===
    // ConsultationMessage 엔티티는 branchId 필드가 없음
    // findAllByTenantIdAndBranchId 메서드를 오버라이드하여 branchId를 무시하도록 함
    
    /**
     * 테넌트 ID로 활성 메시지 조회
     * ConsultationMessage 엔티티는 branchId 필드가 없으므로 branchId를 무시
     * 
     * @param tenantId 테넌트 UUID
     * @param branchId 지점 ID (무시됨, 쿼리에서 사용하지 않음)
     * @return 활성 메시지 목록
     */
    @Query("SELECT m FROM ConsultationMessage m WHERE m.tenantId = :tenantId AND m.isDeleted = false AND (:branchId IS NULL OR 1=1)")
    List<ConsultationMessage> findAllByTenantIdAndBranchId(@Param("tenantId") String tenantId, @Param("branchId") Long branchId);
    
    /**
     * 테넌트 ID로 활성 메시지 조회 (페이징)
     * ConsultationMessage 엔티티는 branchId 필드가 없으므로 branchId를 무시
     * 
     * @param tenantId 테넌트 UUID
     * @param branchId 지점 ID (무시됨, 쿼리에서 사용하지 않음)
     * @param pageable 페이징 정보
     * @return 활성 메시지 페이지
     */
    @Query("SELECT m FROM ConsultationMessage m WHERE m.tenantId = :tenantId AND m.isDeleted = false AND (:branchId IS NULL OR 1=1)")
    Page<ConsultationMessage> findAllByTenantIdAndBranchId(@Param("tenantId") String tenantId, @Param("branchId") Long branchId, Pageable pageable);
}
