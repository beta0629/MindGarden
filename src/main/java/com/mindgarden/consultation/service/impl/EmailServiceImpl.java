package com.mindgarden.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import com.mindgarden.consultation.constant.EmailConstants;
import com.mindgarden.consultation.dto.EmailRequest;
import com.mindgarden.consultation.dto.EmailResponse;
import com.mindgarden.consultation.service.EmailService;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import lombok.extern.slf4j.Slf4j;

/**
 * 이메일 발송 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-05
 */
@Slf4j
@Service
public class EmailServiceImpl implements EmailService {
    
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(5);
    private final Map<String, EmailResponse> emailStatusMap = new ConcurrentHashMap<>();
    private final Map<String, Integer> emailCountMap = new ConcurrentHashMap<>();
    
    @Override
    public EmailResponse sendEmail(EmailRequest request) {
        log.info("이메일 발송 요청: to={}, subject={}", request.getToEmail(), request.getSubject());
        
        try {
            // 이메일 유효성 검사
            validateEmailRequest(request);
            
            // 이메일 발송 제한 확인
            if (!checkEmailLimit(request.getToEmail())) {
                log.warn("이메일 발송 제한 초과: {}", request.getToEmail());
                return createErrorResponse(request, EmailConstants.ERROR_EMAIL_RATE_LIMIT_EXCEEDED);
            }
            
            // 이메일 ID 생성
            String emailId = generateEmailId();
            
            // 이메일 발송 (실제 구현에서는 외부 이메일 서비스 연동)
            EmailResponse response = sendEmailInternal(request, emailId);
            
            // 발송 상태 저장
            emailStatusMap.put(emailId, response);
            
            // 발송 카운트 증가
            incrementEmailCount(request.getToEmail());
            
            log.info("이메일 발송 완료: emailId={}, status={}", emailId, response.getStatus());
            return response;
            
        } catch (Exception e) {
            log.error("이메일 발송 실패: to={}, error={}", request.getToEmail(), e.getMessage(), e);
            return createErrorResponse(request, EmailConstants.ERROR_EMAIL_SEND_FAILED);
        }
    }
    
    @Override
    public List<EmailResponse> sendBulkEmails(List<EmailRequest> requests) {
        log.info("다중 이메일 발송 요청: {}건", requests.size());
        
        List<EmailResponse> responses = new ArrayList<>();
        
        for (EmailRequest request : requests) {
            try {
                EmailResponse response = sendEmail(request);
                responses.add(response);
            } catch (Exception e) {
                log.error("다중 이메일 발송 중 오류: to={}, error={}", request.getToEmail(), e.getMessage(), e);
                responses.add(createErrorResponse(request, EmailConstants.ERROR_EMAIL_SEND_FAILED));
            }
        }
        
        log.info("다중 이메일 발송 완료: {}건 중 {}건 성공", requests.size(), 
                responses.stream().mapToInt(r -> r.isSuccess() ? 1 : 0).sum());
        
        return responses;
    }
    
    @Override
    public EmailResponse sendTemplateEmail(String templateType, String toEmail, String toName, Map<String, Object> variables) {
        log.info("템플릿 이메일 발송 요청: templateType={}, to={}", templateType, toEmail);
        
        try {
            // 템플릿 로드
            String template = loadEmailTemplate(templateType);
            if (template == null) {
                log.error("이메일 템플릿을 찾을 수 없습니다: {}", templateType);
                return createErrorResponse(null, EmailConstants.ERROR_EMAIL_TEMPLATE_NOT_FOUND);
            }
            
            // 템플릿 변수 적용
            String content = applyTemplateVariables(template, variables);
            
            // 이메일 제목 생성
            String subject = getEmailSubject(templateType);
            
            // 이메일 요청 생성
            EmailRequest request = EmailRequest.builder()
                    .toEmail(toEmail)
                    .toName(toName)
                    .subject(subject)
                    .content(content)
                    .templateType(templateType)
                    .templateVariables(variables)
                    .type(EmailConstants.TYPE_HTML)
                    .build();
            
            return sendEmail(request);
            
        } catch (Exception e) {
            log.error("템플릿 이메일 발송 실패: templateType={}, to={}, error={}", 
                    templateType, toEmail, e.getMessage(), e);
            return createErrorResponse(null, EmailConstants.ERROR_EMAIL_SEND_FAILED);
        }
    }
    
    @Override
    public EmailResponse scheduleEmail(EmailRequest request, long delayMillis) {
        log.info("예약 이메일 발송 요청: to={}, delay={}ms", request.getToEmail(), delayMillis);
        
        try {
            // 이메일 ID 생성
            String emailId = generateEmailId();
            
            // 예약 발송 설정
            request.setSendImmediately(false);
            request.setScheduledTime(System.currentTimeMillis() + delayMillis);
            
            // 예약 발송 스케줄링
            scheduler.schedule(() -> {
                try {
                    sendEmailInternal(request, emailId);
                } catch (Exception e) {
                    log.error("예약 이메일 발송 실패: emailId={}, error={}", emailId, e.getMessage(), e);
                }
            }, delayMillis, TimeUnit.MILLISECONDS);
            
            EmailResponse response = EmailResponse.builder()
                    .emailId(emailId)
                    .status(EmailConstants.STATUS_PENDING)
                    .success(true)
                    .message(EmailConstants.SUCCESS_EMAIL_QUEUED)
                    .toEmail(request.getToEmail())
                    .subject(request.getSubject())
                    .scheduledAt(LocalDateTime.now().plusSeconds(delayMillis / 1000))
                    .build();
            
            emailStatusMap.put(emailId, response);
            
            log.info("예약 이메일 등록 완료: emailId={}, scheduledAt={}", emailId, response.getScheduledAt());
            return response;
            
        } catch (Exception e) {
            log.error("예약 이메일 등록 실패: to={}, error={}", request.getToEmail(), e.getMessage(), e);
            return createErrorResponse(request, EmailConstants.ERROR_EMAIL_SEND_FAILED);
        }
    }
    
    @Override
    public EmailResponse getEmailStatus(String emailId) {
        log.debug("이메일 발송 상태 조회: emailId={}", emailId);
        
        EmailResponse response = emailStatusMap.get(emailId);
        if (response == null) {
            log.warn("이메일 발송 상태를 찾을 수 없습니다: emailId={}", emailId);
            return EmailResponse.builder()
                    .emailId(emailId)
                    .status(EmailConstants.STATUS_FAILED)
                    .success(false)
                    .message("이메일 발송 상태를 찾을 수 없습니다.")
                    .build();
        }
        
        return response;
    }
    
    @Override
    public boolean cancelEmail(String emailId) {
        log.info("이메일 발송 취소 요청: emailId={}", emailId);
        
        EmailResponse response = emailStatusMap.get(emailId);
        if (response == null) {
            log.warn("취소할 이메일을 찾을 수 없습니다: emailId={}", emailId);
            return false;
        }
        
        if (EmailConstants.STATUS_PENDING.equals(response.getStatus())) {
            response.setStatus(EmailConstants.STATUS_FAILED);
            response.setSuccess(false);
            response.setMessage("이메일 발송이 취소되었습니다.");
            emailStatusMap.put(emailId, response);
            
            log.info("이메일 발송 취소 완료: emailId={}", emailId);
            return true;
        }
        
        log.warn("취소할 수 없는 이메일 상태입니다: emailId={}, status={}", emailId, response.getStatus());
        return false;
    }
    
    @Override
    public EmailResponse retryEmail(String emailId) {
        log.info("이메일 발송 재시도 요청: emailId={}", emailId);
        
        EmailResponse response = emailStatusMap.get(emailId);
        if (response == null) {
            log.warn("재시도할 이메일을 찾을 수 없습니다: emailId={}", emailId);
            return createErrorResponse(null, "이메일을 찾을 수 없습니다.");
        }
        
        if (response.getRetryCount() >= EmailConstants.MAX_RETRY_ATTEMPTS) {
            log.warn("최대 재시도 횟수 초과: emailId={}, retryCount={}", emailId, response.getRetryCount());
            return createErrorResponse(null, "최대 재시도 횟수를 초과했습니다.");
        }
        
        // 재시도 로직 (실제 구현에서는 원본 요청 정보를 저장해두고 재사용)
        response.setRetryCount(response.getRetryCount() + 1);
        response.setStatus(EmailConstants.STATUS_PENDING);
        response.setSuccess(false);
        response.setMessage("이메일 발송 재시도 중...");
        
        emailStatusMap.put(emailId, response);
        
        log.info("이메일 발송 재시도 완료: emailId={}, retryCount={}", emailId, response.getRetryCount());
        return response;
    }
    
    @Override
    public String previewTemplate(String templateType, Map<String, Object> variables) {
        log.debug("이메일 템플릿 미리보기: templateType={}", templateType);
        
        try {
            String template = loadEmailTemplate(templateType);
            if (template == null) {
                log.error("이메일 템플릿을 찾을 수 없습니다: {}", templateType);
                return null;
            }
            
            return applyTemplateVariables(template, variables);
            
        } catch (Exception e) {
            log.error("이메일 템플릿 미리보기 실패: templateType={}, error={}", templateType, e.getMessage(), e);
            return null;
        }
    }
    
    @Override
    public Map<String, Object> getEmailStatistics() {
        log.debug("이메일 발송 통계 조회");
        
        Map<String, Object> statistics = new HashMap<>();
        
        // 전체 발송 통계
        int totalSent = emailStatusMap.size();
        int successCount = (int) emailStatusMap.values().stream().mapToInt(r -> r.isSuccess() ? 1 : 0).sum();
        int failedCount = totalSent - successCount;
        
        statistics.put("totalSent", totalSent);
        statistics.put("successCount", successCount);
        statistics.put("failedCount", failedCount);
        statistics.put("successRate", totalSent > 0 ? (double) successCount / totalSent * 100 : 0);
        
        // 상태별 통계
        Map<String, Long> statusCounts = new HashMap<>();
        emailStatusMap.values().forEach(response -> {
            String status = response.getStatus();
            statusCounts.put(status, statusCounts.getOrDefault(status, 0L) + 1);
        });
        statistics.put("statusCounts", statusCounts);
        
        // 시간별 통계 (최근 24시간)
        LocalDateTime now = LocalDateTime.now();
        long recentCount = emailStatusMap.values().stream()
                .filter(r -> r.getSentAt() != null && r.getSentAt().isAfter(now.minusHours(24)))
                .count();
        statistics.put("recent24hCount", recentCount);
        
        log.debug("이메일 발송 통계 조회 완료: totalSent={}, successCount={}, failedCount={}", 
                totalSent, successCount, failedCount);
        
        return statistics;
    }
    
    @Override
    public boolean checkEmailLimit(String email) {
        if (!StringUtils.hasText(email)) {
            return false;
        }
        
        int count = emailCountMap.getOrDefault(email, 0);
        return count < EmailConstants.HOURLY_EMAIL_LIMIT;
    }
    
    @Override
    public List<EmailResponse> getPendingEmails() {
        log.debug("대기 중인 이메일 목록 조회");
        
        return emailStatusMap.values().stream()
                .filter(response -> EmailConstants.STATUS_PENDING.equals(response.getStatus()))
                .toList();
    }
    
    // ==================== Private Methods ====================
    
    private void validateEmailRequest(EmailRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("이메일 요청이 null입니다.");
        }
        
        if (!StringUtils.hasText(request.getToEmail())) {
            throw new IllegalArgumentException(EmailConstants.ERROR_EMAIL_INVALID_RECIPIENT);
        }
        
        if (!StringUtils.hasText(request.getSubject())) {
            throw new IllegalArgumentException("이메일 제목은 필수입니다.");
        }
        
        if (!StringUtils.hasText(request.getContent())) {
            throw new IllegalArgumentException("이메일 내용은 필수입니다.");
        }
    }
    
    private EmailResponse sendEmailInternal(EmailRequest request, String emailId) {
        // 실제 구현에서는 외부 이메일 서비스 (SendGrid, AWS SES, SMTP 등) 연동
        // 현재는 시뮬레이션
        
        try {
            // 이메일 발송 시뮬레이션 (90% 성공률)
            boolean success = Math.random() > 0.1;
            
            EmailResponse response = EmailResponse.builder()
                    .emailId(emailId)
                    .status(success ? EmailConstants.STATUS_SENT : EmailConstants.STATUS_FAILED)
                    .success(success)
                    .message(success ? EmailConstants.SUCCESS_EMAIL_SENT : EmailConstants.ERROR_EMAIL_SEND_FAILED)
                    .toEmail(request.getToEmail())
                    .subject(request.getSubject())
                    .sentAt(LocalDateTime.now())
                    .retryCount(0)
                    .externalId("ext_" + emailId)
                    .build();
            
            if (!success) {
                response.setErrorCode("SEND_FAILED");
                response.setErrorMessage("이메일 발송 중 오류가 발생했습니다.");
            }
            
            return response;
            
        } catch (Exception e) {
            log.error("이메일 발송 내부 오류: emailId={}, error={}", emailId, e.getMessage(), e);
            
            return EmailResponse.builder()
                    .emailId(emailId)
                    .status(EmailConstants.STATUS_FAILED)
                    .success(false)
                    .message(EmailConstants.ERROR_EMAIL_SEND_FAILED)
                    .toEmail(request.getToEmail())
                    .subject(request.getSubject())
                    .errorCode("INTERNAL_ERROR")
                    .errorMessage(e.getMessage())
                    .build();
        }
    }
    
    private String generateEmailId() {
        return "email_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8);
    }
    
    private String loadEmailTemplate(String templateType) {
        // 실제 구현에서는 파일 시스템이나 데이터베이스에서 템플릿 로드
        // 현재는 기본 템플릿 반환
        
        Map<String, String> templates = new HashMap<>();
        templates.put(EmailConstants.TEMPLATE_WELCOME, getWelcomeTemplate());
        templates.put(EmailConstants.TEMPLATE_CONSULTANT_APPROVAL, getConsultantApprovalTemplate());
        templates.put(EmailConstants.TEMPLATE_CONSULTANT_REJECTION, getConsultantRejectionTemplate());
        templates.put(EmailConstants.TEMPLATE_ADMIN_APPROVAL, getAdminApprovalTemplate());
        templates.put(EmailConstants.TEMPLATE_PASSWORD_RESET, getPasswordResetTemplate());
        templates.put(EmailConstants.TEMPLATE_ACCOUNT_ACTIVATION, getAccountActivationTemplate());
        templates.put(EmailConstants.TEMPLATE_APPOINTMENT_CONFIRMATION, getAppointmentConfirmationTemplate());
        templates.put(EmailConstants.TEMPLATE_APPOINTMENT_REMINDER, getAppointmentReminderTemplate());
        templates.put(EmailConstants.TEMPLATE_PAYMENT_CONFIRMATION, getPaymentConfirmationTemplate());
        templates.put(EmailConstants.TEMPLATE_PAYMENT_FAILED, getPaymentFailedTemplate());
        templates.put(EmailConstants.TEMPLATE_SYSTEM_NOTIFICATION, getSystemNotificationTemplate());
        
        return templates.get(templateType);
    }
    
    private String applyTemplateVariables(String template, Map<String, Object> variables) {
        if (template == null || variables == null) {
            return template;
        }
        
        String result = template;
        for (Map.Entry<String, Object> entry : variables.entrySet()) {
            String placeholder = "{{" + entry.getKey() + "}}";
            String value = entry.getValue() != null ? entry.getValue().toString() : "";
            result = result.replace(placeholder, value);
        }
        
        return result;
    }
    
    private String getEmailSubject(String templateType) {
        Map<String, String> subjects = new HashMap<>();
        subjects.put(EmailConstants.TEMPLATE_WELCOME, EmailConstants.SUBJECT_WELCOME);
        subjects.put(EmailConstants.TEMPLATE_CONSULTANT_APPROVAL, EmailConstants.SUBJECT_CONSULTANT_APPROVAL);
        subjects.put(EmailConstants.TEMPLATE_CONSULTANT_REJECTION, EmailConstants.SUBJECT_CONSULTANT_REJECTION);
        subjects.put(EmailConstants.TEMPLATE_ADMIN_APPROVAL, EmailConstants.SUBJECT_ADMIN_APPROVAL);
        subjects.put(EmailConstants.TEMPLATE_PASSWORD_RESET, EmailConstants.SUBJECT_PASSWORD_RESET);
        subjects.put(EmailConstants.TEMPLATE_ACCOUNT_ACTIVATION, EmailConstants.SUBJECT_ACCOUNT_ACTIVATION);
        subjects.put(EmailConstants.TEMPLATE_APPOINTMENT_CONFIRMATION, EmailConstants.SUBJECT_APPOINTMENT_CONFIRMATION);
        subjects.put(EmailConstants.TEMPLATE_APPOINTMENT_REMINDER, EmailConstants.SUBJECT_APPOINTMENT_REMINDER);
        subjects.put(EmailConstants.TEMPLATE_PAYMENT_CONFIRMATION, EmailConstants.SUBJECT_PAYMENT_CONFIRMATION);
        subjects.put(EmailConstants.TEMPLATE_PAYMENT_FAILED, EmailConstants.SUBJECT_PAYMENT_FAILED);
        subjects.put(EmailConstants.TEMPLATE_SYSTEM_NOTIFICATION, EmailConstants.SUBJECT_SYSTEM_NOTIFICATION);
        
        return subjects.getOrDefault(templateType, "마음정원 알림");
    }
    
    private void incrementEmailCount(String email) {
        emailCountMap.put(email, emailCountMap.getOrDefault(email, 0) + 1);
    }
    
    private EmailResponse createErrorResponse(EmailRequest request, String errorMessage) {
        return EmailResponse.builder()
                .emailId(request != null ? generateEmailId() : null)
                .status(EmailConstants.STATUS_FAILED)
                .success(false)
                .message(errorMessage)
                .toEmail(request != null ? request.getToEmail() : null)
                .subject(request != null ? request.getSubject() : null)
                .errorCode("ERROR")
                .errorMessage(errorMessage)
                .build();
    }
    
    // ==================== Template Methods ====================
    
    private String getWelcomeTemplate() {
        return """
            <html>
            <body>
                <h2>안녕하세요, {{userName}}님!</h2>
                <p>마음정원에 가입해주셔서 감사합니다.</p>
                <p>계정을 활성화하려면 아래 링크를 클릭해주세요:</p>
                <p><a href="{{activationLink}}">계정 활성화</a></p>
                <p>문의사항이 있으시면 {{supportEmail}}로 연락해주세요.</p>
                <p>감사합니다.<br>마음정원 팀</p>
            </body>
            </html>
            """;
    }
    
    private String getConsultantApprovalTemplate() {
        return """
            <html>
            <body>
                <h2>축하합니다, {{userName}}님!</h2>
                <p>상담사 승인이 완료되었습니다.</p>
                <p>이제 마음정원에서 상담 서비스를 제공하실 수 있습니다.</p>
                <p>문의사항이 있으시면 {{supportEmail}}로 연락해주세요.</p>
                <p>감사합니다.<br>마음정원 팀</p>
            </body>
            </html>
            """;
    }
    
    private String getConsultantRejectionTemplate() {
        return """
            <html>
            <body>
                <h2>안녕하세요, {{userName}}님</h2>
                <p>상담사 신청에 대한 검토 결과를 안내드립니다.</p>
                <p>현재 자격 요건을 충족하지 못하여 승인이 어렵습니다.</p>
                <p>자세한 내용은 {{supportEmail}}로 문의해주세요.</p>
                <p>감사합니다.<br>마음정원 팀</p>
            </body>
            </html>
            """;
    }
    
    private String getAdminApprovalTemplate() {
        return """
            <html>
            <body>
                <h2>축하합니다, {{userName}}님!</h2>
                <p>관리자 승인이 완료되었습니다.</p>
                <p>이제 마음정원의 관리자 권한을 사용하실 수 있습니다.</p>
                <p>문의사항이 있으시면 {{supportEmail}}로 연락해주세요.</p>
                <p>감사합니다.<br>마음정원 팀</p>
            </body>
            </html>
            """;
    }
    
    private String getPasswordResetTemplate() {
        return """
            <html>
            <body>
                <h2>비밀번호 재설정</h2>
                <p>안녕하세요, {{userName}}님</p>
                <p>비밀번호 재설정을 요청하셨습니다.</p>
                <p>아래 링크를 클릭하여 새 비밀번호를 설정해주세요:</p>
                <p><a href="{{resetLink}}">비밀번호 재설정</a></p>
                <p>이 링크는 24시간 후 만료됩니다.</p>
                <p>문의사항이 있으시면 {{supportEmail}}로 연락해주세요.</p>
                <p>감사합니다.<br>마음정원 팀</p>
            </body>
            </html>
            """;
    }
    
    private String getAccountActivationTemplate() {
        return """
            <html>
            <body>
                <h2>계정 활성화</h2>
                <p>안녕하세요, {{userName}}님</p>
                <p>계정이 성공적으로 활성화되었습니다.</p>
                <p>이제 마음정원의 모든 서비스를 이용하실 수 있습니다.</p>
                <p>문의사항이 있으시면 {{supportEmail}}로 연락해주세요.</p>
                <p>감사합니다.<br>마음정원 팀</p>
            </body>
            </html>
            """;
    }
    
    private String getAppointmentConfirmationTemplate() {
        return """
            <html>
            <body>
                <h2>상담 예약 확인</h2>
                <p>안녕하세요, {{userName}}님</p>
                <p>상담 예약이 확정되었습니다.</p>
                <p><strong>상담사:</strong> {{consultantName}}</p>
                <p><strong>일시:</strong> {{appointmentDate}} {{appointmentTime}}</p>
                <p>문의사항이 있으시면 {{supportEmail}}로 연락해주세요.</p>
                <p>감사합니다.<br>마음정원 팀</p>
            </body>
            </html>
            """;
    }
    
    private String getAppointmentReminderTemplate() {
        return """
            <html>
            <body>
                <h2>상담 예약 알림</h2>
                <p>안녕하세요, {{userName}}님</p>
                <p>내일 상담 예약이 있습니다.</p>
                <p><strong>상담사:</strong> {{consultantName}}</p>
                <p><strong>일시:</strong> {{appointmentDate}} {{appointmentTime}}</p>
                <p>문의사항이 있으시면 {{supportEmail}}로 연락해주세요.</p>
                <p>감사합니다.<br>마음정원 팀</p>
            </body>
            </html>
            """;
    }
    
    private String getPaymentConfirmationTemplate() {
        return """
            <html>
            <body>
                <h2>결제 완료 안내</h2>
                <p>안녕하세요, {{userName}}님</p>
                <p>결제가 성공적으로 완료되었습니다.</p>
                <p><strong>결제 금액:</strong> {{paymentAmount}}원</p>
                <p><strong>결제 방법:</strong> {{paymentMethod}}</p>
                <p>문의사항이 있으시면 {{supportEmail}}로 연락해주세요.</p>
                <p>감사합니다.<br>마음정원 팀</p>
            </body>
            </html>
            """;
    }
    
    private String getPaymentFailedTemplate() {
        return """
            <html>
            <body>
                <h2>결제 실패 안내</h2>
                <p>안녕하세요, {{userName}}님</p>
                <p>결제 처리 중 오류가 발생했습니다.</p>
                <p>다시 시도해주시거나 다른 결제 방법을 이용해주세요.</p>
                <p>문의사항이 있으시면 {{supportEmail}}로 연락해주세요.</p>
                <p>감사합니다.<br>마음정원 팀</p>
            </body>
            </html>
            """;
    }
    
    private String getSystemNotificationTemplate() {
        return """
            <html>
            <body>
                <h2>시스템 알림</h2>
                <p>안녕하세요, {{userName}}님</p>
                <p>{{message}}</p>
                <p>문의사항이 있으시면 {{supportEmail}}로 연락해주세요.</p>
                <p>감사합니다.<br>마음정원 팀</p>
            </body>
            </html>
            """;
    }
}
