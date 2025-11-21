package com.coresolution.consultation.repository;

import java.time.LocalDateTime;
import java.util.List;
import com.coresolution.consultation.entity.SystemNotification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

/**
 * 시스템 공지 리포지토리
 */
@Repository
public interface SystemNotificationRepository extends BaseRepository<SystemNotification, Long> {
    
    /**
     * 대상 유형별 유효한 공지 조회 (게시 기간 내, 삭제되지 않은 공지)
     */
    @Query("SELECT n FROM SystemNotification n WHERE n.targetType IN (:targetTypes) " +
           "AND n.status = 'PUBLISHED' " +
           "AND n.isDeleted = false " +
           "AND (n.publishedAt IS NULL OR n.publishedAt <= :now) " +
           "AND (n.expiresAt IS NULL OR n.expiresAt > :now) " +
           "ORDER BY n.isUrgent DESC, n.isImportant DESC, n.publishedAt DESC")
    Page<SystemNotification> findValidNotificationsByTargetTypes(
        @Param("targetTypes") List<String> targetTypes,
        @Param("now") LocalDateTime now,
        Pageable pageable);
    
    /**
     * 관리자용 전체 공지 조회
     */
    @Query("SELECT n FROM SystemNotification n WHERE n.isDeleted = false " +
           "AND (:targetType IS NULL OR n.targetType = :targetType) " +
           "AND (:status IS NULL OR n.status = :status) " +
           "ORDER BY n.createdAt DESC")
    Page<SystemNotification> findAllForAdmin(
        @Param("targetType") String targetType,
        @Param("status") String status,
        Pageable pageable);
    
    /**
     * 긴급 공지 조회
     */
    @Query("SELECT n FROM SystemNotification n WHERE n.targetType IN (:targetTypes) " +
           "AND n.status = 'PUBLISHED' " +
           "AND n.isUrgent = true " +
           "AND n.isDeleted = false " +
           "AND (n.publishedAt IS NULL OR n.publishedAt <= :now) " +
           "AND (n.expiresAt IS NULL OR n.expiresAt > :now) " +
           "ORDER BY n.publishedAt DESC")
    List<SystemNotification> findUrgentNotificationsByTargetTypes(
        @Param("targetTypes") List<String> targetTypes,
        @Param("now") LocalDateTime now);
    
    /**
     * 중요 공지 조회
     */
    @Query("SELECT n FROM SystemNotification n WHERE n.targetType IN (:targetTypes) " +
           "AND n.status = 'PUBLISHED' " +
           "AND n.isImportant = true " +
           "AND n.isDeleted = false " +
           "AND (n.publishedAt IS NULL OR n.publishedAt <= :now) " +
           "AND (n.expiresAt IS NULL OR n.expiresAt > :now) " +
           "ORDER BY n.publishedAt DESC")
    List<SystemNotification> findImportantNotificationsByTargetTypes(
        @Param("targetTypes") List<String> targetTypes,
        @Param("now") LocalDateTime now);
    
    /**
     * 조회수 증가 (버전 충돌 방지를 위해 직접 업데이트)
     */
    @Modifying
    @Transactional
    @Query("UPDATE SystemNotification n SET n.viewCount = n.viewCount + 1 WHERE n.id = :notificationId")
    int incrementViewCount(@Param("notificationId") Long notificationId);
}

