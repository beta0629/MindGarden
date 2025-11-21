package com.coresolution.consultation.repository;

import java.time.LocalDateTime;
import java.util.List;
import com.coresolution.consultation.entity.Alert;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 알림 시스템 Repository
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Repository
public interface AlertRepository extends BaseRepository<Alert, Long> {
    
    /**
     * 사용자 ID로 알림 조회 (활성 상태만)
     */
    @Query("SELECT a FROM Alert a WHERE a.userId = ?1 AND a.isDeleted = false ORDER BY a.createdAt DESC")
    List<Alert> findByUserId(Long userId);
    
    /**
     * 사용자 ID로 알림 페이징 조회 (활성 상태만)
     */
    @Query("SELECT a FROM Alert a WHERE a.userId = ?1 AND a.isDeleted = false ORDER BY a.createdAt DESC")
    Page<Alert> findByUserId(Long userId, Pageable pageable);
    
    /**
     * 사용자 ID로 알림 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(a) FROM Alert a WHERE a.userId = ?1 AND a.isDeleted = false")
    long countByUserId(Long userId);
    
    /**
     * 사용자 ID로 읽지 않은 알림 조회 (활성 상태만)
     */
    @Query("SELECT a FROM Alert a WHERE a.userId = ?1 AND a.status = 'UNREAD' AND a.isDeleted = false ORDER BY a.createdAt DESC")
    List<Alert> findUnreadByUserId(Long userId);
    
    /**
     * 사용자 ID로 읽지 않은 알림 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(a) FROM Alert a WHERE a.userId = ?1 AND a.status = 'UNREAD' AND a.isDeleted = false")
    long countUnreadByUserId(Long userId);
    
    /**
     * 사용자 ID로 읽은 알림 조회 (활성 상태만)
     */
    @Query("SELECT a FROM Alert a WHERE a.userId = ?1 AND a.status = 'READ' AND a.isDeleted = false ORDER BY a.readAt DESC")
    List<Alert> findReadByUserId(Long userId);
    
    /**
     * 사용자 ID로 읽은 알림 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(a) FROM Alert a WHERE a.userId = ?1 AND a.status = 'READ' AND a.isDeleted = false")
    long countReadByUserId(Long userId);
    
    /**
     * 사용자 ID로 보관된 알림 조회 (활성 상태만)
     */
    @Query("SELECT a FROM Alert a WHERE a.userId = ?1 AND a.status = 'ARCHIVED' AND a.isDeleted = false ORDER BY a.archivedAt DESC")
    List<Alert> findArchivedByUserId(Long userId);
    
    /**
     * 사용자 ID로 보관된 알림 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(a) FROM Alert a WHERE a.userId = ?1 AND a.status = 'ARCHIVED' AND a.isDeleted = false")
    long countArchivedByUserId(Long userId);
    
    /**
     * 알림 유형별 조회 (활성 상태만)
     */
    @Query("SELECT a FROM Alert a WHERE a.type = ?1 AND a.isDeleted = false ORDER BY a.createdAt DESC")
    List<Alert> findByType(String type);
    
    /**
     * 알림 유형별 페이징 조회 (활성 상태만)
     */
    @Query("SELECT a FROM Alert a WHERE a.type = ?1 AND a.isDeleted = false ORDER BY a.createdAt DESC")
    Page<Alert> findByType(String type, Pageable pageable);
    
    /**
     * 알림 유형별 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(a) FROM Alert a WHERE a.type = ?1 AND a.isDeleted = false")
    long countByType(String type);
    
    /**
     * 우선순위별 알림 조회 (활성 상태만)
     */
    @Query("SELECT a FROM Alert a WHERE a.priority = ?1 AND a.isDeleted = false ORDER BY a.createdAt DESC")
    List<Alert> findByPriority(String priority);
    
    /**
     * 우선순위별 알림 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(a) FROM Alert a WHERE a.priority = ?1 AND a.isDeleted = false")
    long countByPriority(String priority);
    
    /**
     * 상태별 알림 조회 (활성 상태만)
     */
    @Query("SELECT a FROM Alert a WHERE a.status = ?1 AND a.isDeleted = false ORDER BY a.createdAt DESC")
    List<Alert> findByStatus(String status);
    
    /**
     * 상태별 알림 페이징 조회 (활성 상태만)
     */
    @Query("SELECT a FROM Alert a WHERE a.status = ?1 AND a.isDeleted = false ORDER BY a.createdAt DESC")
    Page<Alert> findByStatus(String status, Pageable pageable);
    
    /**
     * 상태별 알림 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(a) FROM Alert a WHERE a.status = ?1 AND a.isDeleted = false")
    long countByStatus(String status);
    
    /**
     * 채널별 알림 조회 (활성 상태만)
     */
    @Query("SELECT a FROM Alert a WHERE a.channel = ?1 AND a.isDeleted = false ORDER BY a.createdAt DESC")
    List<Alert> findByChannel(String channel);
    
    /**
     * 채널별 알림 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(a) FROM Alert a WHERE a.channel = ?1 AND a.isDeleted = false")
    long countByChannel(String channel);
    
    /**
     * 상단 고정 알림 조회 (활성 상태만)
     */
    @Query("SELECT a FROM Alert a WHERE a.isSticky = true AND a.isDeleted = false ORDER BY a.createdAt DESC")
    List<Alert> findStickyAlerts();
    
    /**
     * 상단 고정 알림 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(a) FROM Alert a WHERE a.isSticky = true AND a.isDeleted = false")
    long countStickyAlerts();
    
    /**
     * 반복 알림 조회 (활성 상태만)
     */
    @Query("SELECT a FROM Alert a WHERE a.isRecurring = true AND a.isDeleted = false ORDER BY a.nextSendAt")
    List<Alert> findRecurringAlerts();
    
    /**
     * 반복 알림 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(a) FROM Alert a WHERE a.isRecurring = true AND a.isDeleted = false")
    long countRecurringAlerts();
    
    /**
     * 발송 완료된 알림 조회 (활성 상태만)
     */
    @Query("SELECT a FROM Alert a WHERE a.isSent = true AND a.isDeleted = false ORDER BY a.sentAt DESC")
    List<Alert> findSentAlerts();
    
    /**
     * 발송 완료된 알림 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(a) FROM Alert a WHERE a.isSent = true AND a.isDeleted = false")
    long countSentAlerts();
    
    /**
     * 발송 실패한 알림 조회 (활성 상태만)
     */
    @Query("SELECT a FROM Alert a WHERE a.sendError IS NOT NULL AND a.isDeleted = false ORDER BY a.createdAt DESC")
    List<Alert> findFailedAlerts();
    
    /**
     * 발송 실패한 알림 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(a) FROM Alert a WHERE a.sendError IS NOT NULL AND a.isDeleted = false")
    long countFailedAlerts();
    
    /**
     * 특정 기간에 생성된 알림 조회 (활성 상태만)
     */
    @Query("SELECT a FROM Alert a WHERE a.createdAt BETWEEN ?1 AND ?2 AND a.isDeleted = false ORDER BY a.createdAt DESC")
    List<Alert> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * 특정 기간에 생성된 알림 페이징 조회 (활성 상태만)
     */
    @Query("SELECT a FROM Alert a WHERE a.createdAt BETWEEN ?1 AND ?2 AND a.isDeleted = false ORDER BY a.createdAt DESC")
    Page<Alert> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);
    
    /**
     * 특정 기간에 생성된 알림 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(a) FROM Alert a WHERE a.createdAt BETWEEN ?1 AND ?2 AND a.isDeleted = false")
    long countByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * 특정 기간에 읽은 알림 조회 (활성 상태만)
     */
    @Query("SELECT a FROM Alert a WHERE a.readAt BETWEEN ?1 AND ?2 AND a.isDeleted = false ORDER BY a.readAt DESC")
    List<Alert> findByReadAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * 특정 기간에 읽은 알림 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(a) FROM Alert a WHERE a.readAt BETWEEN ?1 AND ?2 AND a.isDeleted = false")
    long countByReadAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * 특정 기간에 발송된 알림 조회 (활성 상태만)
     */
    @Query("SELECT a FROM Alert a WHERE a.sentAt BETWEEN ?1 AND ?2 AND a.isDeleted = false ORDER BY a.sentAt DESC")
    List<Alert> findBySentAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * 특정 기간에 발송된 알림 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(a) FROM Alert a WHERE a.sentAt BETWEEN ?1 AND ?2 AND a.isDeleted = false")
    long countBySentAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * 예약 발송 알림 조회 (활성 상태만)
     */
    @Query("SELECT a FROM Alert a WHERE a.scheduledAt IS NOT NULL AND a.scheduledAt > ?1 AND a.isDeleted = false ORDER BY a.scheduledAt")
    List<Alert> findScheduledAlerts(LocalDateTime currentTime);
    
    /**
     * 예약 발송 알림 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(a) FROM Alert a WHERE a.scheduledAt IS NOT NULL AND a.scheduledAt > ?1 AND a.isDeleted = false")
    long countScheduledAlerts(LocalDateTime currentTime);
    
    /**
     * 만료된 알림 조회 (활성 상태만)
     */
    @Query("SELECT a FROM Alert a WHERE a.expiresAt IS NOT NULL AND a.expiresAt < ?1 AND a.isDeleted = false")
    List<Alert> findExpiredAlerts(LocalDateTime currentTime);
    
    /**
     * 만료된 알림 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(a) FROM Alert a WHERE a.expiresAt IS NOT NULL AND a.expiresAt < ?1 AND a.isDeleted = false")
    long countExpiredAlerts(LocalDateTime currentTime);
    
    /**
     * 다음 발송 예정 알림 조회 (활성 상태만)
     */
    @Query("SELECT a FROM Alert a WHERE a.nextSendAt IS NOT NULL AND a.nextSendAt <= ?1 AND a.isDeleted = false ORDER BY a.nextSendAt")
    List<Alert> findNextSendAlerts(LocalDateTime currentTime);
    
    /**
     * 다음 발송 예정 알림 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(a) FROM Alert a WHERE a.nextSendAt IS NOT NULL AND a.nextSendAt <= ?1 AND a.isDeleted = false")
    long countNextSendAlerts(LocalDateTime currentTime);
    
    /**
     * 재시도 예정 알림 조회 (활성 상태만)
     */
    @Query("SELECT a FROM Alert a WHERE a.nextRetryAt IS NOT NULL AND a.nextRetryAt <= ?1 AND a.isDeleted = false ORDER BY a.nextRetryAt")
    List<Alert> findRetryAlerts(LocalDateTime currentTime);
    
    /**
     * 재시도 예정 알림 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(a) FROM Alert a WHERE a.nextRetryAt IS NOT NULL AND a.nextRetryAt <= ?1 AND a.isDeleted = false")
    long countRetryAlerts(LocalDateTime currentTime);
    
    /**
     * 관련 엔티티별 알림 조회 (활성 상태만)
     */
    @Query("SELECT a FROM Alert a WHERE a.relatedEntityType = ?1 AND a.relatedEntityId = ?2 AND a.isDeleted = false ORDER BY a.createdAt DESC")
    List<Alert> findByRelatedEntity(String entityType, Long entityId);
    
    /**
     * 관련 엔티티별 알림 개수 조회 (활성 상태만)
     */
    @Query("SELECT COUNT(a) FROM Alert a WHERE a.relatedEntityType = ?1 AND a.relatedEntityId = ?2 AND a.isDeleted = false")
    long countByRelatedEntity(String entityType, Long entityId);
    
    /**
     * 복합 조건으로 알림 검색 (활성 상태만)
     */
    @Query("SELECT a FROM Alert a WHERE " +
           "(:userId IS NULL OR a.userId = :userId) AND " +
           "(:type IS NULL OR a.type = :type) AND " +
           "(:priority IS NULL OR a.priority = :priority) AND " +
           "(:status IS NULL OR a.status = :status) AND " +
           "(:channel IS NULL OR a.channel = :channel) AND " +
           "(:isSticky IS NULL OR a.isSticky = :isSticky) AND " +
           "(:isRecurring IS NULL OR a.isRecurring = :isRecurring) AND " +
           "(:isSent IS NULL OR a.isSent = :isSent) AND " +
           "(:startDate IS NULL OR a.createdAt >= :startDate) AND " +
           "(:endDate IS NULL OR a.createdAt <= :endDate) AND " +
           "a.isDeleted = false " +
           "ORDER BY a.createdAt DESC")
    Page<Alert> findByComplexCriteria(@Param("userId") Long userId,
                                    @Param("type") String type,
                                    @Param("priority") String priority,
                                    @Param("status") String status,
                                    @Param("channel") String channel,
                                    @Param("isSticky") Boolean isSticky,
                                    @Param("isRecurring") Boolean isRecurring,
                                    @Param("isSent") Boolean isSent,
                                    @Param("startDate") LocalDateTime startDate,
                                    @Param("endDate") LocalDateTime endDate,
                                    Pageable pageable);
    
    /**
     * 알림 통계 정보 조회 (활성 상태만)
     */
    @Query("SELECT " +
           "COUNT(a) as totalAlerts, " +
           "COUNT(CASE WHEN a.status = 'UNREAD' THEN 1 END) as unreadCount, " +
           "COUNT(CASE WHEN a.status = 'READ' THEN 1 END) as readCount, " +
           "COUNT(CASE WHEN a.status = 'ARCHIVED' THEN 1 END) as archivedCount, " +
           "COUNT(CASE WHEN a.isSent = true THEN 1 END) as sentCount, " +
           "COUNT(CASE WHEN a.sendError IS NOT NULL THEN 1 END) as failedCount, " +
           "COUNT(CASE WHEN a.isSticky = true THEN 1 END) as stickyCount, " +
           "COUNT(CASE WHEN a.isRecurring = true THEN 1 END) as recurringCount " +
           "FROM Alert a WHERE a.isDeleted = false")
    Object[] getAlertStatistics();
    
    /**
     * 사용자별 알림 통계 조회 (활성 상태만)
     */
    @Query("SELECT a.userId, COUNT(a) as count, " +
           "COUNT(CASE WHEN a.status = 'UNREAD' THEN 1 END) as unreadCount, " +
           "COUNT(CASE WHEN a.status = 'READ' THEN 1 END) as readCount " +
           "FROM Alert a WHERE a.isDeleted = false GROUP BY a.userId")
    List<Object[]> getAlertStatisticsByUser();
    
    /**
     * 유형별 알림 통계 조회 (활성 상태만)
     */
    @Query("SELECT a.type, COUNT(a) as count FROM Alert a WHERE a.isDeleted = false GROUP BY a.type")
    List<Object[]> getAlertStatisticsByType();
    
    /**
     * 우선순위별 알림 통계 조회 (활성 상태만)
     */
    @Query("SELECT a.priority, COUNT(a) as count FROM Alert a WHERE a.isDeleted = false GROUP BY a.priority")
    List<Object[]> getAlertStatisticsByPriority();
    
    /**
     * 상태별 알림 통계 조회 (활성 상태만)
     */
    @Query("SELECT a.status, COUNT(a) as count FROM Alert a WHERE a.isDeleted = false GROUP BY a.status")
    List<Object[]> getAlertStatisticsByStatus();
    
    /**
     * 채널별 알림 통계 조회 (활성 상태만)
     */
    @Query("SELECT a.channel, COUNT(a) as count FROM Alert a WHERE a.isDeleted = false GROUP BY a.channel")
    List<Object[]> getAlertStatisticsByChannel();
    
    /**
     * 일별 알림 통계 조회 (활성 상태만)
     */
    @Query("SELECT DATE(a.createdAt), COUNT(a) as count FROM Alert a WHERE a.isDeleted = false GROUP BY DATE(a.createdAt) ORDER BY DATE(a.createdAt)")
    List<Object[]> getAlertStatisticsByDate();
    
    // === BaseRepository 메서드 오버라이드 ===
    // Alert 엔티티는 branchId 필드가 없음 (userId만 있음)
    // findAllByTenantIdAndBranchId 메서드를 오버라이드하여 branchId를 무시하도록 함
    
    /**
     * 테넌트 ID로 활성 알림 조회
     * Alert 엔티티는 branchId 필드가 없으므로 branchId를 무시
     * 
     * @param tenantId 테넌트 UUID
     * @param branchId 지점 ID (무시됨, 쿼리에서 사용하지 않음)
     * @return 활성 알림 목록
     */
    @Query("SELECT a FROM Alert a WHERE a.tenantId = :tenantId AND a.isDeleted = false AND (:branchId IS NULL OR 1=1)")
    List<Alert> findAllByTenantIdAndBranchId(@Param("tenantId") String tenantId, @Param("branchId") Long branchId);
    
    /**
     * 테넌트 ID로 활성 알림 조회 (페이징)
     * Alert 엔티티는 branchId 필드가 없으므로 branchId를 무시
     * 
     * @param tenantId 테넌트 UUID
     * @param branchId 지점 ID (무시됨, 쿼리에서 사용하지 않음)
     * @param pageable 페이징 정보
     * @return 활성 알림 페이지
     */
    @Query("SELECT a FROM Alert a WHERE a.tenantId = :tenantId AND a.isDeleted = false AND (:branchId IS NULL OR 1=1)")
    Page<Alert> findAllByTenantIdAndBranchId(@Param("tenantId") String tenantId, @Param("branchId") Long branchId, Pageable pageable);

}
