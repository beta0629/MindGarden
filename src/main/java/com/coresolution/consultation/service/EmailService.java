package com.coresolution.consultation.service;

import java.util.List;
import java.util.Map;
import com.coresolution.consultation.dto.EmailRequest;
import com.coresolution.consultation.dto.EmailResponse;

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
     * 급여 계산서 이메일 발송(바이트 첨부). {@code attachment}가 null 또는 빈 배열이면 본문만 발송.
     */
    boolean sendSalaryCalculationEmail(String toEmail, String consultantName,
            String period, Map<String, Object> salaryData,
            byte[] attachment, String attachmentFilename);

    /**
     * 급여 계산서 이메일 발송 상세 응답(export 등에서 메시지 반영용).
     */
    EmailResponse sendSalaryCalculationEmailWithResponse(String toEmail, String consultantName,
            String period, Map<String, Object> salaryData,
            byte[] attachment, String attachmentFilename);
    
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

    /**
     * 부분 환불 / 강제 종료로 회기 소진(remaining&lt;=0) 시 자동 일괄 취소된 미래 예약 안내 메일
     * (2026-05-26 Phase 0, Q3=3A·보조=C).
     *
     * <p>회기관리 운영 정책 합의서 v2 결정에 따라 인앱·이메일·푸시·알림톡 4채널 의무 통지의
     * 이메일 채널을 담당한다. 약관·전자상거래법상 의무 통지에 해당하여 사용자 채널 선호도와
     * 무관하게 발송한다.</p>
     *
     * @param toEmail 수신 이메일
     * @param cancelCount 자동 취소된 일정 수
     * @param mypageUrl 마이페이지 URL (본문에 안내, 빈 값/null이면 안내 라인 생략)
     * @return 발송 성공 여부 (블록·실패·예외는 모두 false)
     */
    boolean sendAutoCancelNotification(String toEmail, int cancelCount, String mypageUrl);
}