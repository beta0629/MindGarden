package com.mindgarden.consultation.service;

import com.mindgarden.consultation.entity.User;

/**
 * 통합 알림 서비스 인터페이스
 * - 카카오 알림톡, SMS, 이메일을 통합 관리
 * - 사용자 설정에 따른 알림 방식 자동 선택
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-17
 */
public interface NotificationService {
    
    /**
     * 알림 우선순위
     */
    enum NotificationPriority {
        HIGH,    // 카카오 알림톡 우선
        MEDIUM,  // SMS 우선
        LOW      // 이메일 우선
    }
    
    /**
     * 알림 타입
     */
    enum NotificationType {
        CONSULTATION_CONFIRMED,  // 상담 확정
        CONSULTATION_REMINDER,   // 상담 리마인더
        REFUND_COMPLETED,       // 환불 완료
        SCHEDULE_CHANGED,       // 일정 변경
        PAYMENT_COMPLETED,      // 결제 완료
        DEPOSIT_PENDING_REMINDER // 입금 확인 대기 리마인더
    }
    
    /**
     * 통합 알림 발송
     * 
     * @param user 수신자
     * @param notificationType 알림 타입
     * @param priority 우선순위
     * @param params 알림 파라미터
     * @return 발송 성공 여부
     */
    boolean sendNotification(User user, NotificationType notificationType, NotificationPriority priority, 
                           String... params);
    
    /**
     * 상담 확정 알림
     * 
     * @param user 내담자
     * @param consultantName 상담사명
     * @param consultationDate 상담 날짜
     * @param consultationTime 상담 시간
     * @return 발송 성공 여부
     */
    boolean sendConsultationConfirmed(User user, String consultantName, String consultationDate, String consultationTime);
    
    /**
     * 상담 리마인더 알림 (1시간 전)
     * 
     * @param user 내담자
     * @param consultantName 상담사명
     * @param consultationTime 상담 시간
     * @return 발송 성공 여부
     */
    boolean sendConsultationReminder(User user, String consultantName, String consultationTime);
    
    /**
     * 환불 완료 알림
     * 
     * @param user 내담자
     * @param refundSessions 환불 회기
     * @param refundAmount 환불 금액
     * @return 발송 성공 여부
     */
    boolean sendRefundCompleted(User user, int refundSessions, long refundAmount);
    
    /**
     * 일정 변경 알림
     * 
     * @param user 내담자
     * @param consultantName 상담사명
     * @param oldDateTime 기존 일정
     * @param newDateTime 변경된 일정
     * @return 발송 성공 여부
     */
    boolean sendScheduleChanged(User user, String consultantName, String oldDateTime, String newDateTime);
    
    /**
     * 결제 완료 알림
     * 
     * @param user 내담자
     * @param paymentAmount 결제 금액
     * @param packageName 패키지명
     * @param consultantName 상담사명
     * @return 발송 성공 여부
     */
    boolean sendPaymentCompleted(User user, long paymentAmount, String packageName, String consultantName);
    
    /**
     * 입금 확인 대기 리마인더 알림
     * 
     * @param user 관리자
     * @param mappingId 매핑 ID
     * @param clientName 내담자명
     * @param consultantName 상담사명
     * @param packagePrice 패키지 가격
     * @param hoursElapsed 대기 시간 (시간)
     * @return 발송 성공 여부
     */
    boolean sendDepositPendingReminder(User user, Long mappingId, String clientName, String consultantName, 
                                     Long packagePrice, long hoursElapsed);
    
    /**
     * 이메일 알림 발송 (일반 목적)
     * 
     * @param userId 사용자 ID
     * @param subject 제목
     * @param content 내용
     * @param type 알림 타입
     * @return 발송 성공 여부
     */
    boolean sendEmailNotification(Long userId, String subject, String content, String type);
}
