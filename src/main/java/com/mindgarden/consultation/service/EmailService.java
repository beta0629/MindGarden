package com.mindgarden.consultation.service;

import java.util.Map;
import com.mindgarden.consultation.dto.EmailRequest;
import com.mindgarden.consultation.dto.EmailResponse;

/**
 * 이메일 전송 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-05
 */
public interface EmailService {
    
    /**
     * 이메일 발송
     * 
     * @param request 이메일 발송 요청
     * @return 이메일 발송 응답
     */
    EmailResponse sendEmail(EmailRequest request);
    
    /**
     * 이메일 발송 상태 조회
     * 
     * @param emailId 이메일 ID
     * @return 이메일 발송 응답
     */
    EmailResponse getEmailStatus(String emailId);
    
    /**
     * 이메일 발송 이력 조회
     * 
     * @param toEmail 수신자 이메일
     * @param limit 조회 제한
     * @return 이메일 발송 이력
     */
    java.util.List<EmailResponse> getEmailHistory(String toEmail, int limit);
    
    /**
     * 이메일 재발송
     * 
     * @param emailId 이메일 ID
     * @return 이메일 발송 응답
     */
    EmailResponse resendEmail(String emailId);
    
    /**
     * 급여 계산서 이메일 전송
     * 
     * @param toEmail 수신자 이메일
     * @param consultantName 상담사 이름
     * @param period 계산 기간
     * @param salaryData 급여 데이터
     * @param attachmentPath 첨부파일 경로 (선택사항)
     * @return 전송 성공 여부
     */
    boolean sendSalaryCalculationEmail(String toEmail, String consultantName, 
                                     String period, Map<String, Object> salaryData, 
                                     String attachmentPath);
    
    /**
     * 급여 승인 알림 이메일 전송
     * 
     * @param toEmail 수신자 이메일
     * @param consultantName 상담사 이름
     * @param period 계산 기간
     * @param approvedAmount 승인된 금액
     * @return 전송 성공 여부
     */
    boolean sendSalaryApprovalEmail(String toEmail, String consultantName, 
                                   String period, String approvedAmount);
    
    /**
     * 급여 지급 완료 이메일 전송
     * 
     * @param toEmail 수신자 이메일
     * @param consultantName 상담사 이름
     * @param period 계산 기간
     * @param paidAmount 지급된 금액
     * @param payDate 지급일
     * @return 전송 성공 여부
     */
    boolean sendSalaryPaymentEmail(String toEmail, String consultantName, 
                                 String period, String paidAmount, String payDate);
    
    /**
     * 세금 내역서 이메일 전송
     * 
     * @param toEmail 수신자 이메일
     * @param consultantName 상담사 이름
     * @param period 계산 기간
     * @param taxData 세금 데이터
     * @param attachmentPath 첨부파일 경로 (선택사항)
     * @return 전송 성공 여부
     */
    boolean sendTaxReportEmail(String toEmail, String consultantName, 
                             String period, Map<String, Object> taxData, 
                             String attachmentPath);
    
    /**
     * 이메일 템플릿 조회
     * 
     * @param templateType 템플릿 유형
     * @return 템플릿 내용
     */
    String getEmailTemplate(String templateType);
    
    /**
     * 다중 이메일 발송
     * 
     * @param requests 이메일 발송 요청 목록
     * @return 이메일 발송 응답 목록
     */
    java.util.List<EmailResponse> sendBulkEmails(java.util.List<EmailRequest> requests);
    
    /**
     * 템플릿 이메일 발송
     * 
     * @param templateType 템플릿 유형
     * @param toEmail 수신자 이메일
     * @param toName 수신자 이름
     * @param variables 템플릿 변수
     * @return 이메일 발송 응답
     */
    EmailResponse sendTemplateEmail(String templateType, String toEmail, String toName, java.util.Map<String, Object> variables);
    
    /**
     * 예약 이메일 발송
     * 
     * @param request 이메일 발송 요청
     * @param delayMillis 지연 시간 (밀리초)
     * @return 이메일 발송 응답
     */
    EmailResponse scheduleEmail(EmailRequest request, long delayMillis);
    
    /**
     * 이메일 발송 취소
     * 
     * @param emailId 이메일 ID
     * @return 취소 성공 여부
     */
    boolean cancelEmail(String emailId);
    
    /**
     * 이메일 발송 재시도
     * 
     * @param emailId 이메일 ID
     * @return 이메일 발송 응답
     */
    EmailResponse retryEmail(String emailId);
    
    /**
     * 이메일 템플릿 미리보기
     * 
     * @param templateType 템플릿 유형
     * @param variables 템플릿 변수
     * @return 미리보기 내용
     */
    String previewTemplate(String templateType, java.util.Map<String, Object> variables);
    
    /**
     * 이메일 발송 통계 조회
     * 
     * @return 이메일 발송 통계
     */
    java.util.Map<String, Object> getEmailStatistics();
    
    /**
     * 이메일 발송 제한 확인
     * 
     * @param email 이메일 주소
     * @return 발송 가능 여부
     */
    boolean checkEmailLimit(String email);
    
    /**
     * 대기 중인 이메일 목록 조회
     * 
     * @return 대기 중인 이메일 목록
     */
    java.util.List<EmailResponse> getPendingEmails();
}