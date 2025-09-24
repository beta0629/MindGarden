package com.mindgarden.consultation.service;

import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.dto.EmailRequest;
import com.mindgarden.consultation.dto.EmailResponse;

/**
 * 이메일 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
public interface EmailService {
    
    /**
     * 이메일 발송
     */
    EmailResponse sendEmail(EmailRequest request);
    
    /**
     * 다중 이메일 발송
     */
    List<EmailResponse> sendBulkEmails(List<EmailRequest> requests);
    
    /**
     * 템플릿 이메일 발송
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
     * 이메일 발송 이력 조회
     */
    List<EmailResponse> getEmailHistory(String toEmail, int limit);
    
    /**
     * 이메일 재발송
     */
    EmailResponse resendEmail(String emailId);
    
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
     * 대기 중인 이메일 목록 조회
     */
    List<EmailResponse> getPendingEmails();
    
    /**
     * 급여 계산서 이메일 발송
     */
    boolean sendSalaryCalculationEmail(String toEmail, String consultantName, 
                                     String period, Map<String, Object> salaryData, 
                                     String attachmentPath);
    
    /**
     * 급여 승인 이메일 발송
     */
    boolean sendSalaryApprovalEmail(String toEmail, String consultantName, 
                                  String period, String approvedAmount);
    
    /**
     * 급여 지급 완료 이메일 발송
     */
    boolean sendSalaryPaymentEmail(String toEmail, String consultantName, 
                                 String period, String paidAmount, String payDate);
    
    /**
     * 세금 내역서 이메일 발송
     */
    boolean sendTaxReportEmail(String toEmail, String consultantName, 
                             String period, Map<String, Object> taxData, 
                             String attachmentPath);
    
    /**
     * 이메일 템플릿 조회
     */
    String getEmailTemplate(String templateType);
}