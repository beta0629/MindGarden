package com.mindgarden.consultation.service;

import java.util.Map;

/**
 * 카카오 알림톡 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-17
 */
public interface KakaoAlimTalkService {
    
    /**
     * 알림톡 발송
     * 
     * @param phoneNumber 수신자 전화번호
     * @param templateCode 템플릿 코드
     * @param templateParams 템플릿 파라미터
     * @return 발송 성공 여부
     */
    boolean sendAlimTalk(String phoneNumber, String templateCode, Map<String, String> templateParams);
    
    /**
     * 상담 예약 확정 알림
     * 
     * @param phoneNumber 수신자 전화번호
     * @param consultantName 상담사명
     * @param consultationDate 상담 날짜
     * @param consultationTime 상담 시간
     * @return 발송 성공 여부
     */
    boolean sendConsultationConfirmed(String phoneNumber, String consultantName, String consultationDate, String consultationTime);
    
    /**
     * 상담 1시간 전 리마인더
     * 
     * @param phoneNumber 수신자 전화번호
     * @param consultantName 상담사명
     * @param consultationTime 상담 시간
     * @return 발송 성공 여부
     */
    boolean sendConsultationReminder(String phoneNumber, String consultantName, String consultationTime);
    
    /**
     * 환불 완료 알림
     * 
     * @param phoneNumber 수신자 전화번호
     * @param refundSessions 환불 회기
     * @param refundAmount 환불 금액
     * @return 발송 성공 여부
     */
    boolean sendRefundCompleted(String phoneNumber, int refundSessions, long refundAmount);
    
    /**
     * 상담 일정 변경 알림
     * 
     * @param phoneNumber 수신자 전화번호
     * @param consultantName 상담사명
     * @param oldDateTime 기존 일정
     * @param newDateTime 변경된 일정
     * @return 발송 성공 여부
     */
    boolean sendScheduleChanged(String phoneNumber, String consultantName, String oldDateTime, String newDateTime);
    
    /**
     * 알림톡 서비스 상태 확인
     * 
     * @return 서비스 사용 가능 여부
     */
    boolean isServiceAvailable();
}
