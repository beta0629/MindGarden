package com.coresolution.consultation.service;

import java.util.List;
import com.coresolution.consultation.entity.Alert;

/**
 * 알림 시스템 서비스 인터페이스 (간소화됨)
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public interface AlertService extends BaseService<Alert, Long> {
    
    // ==================== 핵심 조회 메서드 ====================
    
    /**
     * 사용자 ID로 알림 조회
     */
    List<Alert> findByUserId(Long userId);
    
    /**
     * 사용자 ID로 읽지 않은 알림 조회
     */
    List<Alert> findUnreadByUserId(Long userId);
    
    /**
     * 사용자 ID로 읽은 알림 조회
     */
    List<Alert> findReadByUserId(Long userId);
    
    /**
     * 알림 유형별 조회
     */
    List<Alert> findByType(String type);
    
    /**
     * 우선순위별 알림 조회
     */
    List<Alert> findByPriority(String priority);
    
    /**
     * 상태별 알림 조회
     */
    List<Alert> findByStatus(String status);
    
    // ==================== 핵심 비즈니스 메서드 ====================
    
    /**
     * 알림 읽음 처리
     */
    void markAsRead(Long alertId);
    
    /**
     * 사용자의 모든 알림 읽음 처리
     */
    void markAllAsRead(Long userId);
    
    /**
     * 알림 보관 처리
     */
    void archiveAlert(Long alertId);
    
    /**
     * 알림 닫기 처리
     */
    void dismissAlert(Long alertId);
    
    /**
     * 상단 고정 알림 설정
     */
    void setSticky(Long alertId);
    
    /**
     * 알림 우선순위 변경
     */
    void changePriority(Long alertId, String newPriority);
    
    /**
     * 알림 상태 변경
     */
    void changeStatus(Long alertId, String newStatus);
    
    /**
     * 알림 내용 업데이트
     */
    Alert updateAlertContent(Long alertId, String title, String content);
}
