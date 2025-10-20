package com.mindgarden.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.mindgarden.consultation.entity.SystemNotificationRead;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 시스템 공지 읽음 상태 리포지토리
 */
@Repository
public interface SystemNotificationReadRepository extends BaseRepository<SystemNotificationRead, Long> {
    
    /**
     * 특정 공지의 특정 사용자 읽음 상태 조회
     */
    Optional<SystemNotificationRead> findByNotificationIdAndUserId(Long notificationId, Long userId);
    
    /**
     * 사용자가 읽은 공지 ID 목록 조회
     */
    @Query("SELECT r.notificationId FROM SystemNotificationRead r WHERE r.userId = :userId AND r.isRead = true")
    List<Long> findReadNotificationIdsByUserId(@Param("userId") Long userId);
    
    /**
     * 특정 공지의 읽음 수 조회
     */
    @Query("SELECT COUNT(r) FROM SystemNotificationRead r WHERE r.notificationId = :notificationId AND r.isRead = true")
    Long countReadByNotificationId(@Param("notificationId") Long notificationId);
    
    /**
     * 사용자의 읽지 않은 공지 수 조회
     */
    @Query("SELECT COUNT(n) FROM SystemNotification n " +
           "WHERE n.targetType IN (:targetTypes) " +
           "AND n.status = 'PUBLISHED' " +
           "AND n.isDeleted = false " +
           "AND (n.publishedAt IS NULL OR n.publishedAt <= CURRENT_TIMESTAMP) " +
           "AND (n.expiresAt IS NULL OR n.expiresAt > CURRENT_TIMESTAMP) " +
           "AND n.id NOT IN (SELECT r.notificationId FROM SystemNotificationRead r WHERE r.userId = :userId AND r.isRead = true)")
    Long countUnreadNotificationsByUser(
        @Param("userId") Long userId,
        @Param("targetTypes") List<String> targetTypes);
}

