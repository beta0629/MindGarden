package com.mindgarden.consultation.service;

import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.dto.EmailRequest;
import com.mindgarden.consultation.dto.EmailResponse;

/**
 * 이메일 발송 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-05
 */
public interface EmailService {
    
    /**
     * 단일 이메일 발송
     */
    EmailResponse sendEmail(EmailRequest request);
    
    /**
     * 다중 이메일 발송
     */
    List<EmailResponse> sendBulkEmails(List<EmailRequest> requests);
    
    /**
     * 템플릿 기반 이메일 발송
     */
    EmailResponse sendTemplateEmail(String templateType, String toEmail, String toName, Map<String, Object> variables);
    
    /**
     * 예약 이메일 발송
     */
    EmailResponse scheduleEmail(EmailRequest request, long delayMillis);
    
    /**
     * 이메일 발송 상태 조회
     */
    EmailResponse getEmailStatus(String emailId);
    
    /**
     * 이메일 발송 취소
     */
    boolean cancelEmail(String emailId);
    
    /**
     * 이메일 발송 재시도
     */
    EmailResponse retryEmail(String emailId);
    
    /**
     * 템플릿 미리보기
     */
    String previewTemplate(String templateType, Map<String, Object> variables);
    
    /**
     * 이메일 발송 통계 조회
     */
    Map<String, Object> getEmailStatistics();
    
    /**
     * 이메일 발송 제한 확인
     */
    boolean checkEmailLimit(String email);
    
    /**
     * 이메일 발송 대기열 조회
     */
    List<EmailResponse> getPendingEmails();
}
