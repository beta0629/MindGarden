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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import lombok.extern.slf4j.Slf4j;

/**
 * Mock 이메일 발송 서비스 구현체 (테스트용)
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-10
 */
@Slf4j
@Service
@ConditionalOnProperty(name = "email.test.mock-mode", havingValue = "true", matchIfMissing = false)
public class MockEmailServiceImpl implements EmailService {
    
    @Value("${email.test.mock-mode:true}")
    private boolean mockMode;
    
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(5);
    private final Map<String, EmailResponse> emailStatusMap = new ConcurrentHashMap<>();
    private final Map<String, Integer> emailCountMap = new ConcurrentHashMap<>();
    
    @Override
    public EmailResponse sendEmail(EmailRequest request) {
        log.info("Mock 이메일 발송 요청: to={}, subject={}", request.getToEmail(), request.getSubject());
        
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
            
            // Mock 이메일 발송
            EmailResponse response = sendMockEmail(request, emailId);
            
            // 발송 상태 저장
            emailStatusMap.put(emailId, response);
            
            // 발송 카운트 증가
            incrementEmailCount(request.getToEmail());
            
            log.info("Mock 이메일 발송 완료: emailId={}, status={}", emailId, response.getStatus());
            return response;
            
        } catch (Exception e) {
            log.error("Mock 이메일 발송 실패: to={}, error={}", request.getToEmail(), e.getMessage(), e);
            return createErrorResponse(request, EmailConstants.ERROR_EMAIL_SEND_FAILED);
        }
    }
    
    @Override
    public List<EmailResponse> sendBulkEmails(List<EmailRequest> requests) {
        log.info("Mock 다중 이메일 발송 요청: {}건", requests.size());
        
        List<EmailResponse> responses = new ArrayList<>();
        
        for (EmailRequest request : requests) {
            try {
                EmailResponse response = sendEmail(request);
                responses.add(response);
            } catch (Exception e) {
                log.error("Mock 다중 이메일 발송 중 오류: to={}, error={}", request.getToEmail(), e.getMessage(), e);
                responses.add(createErrorResponse(request, EmailConstants.ERROR_EMAIL_SEND_FAILED));
            }
        }
        
        log.info("Mock 다중 이메일 발송 완료: {}건 중 {}건 성공", requests.size(), 
                responses.stream().mapToInt(r -> r.isSuccess() ? 1 : 0).sum());
        
        return responses;
    }
    
    @Override
    public EmailResponse sendTemplateEmail(String templateType, String toEmail, String toName, Map<String, Object> variables) {
        log.info("Mock 템플릿 이메일 발송 요청: templateType={}, to={}", templateType, toEmail);
        
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
            log.error("Mock 템플릿 이메일 발송 실패: templateType={}, to={}, error={}", 
                    templateType, toEmail, e.getMessage(), e);
            return createErrorResponse(null, EmailConstants.ERROR_EMAIL_SEND_FAILED);
        }
    }
    
    @Override
    public EmailResponse scheduleEmail(EmailRequest request, long delayMillis) {
        log.info("Mock 예약 이메일 발송 요청: to={}, delay={}ms", request.getToEmail(), delayMillis);
        
        try {
            // 이메일 ID 생성
            String emailId = generateEmailId();
            
            // 예약 발송 설정
            request.setSendImmediately(false);
            request.setScheduledTime(System.currentTimeMillis() + delayMillis);
            
            // 예약 발송 스케줄링
            scheduler.schedule(() -> {
                try {
                    sendMockEmail(request, emailId);
                } catch (Exception e) {
                    log.error("Mock 예약 이메일 발송 실패: emailId={}, error={}", emailId, e.getMessage(), e);
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
            
            log.info("Mock 예약 이메일 등록 완료: emailId={}, scheduledAt={}", emailId, response.getScheduledAt());
            return response;
            
        } catch (Exception e) {
            log.error("Mock 예약 이메일 등록 실패: to={}, error={}", request.getToEmail(), e.getMessage(), e);
            return createErrorResponse(request, EmailConstants.ERROR_EMAIL_SEND_FAILED);
        }
    }
    
    @Override
    public EmailResponse getEmailStatus(String emailId) {
        log.debug("Mock 이메일 발송 상태 조회: emailId={}", emailId);
        
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
        log.info("Mock 이메일 발송 취소 요청: emailId={}", emailId);
        
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
            
            log.info("Mock 이메일 발송 취소 완료: emailId={}", emailId);
            return true;
        }
        
        log.warn("취소할 수 없는 이메일 상태입니다: emailId={}, status={}", emailId, response.getStatus());
        return false;
    }
    
    @Override
    public EmailResponse retryEmail(String emailId) {
        log.info("Mock 이메일 발송 재시도 요청: emailId={}", emailId);
        
        EmailResponse response = emailStatusMap.get(emailId);
        if (response == null) {
            log.warn("재시도할 이메일을 찾을 수 없습니다: emailId={}", emailId);
            return createErrorResponse(null, "이메일을 찾을 수 없습니다.");
        }
        
        if (response.getRetryCount() >= EmailConstants.MAX_RETRY_ATTEMPTS) {
            log.warn("최대 재시도 횟수 초과: emailId={}, retryCount={}", emailId, response.getRetryCount());
            return createErrorResponse(null, "최대 재시도 횟수를 초과했습니다.");
        }
        
        // 재시도 로직
        response.setRetryCount(response.getRetryCount() + 1);
        response.setStatus(EmailConstants.STATUS_PENDING);
        response.setSuccess(false);
        response.setMessage("이메일 발송 재시도 중...");
        
        emailStatusMap.put(emailId, response);
        
        log.info("Mock 이메일 발송 재시도 완료: emailId={}, retryCount={}", emailId, response.getRetryCount());
        return response;
    }
    
    @Override
    public String previewTemplate(String templateType, Map<String, Object> variables) {
        log.debug("Mock 이메일 템플릿 미리보기: templateType={}", templateType);
        
        try {
            String template = loadEmailTemplate(templateType);
            if (template == null) {
                log.error("이메일 템플릿을 찾을 수 없습니다: {}", templateType);
                return null;
            }
            
            return applyTemplateVariables(template, variables);
            
        } catch (Exception e) {
            log.error("Mock 이메일 템플릿 미리보기 실패: templateType={}, error={}", templateType, e.getMessage(), e);
            return null;
        }
    }
    
    @Override
    public Map<String, Object> getEmailStatistics() {
        log.debug("Mock 이메일 발송 통계 조회");
        
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
        
        log.debug("Mock 이메일 발송 통계 조회 완료: totalSent={}, successCount={}, failedCount={}", 
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
        log.debug("Mock 대기 중인 이메일 목록 조회");
        
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
    
    private EmailResponse sendMockEmail(EmailRequest request, String emailId) {
        try {
            // Mock 이메일 발송 시뮬레이션 (95% 성공률)
            boolean success = Math.random() > 0.05;
            
            // 실제 이메일 발송 시뮬레이션을 위한 지연
            Thread.sleep(100);
            
            log.info("Mock 이메일 발송 시뮬레이션: emailId={}, to={}, subject={}, success={}", 
                emailId, request.getToEmail(), request.getSubject(), success);
            
            EmailResponse response = EmailResponse.builder()
                    .emailId(emailId)
                    .status(success ? EmailConstants.STATUS_SENT : EmailConstants.STATUS_FAILED)
                    .success(success)
                    .message(success ? EmailConstants.SUCCESS_EMAIL_SENT : EmailConstants.ERROR_EMAIL_SEND_FAILED)
                    .toEmail(request.getToEmail())
                    .subject(request.getSubject())
                    .sentAt(LocalDateTime.now())
                    .retryCount(0)
                    .externalId("mock_" + emailId)
                    .build();
            
            if (!success) {
                response.setErrorCode("MOCK_SEND_FAILED");
                response.setErrorMessage("Mock 이메일 발송 시뮬레이션 실패");
            }
            
            return response;
            
        } catch (Exception e) {
            log.error("Mock 이메일 발송 시뮬레이션 오류: emailId={}, error={}", emailId, e.getMessage(), e);
            
            return EmailResponse.builder()
                    .emailId(emailId)
                    .status(EmailConstants.STATUS_FAILED)
                    .success(false)
                    .message(EmailConstants.ERROR_EMAIL_SEND_FAILED)
                    .toEmail(request.getToEmail())
                    .subject(request.getSubject())
                    .errorCode("MOCK_ERROR")
                    .errorMessage("Mock 이메일 발송 시뮬레이션 오류: " + e.getMessage())
                    .build();
        }
    }
    
    private String generateEmailId() {
        return "mock_email_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8);
    }
    
    private String loadEmailTemplate(String templateType) {
        // Mock 템플릿 반환
        return "<html><body><h2>Mock 이메일 템플릿: {{templateType}}</h2><p>{{content}}</p></body></html>";
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
        return "Mock 이메일: " + templateType;
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
                .errorCode("MOCK_ERROR")
                .errorMessage(errorMessage)
                .build();
    }
}
