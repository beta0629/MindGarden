package com.coresolution.consultation.service;

import java.util.List;
import java.util.Set;
import com.coresolution.consultation.entity.SystemNotification;
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
     * 공지 상세 조회 및 조회수 증가.
     * 목록과 동일한 수신 대상({@code ALL} + 역할별)이 아니면 존재하지 않는 것으로 처리한다.
     *
     * @param notificationId 공지 ID
     * @param userId 조회 사용자 ID
     * @param userRole 조회 사용자 역할
     * @return 수신 대상인 공지
     */
    SystemNotification getNotificationDetail(Long notificationId, Long userId, String userRole);

    /**
     * 공지 읽음 처리.
     * 수신 대상이 아니면 읽음 기록을 남기지 않고 존재하지 않는 것으로 처리한다.
     *
     * @param notificationId 공지 ID
     * @param userId 사용자 ID
     * @param userRole 사용자 역할
     */
    void markAsRead(Long notificationId, Long userId, String userRole);

    /**
     * 현재 사용자 기준 읽지 않은 모든 공지 일괄 읽음 처리
     */
    void markAllAsRead(Long userId, String userRole);
    
    /**
     * 공지 읽음 여부 확인
     */
    boolean isNotificationRead(Long notificationId, Long userId);

    /**
     * 현재 테넌트에서 사용자가 읽은 공지 ID. 목록 isRead 는 이 한 번 조회로 채운다.
     */
    Set<Long> findReadNotificationIds(Long userId);
    
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

