package com.mindgarden.consultation.service;

import java.util.List;
import com.mindgarden.consultation.entity.SystemNotification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * 시스템 공지 서비스 인터페이스
 */
public interface SystemNotificationService {
    
    /**
     * 사용자별 유효한 공지 조회
     */
    Page<SystemNotification> getNotificationsForUser(Long userId, String userRole, Pageable pageable);
    
    /**
     * 공지 상세 조회 및 조회수 증가
     */
    SystemNotification getNotificationDetail(Long notificationId, Long userId);
    
    /**
     * 공지 읽음 처리
     */
    void markAsRead(Long notificationId, Long userId);
    
    /**
     * 공지 읽음 여부 확인
     */
    boolean isNotificationRead(Long notificationId, Long userId);
    
    /**
     * 사용자의 읽지 않은 공지 수 조회
     */
    Long getUnreadCount(Long userId, String userRole);
    
    /**
     * 긴급 공지 조회
     */
    List<SystemNotification> getUrgentNotifications(Long userId, String userRole);
    
    /**
     * 중요 공지 조회
     */
    List<SystemNotification> getImportantNotifications(Long userId, String userRole);
    
    /**
     * 관리자용 공지 생성
     */
    SystemNotification createNotification(SystemNotification notification);
    
    /**
     * 관리자용 공지 수정
     */
    SystemNotification updateNotification(Long notificationId, SystemNotification notification);
    
    /**
     * 관리자용 공지 삭제
     */
    void deleteNotification(Long notificationId);
    
    /**
     * 관리자용 공지 게시
     */
    SystemNotification publishNotification(Long notificationId);
    
    /**
     * 관리자용 공지 보관
     */
    SystemNotification archiveNotification(Long notificationId);
    
    /**
     * 관리자용 전체 공지 조회
     */
    Page<SystemNotification> getAllNotificationsForAdmin(String targetType, String status, Pageable pageable);
}

