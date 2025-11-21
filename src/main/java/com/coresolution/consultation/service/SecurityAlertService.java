package com.coresolution.consultation.service;

import java.util.Map;

/**
 * 보안 이벤트 알림 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
public interface SecurityAlertService {
    
    /**
     * 보안 이벤트 알림 발송
     * 
     * @param eventType 이벤트 유형 (LOGIN_FAILURE, UNAUTHORIZED_ACCESS, SUSPICIOUS_ACTIVITY 등)
     * @param severity 심각도 (CRITICAL, HIGH, MEDIUM, LOW)
     * @param details 이벤트 상세 정보
     */
    void sendSecurityAlert(String eventType, String severity, Map<String, Object> details);
    
    /**
     * 로그인 실패 알림
     * 
     * @param email 이메일
     * @param ipAddress IP 주소
     * @param failureCount 실패 횟수
     */
    void sendLoginFailureAlert(String email, String ipAddress, int failureCount);
    
    /**
     * 무단 접근 시도 알림
     * 
     * @param userId 사용자 ID
     * @param resource 접근 시도한 리소스
     * @param ipAddress IP 주소
     */
    void sendUnauthorizedAccessAlert(Long userId, String resource, String ipAddress);
    
    /**
     * 의심스러운 활동 알림
     * 
     * @param userId 사용자 ID
     * @param activity 활동 내용
     * @param details 상세 정보
     */
    void sendSuspiciousActivityAlert(Long userId, String activity, Map<String, Object> details);
}

