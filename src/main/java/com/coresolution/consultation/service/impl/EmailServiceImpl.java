package com.coresolution.consultation.service.impl;

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
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.EmailConstants;
import com.coresolution.consultation.dto.EmailRequest;
import com.coresolution.consultation.dto.EmailResponse;
import com.coresolution.consultation.service.EmailService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.entity.CommonCode;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
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
    
    @Autowired
    private JavaMailSender javaMailSender;

    @Autowired
    private CommonCodeService commonCodeService;

    @Autowired
    private com.coresolution.core.repository.TenantRepository tenantRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${email.block-legacy-branch-recipients:true}")
    private boolean blockLegacyBranchRecipients;

    /**
     * 이메일 발송 전면 차단 (운영 정책: 시스템에서 이메일 미사용)
     * - true이면 모든 수신자(to)에 대해 발송을 막음
     * - 필요 시 email.send-allowlist 로 예외 허용 가능 (콤마 구분)
     */
    @Value("${email.block-all-outbound:false}")
    private boolean blockAllOutboundEmail;

    @Value("${email.send-allowlist:}")
    private String sendAllowlist;
    
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
    public EmailResponse sendTemplateEmail(String templateType, String toEmail, String toName, Map<String, Object> originalVariables) {
        log.info("템플릿 이메일 발송 요청: templateType={}, to={}", templateType, toEmail);
        
        try {
            // 템플릿 로드
            String template = loadEmailTemplate(templateType);
            if (template == null) {
                log.error("이메일 템플릿을 찾을 수 없습니다: {}", templateType);
                return createErrorResponse(null, EmailConstants.ERROR_EMAIL_TEMPLATE_NOT_FOUND);
            }
            
            // 템플릿 변수 보강 (테넌트 정보 등)
            Map<String, Object> variables = enrichTemplateVariables(originalVariables);
            
            // 템플릿 변수 적용
            String content = applyTemplateVariables(template, variables);
            
            // 이메일 제목 생성 및 변수 치환
            String subject = getEmailSubject(templateType);
            subject = applyTemplateVariables(subject, variables);
            
            // Trinity 관련 이메일인 경우 발신자 정보 변경
            String fromEmail = EmailConstants.FROM_EMAIL;
            String fromName = variables.containsKey("companyName") ? (String) variables.get("companyName") : EmailConstants.FROM_NAME;
            String replyTo = EmailConstants.REPLY_TO_EMAIL;
            
            if (EmailConstants.TEMPLATE_EMAIL_VERIFICATION.equals(templateType)) {
                // 온보딩 이메일 인증은 Gmail 계정으로 발송 (Gmail SMTP 인증 계정과 일치해야 함)
                // 환경 변수에서 발신자 이메일 읽기 (없으면 기본값 사용)
                String mailUsername = System.getenv("MAIL_USERNAME");
                if (mailUsername != null && !mailUsername.isEmpty()) {
                    fromEmail = mailUsername; // Gmail 인증 계정과 동일하게 설정
                    fromName = "Trinity";
                    replyTo = mailUsername; // 회신도 같은 계정으로
                } else {
                    fromEmail = "noreply@e-trinity.co.kr";
                    fromName = "Trinity";
                    replyTo = "admin@e-trinity.co.kr";
                }
            }
            
            // 이메일 요청 생성
            EmailRequest request = EmailRequest.builder()
                    .toEmail(toEmail)
                    .toName(toName)
                    .subject(subject)
                    .content(content)
                    .templateType(templateType)
                    .templateVariables(variables)
                    .type(EmailConstants.TYPE_HTML)
                    .fromEmail(fromEmail)
                    .fromName(fromName)
                    .replyTo(replyTo)
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
                    .message(EmailConstants.ERROR_EMAIL_STATUS_NOT_FOUND)
                    .build();
        }
        
        return response;
    }
    
    @Override
    public List<EmailResponse> getEmailHistory(String toEmail, int limit) {
        log.info("이메일 발송 이력 조회: to={}, limit={}", toEmail, limit);
        
        return emailStatusMap.values().stream()
                .filter(response -> response.getToEmail().equals(toEmail))
                .sorted((a, b) -> b.getSentAt().compareTo(a.getSentAt()))
                .limit(limit)
                .collect(Collectors.toList());
    }
    
    @Override
    public EmailResponse resendEmail(String emailId) {
        log.info("이메일 재발송 요청: emailId={}", emailId);
        
        EmailResponse originalResponse = emailStatusMap.get(emailId);
        if (originalResponse == null) {
            return EmailResponse.builder()
                    .emailId(emailId)
                    .status(EmailConstants.STATUS_FAILED)
                    .success(false)
                    .message(EmailConstants.ERROR_EMAIL_RESEND_NOT_FOUND)
                    .build();
        }
        
        // 재발송 로직 (실제 구현에서는 원본 요청을 다시 발송)
        return originalResponse;
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
            response.setMessage(EmailConstants.SUCCESS_EMAIL_SEND_CANCELLED);
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
            return createErrorResponse(null, EmailConstants.ERROR_EMAIL_NOT_FOUND);
        }
        
        if (response.getRetryCount() >= EmailConstants.MAX_RETRY_ATTEMPTS) {
            log.warn("최대 재시도 횟수 초과: emailId={}, retryCount={}", emailId, response.getRetryCount());
            return createErrorResponse(null, EmailConstants.ERROR_EMAIL_MAX_RETRY_EXCEEDED);
        }
        
        // 재시도 로직 (실제 구현에서는 원본 요청 정보를 저장해두고 재사용)
        response.setRetryCount(response.getRetryCount() + 1);
        response.setStatus(EmailConstants.STATUS_PENDING);
        response.setSuccess(false);
        response.setMessage(EmailConstants.SUCCESS_EMAIL_RETRY_IN_PROGRESS);
        
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
            
            Map<String, Object> enrichedVariables = enrichTemplateVariables(variables);
            return applyTemplateVariables(template, enrichedVariables);
            
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

        // 이메일 전면 차단(정책)
        if (blockAllOutboundEmail && !isAllowlistedRecipient(request.getToEmail())) {
            log.warn("⚠️ 이메일 전면 차단 정책으로 발송 차단: tenantId={}, to={}, subject={}",
                    TenantContextHolder.getTenantId(), request.getToEmail(), request.getSubject());
            throw new IllegalArgumentException("이 시스템에서는 이메일 발송을 사용하지 않습니다.");
        }

        // 지점관리 미사용 정책: BRANCH 공통코드(레거시 지점 이메일)로의 발송을 전면 차단
        if (blockLegacyBranchRecipients && isLegacyBranchRecipient(request.getToEmail())) {
            throw new IllegalArgumentException("레거시 지점 이메일로는 발송하지 않습니다.");
        }
        
        if (!StringUtils.hasText(request.getSubject())) {
            throw new IllegalArgumentException("이메일 제목은 필수입니다.");
        }
        
        if (!StringUtils.hasText(request.getContent())) {
            throw new IllegalArgumentException("이메일 내용은 필수입니다.");
        }
    }

    private boolean isLegacyBranchRecipient(String toEmail) {
        try {
            String tenantId = TenantContextHolder.getTenantId();
            List<CommonCode> branchCodes = commonCodeService.getActiveCommonCodesByGroup("BRANCH");
            if (branchCodes == null || branchCodes.isEmpty()) {
                return false;
            }

            for (CommonCode code : branchCodes) {
                String extra = code.getExtraData();
                if (!StringUtils.hasText(extra)) {
                    continue;
                }
                String email = extractEmailFromExtraData(extra);
                if (StringUtils.hasText(email) && toEmail.equalsIgnoreCase(email.trim())) {
                    log.warn("⚠️ 레거시 지점 이메일 수신자 차단: tenantId={}, codeValue={}, to={}",
                            tenantId, code.getCodeValue(), toEmail);
                    return true;
                }
            }
            return false;
        } catch (Exception e) {
            // 차단 로직이 실패해도 이메일 시스템 전체를 막지 않도록 "차단하지 않음"으로 폴백
            log.warn("레거시 지점 이메일 차단 검사 실패(무시): to={}", toEmail, e);
            return false;
        }
    }

    private String extractEmailFromExtraData(String extraDataJson) {
        try {
            JsonNode node = objectMapper.readTree(extraDataJson);
            JsonNode emailNode = node.get("email");
            return emailNode != null && !emailNode.isNull() ? emailNode.asText() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private boolean isAllowlistedRecipient(String toEmail) {
        if (!StringUtils.hasText(toEmail)) {
            return false;
        }
        if (!StringUtils.hasText(sendAllowlist)) {
            return false;
        }
        String[] allowed = sendAllowlist.split(",");
        for (String a : allowed) {
            if (StringUtils.hasText(a) && toEmail.equalsIgnoreCase(a.trim())) {
                return true;
            }
        }
        return false;
    }
    
    private EmailResponse sendEmailInternal(EmailRequest request, String emailId) {
        try {
            // MimeMessage 생성
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            // 발신자 설정
            String fromEmail = StringUtils.hasText(request.getFromEmail()) ? 
                request.getFromEmail() : EmailConstants.FROM_EMAIL;
            String fromName = StringUtils.hasText(request.getFromName()) ? 
                request.getFromName() : EmailConstants.FROM_NAME;
            
            helper.setFrom(fromEmail, fromName);
            
            // 수신자 설정
            helper.setTo(request.getToEmail());
            
            // 제목 설정
            helper.setSubject(request.getSubject());
            
            // 내용 설정 (HTML 또는 TEXT)
            boolean isHtml = "HTML".equalsIgnoreCase(request.getType());
            helper.setText(request.getContent(), isHtml);
            
            // 회신 주소 설정
            String replyTo = StringUtils.hasText(request.getReplyTo()) ? 
                request.getReplyTo() : EmailConstants.REPLY_TO_EMAIL;
            helper.setReplyTo(replyTo);
            
            // 실제 이메일 발송
            javaMailSender.send(mimeMessage);
            
            log.info("이메일 발송 성공: emailId={}, to={}, subject={}", 
                emailId, request.getToEmail(), request.getSubject());
            
            return EmailResponse.builder()
                    .emailId(emailId)
                    .status(EmailConstants.STATUS_SENT)
                    .success(true)
                    .message(EmailConstants.SUCCESS_EMAIL_SENT)
                    .toEmail(request.getToEmail())
                    .subject(request.getSubject())
                    .sentAt(LocalDateTime.now())
                    .retryCount(0)
                    .externalId("smtp_" + emailId)
                    .build();
            
        } catch (MessagingException e) {
            log.error("이메일 발송 실패 (MessagingException): emailId={}, to={}, error={}", 
                emailId, request.getToEmail(), e.getMessage(), e);
            
            return EmailResponse.builder()
                    .emailId(emailId)
                    .status(EmailConstants.STATUS_FAILED)
                    .success(false)
                    .message(EmailConstants.ERROR_EMAIL_SEND_FAILED)
                    .toEmail(request.getToEmail())
                    .subject(request.getSubject())
                    .errorCode("MESSAGING_ERROR")
                    .errorMessage(EmailConstants.ERROR_EMAIL_MESSAGE_BUILD_FAILED + e.getMessage())
                    .build();
                    
        } catch (Exception e) {
            log.error("이메일 발송 실패 (Exception): emailId={}, to={}, error={}", 
                emailId, request.getToEmail(), e.getMessage(), e);
            
            return EmailResponse.builder()
                    .emailId(emailId)
                    .status(EmailConstants.STATUS_FAILED)
                    .success(false)
                    .message(EmailConstants.ERROR_EMAIL_SEND_FAILED)
                    .toEmail(request.getToEmail())
                    .subject(request.getSubject())
                    .errorCode("SEND_ERROR")
                    .errorMessage(EmailConstants.ERROR_EMAIL_SEND_RUNTIME_FAILED + e.getMessage())
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
        templates.put(EmailConstants.TEMPLATE_EMAIL_VERIFICATION, getEmailVerificationTemplate());
        templates.put(EmailConstants.TEMPLATE_APPOINTMENT_CONFIRMATION, getAppointmentConfirmationTemplate());
        templates.put(EmailConstants.TEMPLATE_APPOINTMENT_REMINDER, getAppointmentReminderTemplate());
        templates.put(EmailConstants.TEMPLATE_PAYMENT_CONFIRMATION, getPaymentConfirmationTemplate());
        templates.put(EmailConstants.TEMPLATE_PAYMENT_FAILED, getPaymentFailedTemplate());
        templates.put(EmailConstants.TEMPLATE_SYSTEM_NOTIFICATION, getSystemNotificationTemplate());
        templates.put(EmailConstants.TEMPLATE_SESSION_EXTENSION_CONFIRMATION, getSessionExtensionConfirmationTemplate());
        
        return templates.get(templateType);
    }
    
    private Map<String, Object> enrichTemplateVariables(Map<String, Object> originalVariables) {
        Map<String, Object> variables = new java.util.HashMap<>(originalVariables != null ? originalVariables : new java.util.HashMap<>());
        
        // 기본값 설정 (변수에 없으면)
        if (!variables.containsKey("companyName") && !variables.containsKey(EmailConstants.VAR_COMPANY_NAME)) {
            variables.put("companyName", "mindgarden");
            variables.put(EmailConstants.VAR_COMPANY_NAME, "mindgarden");
        }
        
        // 서브도메인(테넌트) 동적 치환: companyName이 하드코딩된 경우 실제 테넌트 정보로 교체
        String tenantId = com.coresolution.core.context.TenantContextHolder.getTenantId();
        if (tenantId != null && !tenantId.isEmpty() && tenantRepository != null) {
            try {
                tenantRepository.findByTenantIdAndIsDeletedFalse(tenantId).ifPresent(tenant -> {
                    String subdomain = tenant.getSubdomain();
                    String companyName = (subdomain != null && !subdomain.isEmpty()) ? subdomain : tenant.getName();
                    variables.put(EmailConstants.VAR_COMPANY_NAME, companyName);
                    variables.put("companyName", companyName);
                });
            } catch (Exception e) {
                log.warn("이메일 템플릿 변수 치환 중 테넌트 조회 실패: {}", e.getMessage());
            }
        }
        return variables;
    }

    private String applyTemplateVariables(String template, Map<String, Object> variables) {
        if (template == null || variables == null) {
            return template;
        }
        
        String result = template;
        for (Map.Entry<String, Object> entry : variables.entrySet()) {
            String key = entry.getKey();
            // EmailConstants.VAR_* 는 "{{userName}}" 형태 — 이중으로 감싸면 {{ {{userName}} }} 가 되어 치환 실패
            String placeholder = (key != null && key.startsWith("{{") && key.endsWith("}}"))
                    ? key
                    : "{{" + key + "}}";
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
        subjects.put(EmailConstants.TEMPLATE_EMAIL_VERIFICATION, EmailConstants.SUBJECT_EMAIL_VERIFICATION);
        subjects.put(EmailConstants.TEMPLATE_APPOINTMENT_CONFIRMATION, EmailConstants.SUBJECT_APPOINTMENT_CONFIRMATION);
        subjects.put(EmailConstants.TEMPLATE_APPOINTMENT_REMINDER, EmailConstants.SUBJECT_APPOINTMENT_REMINDER);
        subjects.put(EmailConstants.TEMPLATE_PAYMENT_CONFIRMATION, EmailConstants.SUBJECT_PAYMENT_CONFIRMATION);
        subjects.put(EmailConstants.TEMPLATE_PAYMENT_FAILED, EmailConstants.SUBJECT_PAYMENT_FAILED);
        subjects.put(EmailConstants.TEMPLATE_SYSTEM_NOTIFICATION, EmailConstants.SUBJECT_SYSTEM_NOTIFICATION);
        subjects.put(EmailConstants.TEMPLATE_SESSION_EXTENSION_CONFIRMATION, EmailConstants.SUBJECT_SESSION_EXTENSION_CONFIRMATION);
        
        return subjects.getOrDefault(templateType, "{{companyName}} 알림");
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
    
    private String getBaseTemplate() {
        return """
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>{{title}}</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #F2EDE8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; word-break: keep-all;">
                <!-- 100% Width Background Table -->
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F2EDE8; width: 100%;">
                    <tr>
                        <td align="center" style="padding: 40px 20px;">
                            
                            <!-- 600px Container Table -->
                            <table role="presentation" width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                                
                                <!-- Header -->
                                <tr>
                                    <td align="center" style="background-color: #FAF9F7; padding: 32px 40px; border-bottom: 1px solid #EAEAEA;">
                                        <h1 style="margin: 0; color: #333333; font-size: 24px; font-weight: bold; line-height: 1.4;">{{title}}</h1>
                                    </td>
                                </tr>
                                
                                <!-- Content (Body) -->
                                <tr>
                                    <td style="padding: 40px;">
                                        {{content}}
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #FAF9F7; padding: 32px 40px; border-top: 1px solid #EAEAEA; border-radius: 0 0 16px 16px;">
                                        <p style="margin: 0 0 8px 0; color: #666666; font-size: 14px; line-height: 1.5;">
                                            문의사항이 있으시면 <a href="mailto:{{supportEmail}}" style="color: #3D5246; text-decoration: underline;">{{supportEmail}}</a>로 연락해주세요.
                                        </p>
                                        <p style="margin: 0; color: #999999; font-size: 13px; line-height: 1.5;">
                                            감사합니다.<br><strong>{{companyName}} 팀</strong>
                                        </p>
                                    </td>
                                </tr>
                                
                            </table>
                            <!-- // 600px Container Table -->
            
                        </td>
                    </tr>
                </table>
                <!-- // 100% Width Background Table -->
            </body>
            </html>
            """;
    }
    
    private String getWelcomeTemplate() {
        String content = """
            <h2 style="margin: 0 0 16px 0; color: #111111; font-size: 20px; font-weight: bold; line-height: 1.5;">
                안녕하세요, {{userName}}님!
            </h2>
            <p style="margin: 0 0 12px 0; color: #444444; font-size: 16px; line-height: 1.6;">
                {{companyName}}에 가입해주셔서 감사합니다.<br>
                계정을 활성화하려면 아래 버튼을 클릭해주세요.
            </p>
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 32px 0 0 0;">
                <tr>
                    <td align="center">
                        <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                                <td align="center" bgcolor="#3D5246" style="border-radius: 8px;">
                                    <a href="{{activationLink}}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 16px; color: #FFFFFF; text-decoration: none; font-weight: bold; border-radius: 8px; background-color: #3D5246; border: 1px solid #3D5246;">
                                        계정 활성화
                                    </a>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
            """;
        return getBaseTemplate()
                .replace("{{title}}", "환영합니다")
                .replace("{{content}}", content);
    }
    
    private String getConsultantApprovalTemplate() {
        String content = """
            <h2 style="margin: 0 0 16px 0; color: #111111; font-size: 20px; font-weight: bold; line-height: 1.5;">
                축하합니다, {{userName}}님!
            </h2>
            <p style="margin: 0 0 12px 0; color: #444444; font-size: 16px; line-height: 1.6;">
                상담사 승인이 완료되었습니다.<br>
                이제 {{companyName}}에서 상담 서비스를 제공하실 수 있습니다.
            </p>
            """;
        return getBaseTemplate()
                .replace("{{title}}", "상담사 승인 완료")
                .replace("{{content}}", content);
    }
    
    private String getConsultantRejectionTemplate() {
        String content = """
            <h2 style="margin: 0 0 16px 0; color: #111111; font-size: 20px; font-weight: bold; line-height: 1.5;">
                안녕하세요, {{userName}}님
            </h2>
            <p style="margin: 0 0 12px 0; color: #444444; font-size: 16px; line-height: 1.6;">
                상담사 신청에 대한 검토 결과를 안내드립니다.<br>
                현재 자격 요건을 충족하지 못하여 승인이 어렵습니다.<br>
                자세한 내용은 고객센터로 문의해주세요.
            </p>
            """;
        return getBaseTemplate()
                .replace("{{title}}", "상담사 신청 결과 안내")
                .replace("{{content}}", content);
    }
    
    private String getAdminApprovalTemplate() {
        String content = """
            <h2 style="margin: 0 0 16px 0; color: #111111; font-size: 20px; font-weight: bold; line-height: 1.5;">
                축하합니다, {{userName}}님!
            </h2>
            <p style="margin: 0 0 12px 0; color: #444444; font-size: 16px; line-height: 1.6;">
                관리자 승인이 완료되었습니다.<br>
                이제 {{companyName}}의 관리자 권한을 사용하실 수 있습니다.
            </p>
            """;
        return getBaseTemplate()
                .replace("{{title}}", "관리자 승인 완료")
                .replace("{{content}}", content);
    }
    
    private String getPasswordResetTemplate() {
        String content = """
            <h2 style="margin: 0 0 16px 0; color: #111111; font-size: 20px; font-weight: bold; line-height: 1.5;">
                안녕하세요, {{userName}}님
            </h2>
            <p style="margin: 0 0 12px 0; color: #444444; font-size: 16px; line-height: 1.6;">
                비밀번호 재설정을 요청하셨습니다.<br>
                아래 버튼을 클릭하여 새 비밀번호를 설정해주세요.
            </p>
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                <tr>
                    <td style="background-color: #FAF9F7; padding: 20px; border-radius: 8px;">
                        <p style="margin: 0; color: #333333; font-size: 15px; line-height: 1.5; text-align: center;">
                            <strong>링크 유효 시간:</strong> 24시간 이내
                        </p>
                    </td>
                </tr>
            </table>
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 32px 0 0 0;">
                <tr>
                    <td align="center">
                        <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                                <td align="center" bgcolor="#3D5246" style="border-radius: 8px;">
                                    <a href="{{resetLink}}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 16px; color: #FFFFFF; text-decoration: none; font-weight: bold; border-radius: 8px; background-color: #3D5246; border: 1px solid #3D5246;">
                                        비밀번호 재설정
                                    </a>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
            """;
        return getBaseTemplate()
                .replace("{{title}}", "비밀번호 재설정")
                .replace("{{content}}", content);
    }
    
    private String getAccountActivationTemplate() {
        String content = """
            <h2 style="margin: 0 0 16px 0; color: #111111; font-size: 20px; font-weight: bold; line-height: 1.5;">
                안녕하세요, {{userName}}님
            </h2>
            <p style="margin: 0 0 12px 0; color: #444444; font-size: 16px; line-height: 1.6;">
                계정이 성공적으로 활성화되었습니다.<br>
                이제 {{companyName}}의 모든 서비스를 이용하실 수 있습니다.
            </p>
            """;
        return getBaseTemplate()
                .replace("{{title}}", "계정 활성화 완료")
                .replace("{{content}}", content);
    }
    
    private String getEmailVerificationTemplate() {
        String content = """
            <h2 style="margin: 0 0 16px 0; color: #111111; font-size: 20px; font-weight: bold; line-height: 1.5;">
                이메일 인증 코드
            </h2>
            <p style="margin: 0 0 12px 0; color: #444444; font-size: 16px; line-height: 1.6;">
                안녕하세요,<br>
                CoreSolution 서비스 신청을 위한 이메일 인증 코드입니다.
            </p>
            <div style="background-color: #FAF9F7; border: 1px solid #EAEAEA; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                <p style="margin: 0 0 12px; font-size: 13px; color: #3D5246; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">인증 코드</p>
                <p style="margin: 0; font-size: 42px; font-weight: 700; color: #3D5246; letter-spacing: 8px; font-family: 'Courier New', monospace;">{{verificationCode}}</p>
            </div>
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                <tr>
                    <td style="background-color: #FFF9E6; padding: 20px; border-radius: 8px; border-left: 4px solid #FFC107;">
                        <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                            <strong>⏰ 유효 시간:</strong> 이 코드는 <strong>{{expiryMinutes}}분</strong> 동안 유효합니다.<br>
                            <strong>🔒 보안:</strong> 본인이 요청하지 않은 경우 이 이메일을 무시하셔도 됩니다.
                        </p>
                    </td>
                </tr>
            </table>
            <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #EAEAEA;">
                <p style="margin: 0 0 12px; color: #333333; font-size: 15px; font-weight: 600;">사용 방법</p>
                <ol style="margin: 0; padding-left: 20px; color: #666666; font-size: 14px; line-height: 1.8;">
                    <li>서비스 신청 페이지로 돌아가세요</li>
                    <li>위의 인증 코드를 입력란에 입력하세요</li>
                    <li>"인증 코드 확인" 버튼을 클릭하세요</li>
                </ol>
            </div>
            """;
        return getBaseTemplate()
                .replace("{{title}}", "이메일 인증 코드 - Trinity")
                .replace("{{content}}", content);
    }
    
    private String getAppointmentConfirmationTemplate() {
        String content = """
            <h2 style="margin: 0 0 16px 0; color: #111111; font-size: 20px; font-weight: bold; line-height: 1.5;">
                안녕하세요, {{userName}}님
            </h2>
            <p style="margin: 0 0 12px 0; color: #444444; font-size: 16px; line-height: 1.6;">
                상담 예약이 확정되었습니다.
            </p>
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                <tr>
                    <td style="background-color: #FAF9F7; padding: 20px; border-radius: 8px;">
                        <p style="margin: 0 0 8px 0; color: #333333; font-size: 15px; line-height: 1.5;">
                            <strong>상담사:</strong> {{consultantName}}
                        </p>
                        <p style="margin: 0; color: #333333; font-size: 15px; line-height: 1.5;">
                            <strong>일시:</strong> {{appointmentDate}} {{appointmentTime}}
                        </p>
                    </td>
                </tr>
            </table>
            """;
        return getBaseTemplate()
                .replace("{{title}}", "상담 예약 확인")
                .replace("{{content}}", content);
    }
    
    private String getAppointmentReminderTemplate() {
        String content = """
            <h2 style="margin: 0 0 16px 0; color: #111111; font-size: 20px; font-weight: bold; line-height: 1.5;">
                안녕하세요, {{userName}}님
            </h2>
            <p style="margin: 0 0 12px 0; color: #444444; font-size: 16px; line-height: 1.6;">
                내일 상담 예약이 있습니다.
            </p>
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                <tr>
                    <td style="background-color: #FAF9F7; padding: 20px; border-radius: 8px;">
                        <p style="margin: 0 0 8px 0; color: #333333; font-size: 15px; line-height: 1.5;">
                            <strong>상담사:</strong> {{consultantName}}
                        </p>
                        <p style="margin: 0; color: #333333; font-size: 15px; line-height: 1.5;">
                            <strong>일시:</strong> {{appointmentDate}} {{appointmentTime}}
                        </p>
                    </td>
                </tr>
            </table>
            """;
        return getBaseTemplate()
                .replace("{{title}}", "상담 예약 알림")
                .replace("{{content}}", content);
    }
    
    private String getPaymentConfirmationTemplate() {
        String content = """
            <h2 style="margin: 0 0 16px 0; color: #111111; font-size: 20px; font-weight: bold; line-height: 1.5;">
                안녕하세요, {{userName}}님
            </h2>
            <p style="margin: 0 0 12px 0; color: #444444; font-size: 16px; line-height: 1.6;">
                결제가 성공적으로 완료되었습니다.
            </p>
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                <tr>
                    <td style="background-color: #FAF9F7; padding: 20px; border-radius: 8px;">
                        <p style="margin: 0 0 8px 0; color: #333333; font-size: 15px; line-height: 1.5;">
                            <strong>결제 금액:</strong> {{paymentAmount}}원
                        </p>
                        <p style="margin: 0; color: #333333; font-size: 15px; line-height: 1.5;">
                            <strong>결제 방법:</strong> {{paymentMethod}}
                        </p>
                    </td>
                </tr>
            </table>
            """;
        return getBaseTemplate()
                .replace("{{title}}", "결제 완료 안내")
                .replace("{{content}}", content);
    }
    
    private String getPaymentFailedTemplate() {
        String content = """
            <h2 style="margin: 0 0 16px 0; color: #111111; font-size: 20px; font-weight: bold; line-height: 1.5;">
                안녕하세요, {{userName}}님
            </h2>
            <p style="margin: 0 0 12px 0; color: #444444; font-size: 16px; line-height: 1.6;">
                결제 처리 중 오류가 발생했습니다.<br>
                다시 시도해주시거나 다른 결제 방법을 이용해주세요.
            </p>
            """;
        return getBaseTemplate()
                .replace("{{title}}", "결제 실패 안내")
                .replace("{{content}}", content);
    }
    
    private String getSystemNotificationTemplate() {
        String content = """
            <h2 style="margin: 0 0 16px 0; color: #111111; font-size: 20px; font-weight: bold; line-height: 1.5;">
                안녕하세요, {{userName}}님
            </h2>
            <p style="margin: 0 0 12px 0; color: #444444; font-size: 16px; line-height: 1.6;">
                {{message}}
            </p>
            """;
        return getBaseTemplate()
                .replace("{{title}}", "시스템 알림")
                .replace("{{content}}", content);
    }
    
    private String getSessionExtensionConfirmationTemplate() {
        String content = """
            <h2 style="margin: 0 0 16px 0; color: #111111; font-size: 20px; font-weight: bold; line-height: 1.5;">
                안녕하세요, {{userName}}님
            </h2>
            <p style="margin: 0 0 12px 0; color: #444444; font-size: 16px; line-height: 1.6;">
                요청하신 회기 추가가 성공적으로 완료되었습니다.
            </p>
            
            <div style="background-color: #FAF9F7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #3D5246; margin: 0 0 12px 0; font-size: 16px;">📋 결제 정보</h3>
                <ul style="list-style: none; padding: 0; margin: 0; color: #444444; font-size: 14px; line-height: 1.6;">
                    <li style="margin-bottom: 8px;"><strong>결제 금액:</strong> {{paymentAmount}}원</li>
                    <li style="margin-bottom: 8px;"><strong>결제 방법:</strong> {{paymentMethod}}</li>
                    <li><strong>확인 일시:</strong> {{confirmationDate}}</li>
                </ul>
            </div>
            
            <div style="background-color: #FAF9F7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #3D5246; margin: 0 0 12px 0; font-size: 16px;">📈 회기 정보</h3>
                <ul style="list-style: none; padding: 0; margin: 0; color: #444444; font-size: 14px; line-height: 1.6;">
                    <li style="margin-bottom: 8px;"><strong>패키지명:</strong> {{packageName}}</li>
                    <li style="margin-bottom: 8px;"><strong>추가 회기:</strong> {{additionalSessions}}회</li>
                    <li style="margin-bottom: 8px;"><strong>총 회기:</strong> {{totalSessions}}회</li>
                    <li><strong>남은 회기:</strong> {{remainingSessions}}회</li>
                </ul>
            </div>
            
            <div style="background-color: #FAF9F7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #3D5246; margin: 0 0 12px 0; font-size: 16px;">👥 상담 정보</h3>
                <ul style="list-style: none; padding: 0; margin: 0; color: #444444; font-size: 14px; line-height: 1.6;">
                    <li style="margin-bottom: 8px;"><strong>상담사:</strong> {{consultantName}}</li>
                    <li><strong>내담자:</strong> {{clientName}}</li>
                </ul>
            </div>
            
            <p style="margin: 24px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                추가된 회기는 즉시 사용 가능하며, 상담 예약 시 자동으로 차감됩니다.
            </p>
            """;
        return getBaseTemplate()
                .replace("{{title}}", "회기 추가 완료 안내")
                .replace("{{content}}", content);
    }
    
    // ==================== 급여 관련 이메일 ====================
    
    @Override
    public boolean sendSalaryCalculationEmail(String toEmail, String consultantName, 
                                            String period, Map<String, Object> salaryData, 
                                            String attachmentPath) {
        try {
            log.info("급여 계산서 이메일 발송: to={}, 상담사={}, 기간={}", toEmail, consultantName, period);
            
            Map<String, Object> variables = enrichTemplateVariables(salaryData);
            String subject = String.format("[{{companyName}}] %s 급여 계산서 - %s", consultantName, period);
            subject = applyTemplateVariables(subject, variables); // variables에 companyName 보강
            String content = createSalaryCalculationEmailContent(consultantName, period, salaryData);
            
            EmailRequest request = EmailRequest.builder()
                    .toEmail(toEmail)
                    .toName(consultantName)
                    .subject(subject)
                    .content(content)
                    .type("HTML")
                    .templateType("SALARY_CALCULATION")
                    .templateVariables(Map.of(
                        "consultantName", consultantName,
                        "period", period,
                        "salaryData", salaryData
                    ))
                    .attachments(attachmentPath != null ? List.of(attachmentPath) : null)
                    .build();
            
            EmailResponse response = sendEmail(request);
            return response.isSuccess();
            
        } catch (Exception e) {
            log.error("급여 계산서 이메일 발송 실패: to={}, error={}", toEmail, e.getMessage(), e);
            return false;
        }
    }
    
    @Override
    public boolean sendSalaryApprovalEmail(String toEmail, String consultantName, 
                                         String period, String approvedAmount) {
        try {
            log.info("급여 승인 이메일 발송: to={}, 상담사={}, 기간={}", toEmail, consultantName, period);
            
            Map<String, Object> variables = enrichTemplateVariables(new java.util.HashMap<>());
            String subject = String.format("[{{companyName}}] %s 급여 승인 완료 - %s", consultantName, period);
            subject = applyTemplateVariables(subject, variables);
            String content = createSalaryApprovalEmailContent(consultantName, period, approvedAmount);
            
            EmailRequest request = EmailRequest.builder()
                    .toEmail(toEmail)
                    .toName(consultantName)
                    .subject(subject)
                    .content(content)
                    .type("HTML")
                    .templateType("SALARY_APPROVAL")
                    .templateVariables(Map.of(
                        "consultantName", consultantName,
                        "period", period,
                        "approvedAmount", approvedAmount
                    ))
                    .build();
            
            EmailResponse response = sendEmail(request);
            return response.isSuccess();
            
        } catch (Exception e) {
            log.error("급여 승인 이메일 발송 실패: to={}, error={}", toEmail, e.getMessage(), e);
            return false;
        }
    }
    
    @Override
    public boolean sendSalaryPaymentEmail(String toEmail, String consultantName, 
                                        String period, String paidAmount, String payDate) {
        try {
            log.info("급여 지급 완료 이메일 발송: to={}, 상담사={}, 기간={}", toEmail, consultantName, period);
            
            Map<String, Object> variables = enrichTemplateVariables(new java.util.HashMap<>());
            String subject = String.format("[{{companyName}}] %s 급여 지급 완료 - %s", consultantName, period);
            subject = applyTemplateVariables(subject, variables);
            String content = createSalaryPaymentEmailContent(consultantName, period, paidAmount, payDate);
            
            EmailRequest request = EmailRequest.builder()
                    .toEmail(toEmail)
                    .toName(consultantName)
                    .subject(subject)
                    .content(content)
                    .type("HTML")
                    .templateType("SALARY_PAYMENT")
                    .templateVariables(Map.of(
                        "consultantName", consultantName,
                        "period", period,
                        "paidAmount", paidAmount,
                        "payDate", payDate
                    ))
                    .build();
            
            EmailResponse response = sendEmail(request);
            return response.isSuccess();
            
        } catch (Exception e) {
            log.error("급여 지급 완료 이메일 발송 실패: to={}, error={}", toEmail, e.getMessage(), e);
            return false;
        }
    }
    
    @Override
    public boolean sendTaxReportEmail(String toEmail, String consultantName, 
                                    String period, Map<String, Object> taxData, 
                                    String attachmentPath) {
        try {
            log.info("세금 내역서 이메일 발송: to={}, 상담사={}, 기간={}", toEmail, consultantName, period);
            
            Map<String, Object> variables = enrichTemplateVariables(taxData);
            String subject = String.format("[{{companyName}}] %s 세금 내역서 - %s", consultantName, period);
            subject = applyTemplateVariables(subject, variables);
            String content = createTaxReportEmailContent(consultantName, period, taxData);
            
            EmailRequest request = EmailRequest.builder()
                    .toEmail(toEmail)
                    .toName(consultantName)
                    .subject(subject)
                    .content(content)
                    .type("HTML")
                    .templateType("TAX_REPORT")
                    .templateVariables(Map.of(
                        "consultantName", consultantName,
                        "period", period,
                        "taxData", taxData
                    ))
                    .attachments(attachmentPath != null ? List.of(attachmentPath) : null)
                    .build();
            
            EmailResponse response = sendEmail(request);
            return response.isSuccess();
            
        } catch (Exception e) {
            log.error("세금 내역서 이메일 발송 실패: to={}, error={}", toEmail, e.getMessage(), e);
            return false;
        }
    }
    
    @Override
    public String getEmailTemplate(String templateType) {
        return switch (templateType) {
            case "SALARY_CALCULATION" -> getSalaryCalculationTemplate();
            case "SALARY_APPROVAL" -> getSalaryApprovalTemplate();
            case "SALARY_PAYMENT" -> getSalaryPaymentTemplate();
            case "TAX_REPORT" -> getTaxReportTemplate();
            default -> getSystemNotificationTemplate();
        };
    }
    
    // ==================== 급여 이메일 템플릿 ====================
    
    private String createSalaryCalculationEmailContent(String consultantName, String period, Map<String, Object> salaryData) {
        String template = getSalaryCalculationTemplate();
        
        return template
                .replace("{{consultantName}}", consultantName)
                .replace("{{period}}", period)
                .replace("{{baseSalary}}", formatAmount(salaryData.get("baseSalary")))
                .replace("{{optionSalary}}", formatAmount(salaryData.get("optionSalary")))
                .replace("{{totalSalary}}", formatAmount(salaryData.get("totalSalary")))
                .replace("{{taxAmount}}", formatAmount(salaryData.get("taxAmount")))
                .replace("{{netSalary}}", formatAmount(salaryData.get("netSalary")))
                .replace("{{consultationCount}}", String.valueOf(salaryData.get("consultationCount")))
                .replace("{{supportEmail}}", EmailConstants.SUPPORT_EMAIL);
    }
    
    private String createSalaryApprovalEmailContent(String consultantName, String period, String approvedAmount) {
        String template = getSalaryApprovalTemplate();
        
        return template
                .replace("{{consultantName}}", consultantName)
                .replace("{{period}}", period)
                .replace("{{approvedAmount}}", approvedAmount)
                .replace("{{supportEmail}}", EmailConstants.SUPPORT_EMAIL);
    }
    
    private String createSalaryPaymentEmailContent(String consultantName, String period, String paidAmount, String payDate) {
        String template = getSalaryPaymentTemplate();
        
        return template
                .replace("{{consultantName}}", consultantName)
                .replace("{{period}}", period)
                .replace("{{paidAmount}}", paidAmount)
                .replace("{{payDate}}", payDate)
                .replace("{{supportEmail}}", EmailConstants.SUPPORT_EMAIL);
    }
    
    private String createTaxReportEmailContent(String consultantName, String period, Map<String, Object> taxData) {
        String template = getTaxReportTemplate();
        
        return template
                .replace("{{consultantName}}", consultantName)
                .replace("{{period}}", period)
                .replace("{{totalTaxAmount}}", formatAmount(taxData.get("totalTaxAmount")))
                .replace("{{supportEmail}}", EmailConstants.SUPPORT_EMAIL);
    }
    
    private String getSalaryCalculationTemplate() {
        String content = """
            <h2 style="margin: 0 0 16px 0; color: #111111; font-size: 20px; font-weight: bold; line-height: 1.5;">
                안녕하세요, {{consultantName}}님
            </h2>
            <p style="margin: 0 0 12px 0; color: #444444; font-size: 16px; line-height: 1.6;">
                {{period}} 급여 계산이 완료되었습니다.
            </p>
            
            <div style="background-color: #FAF9F7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #3D5246; margin: 0 0 12px 0; font-size: 16px;">급여 내역</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #444444;">
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #EAEAEA;"><strong>기본 급여:</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #EAEAEA; text-align: right;">{{baseSalary}}원</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #EAEAEA;"><strong>옵션 급여:</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #EAEAEA; text-align: right;">{{optionSalary}}원</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #EAEAEA;"><strong>총 급여 (세전):</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #EAEAEA; text-align: right;">{{totalSalary}}원</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #EAEAEA;"><strong>세금:</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #EAEAEA; text-align: right; color: #D32F2F;">-{{taxAmount}}원</td>
                    </tr>
                    <tr style="background-color: #F2EDE8;">
                        <td style="padding: 8px; border-bottom: 1px solid #EAEAEA;"><strong>실지급액 (세후):</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #EAEAEA; text-align: right; color: #3D5246; font-weight: bold;">{{netSalary}}원</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px;"><strong>상담 건수:</strong></td>
                        <td style="padding: 8px; text-align: right;">{{consultationCount}}건</td>
                    </tr>
                </table>
            </div>
            """;
        return getBaseTemplate()
                .replace("{{title}}", "급여 계산서")
                .replace("{{content}}", content);
    }
    
    private String getSalaryApprovalTemplate() {
        String content = """
            <h2 style="margin: 0 0 16px 0; color: #111111; font-size: 20px; font-weight: bold; line-height: 1.5;">
                안녕하세요, {{consultantName}}님
            </h2>
            <p style="margin: 0 0 12px 0; color: #444444; font-size: 16px; line-height: 1.6;">
                {{period}} 급여가 승인되었습니다.
            </p>
            
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                <tr>
                    <td style="background-color: #FAF9F7; padding: 20px; border-radius: 8px; text-align: center;">
                        <h3 style="color: #3D5246; margin: 0 0 8px 0; font-size: 15px;">승인된 급여</h3>
                        <p style="margin: 0; color: #3D5246; font-size: 24px; font-weight: bold;">{{approvedAmount}}원</p>
                    </td>
                </tr>
            </table>
            """;
        return getBaseTemplate()
                .replace("{{title}}", "급여 승인 완료")
                .replace("{{content}}", content);
    }
    
    private String getSalaryPaymentTemplate() {
        String content = """
            <h2 style="margin: 0 0 16px 0; color: #111111; font-size: 20px; font-weight: bold; line-height: 1.5;">
                안녕하세요, {{consultantName}}님
            </h2>
            <p style="margin: 0 0 12px 0; color: #444444; font-size: 16px; line-height: 1.6;">
                {{period}} 급여가 지급되었습니다.
            </p>
            
            <div style="background-color: #FAF9F7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #3D5246; margin: 0 0 12px 0; font-size: 16px;">지급 정보</h3>
                <p style="margin: 0 0 8px 0; color: #444444; font-size: 14px;"><strong>지급 금액:</strong> {{paidAmount}}원</p>
                <p style="margin: 0; color: #444444; font-size: 14px;"><strong>지급일:</strong> {{payDate}}</p>
            </div>
            """;
        return getBaseTemplate()
                .replace("{{title}}", "급여 지급 완료")
                .replace("{{content}}", content);
    }
    
    private String getTaxReportTemplate() {
        String content = """
            <h2 style="margin: 0 0 16px 0; color: #111111; font-size: 20px; font-weight: bold; line-height: 1.5;">
                안녕하세요, {{consultantName}}님
            </h2>
            <p style="margin: 0 0 12px 0; color: #444444; font-size: 16px; line-height: 1.6;">
                {{period}} 세금 내역서를 발송해드립니다.
            </p>
            
            <div style="background-color: #FAF9F7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #3D5246; margin: 0 0 12px 0; font-size: 16px;">세금 요약</h3>
                <p style="margin: 0; color: #444444; font-size: 14px;"><strong>총 세금:</strong> {{totalTaxAmount}}원</p>
            </div>
            """;
        return getBaseTemplate()
                .replace("{{title}}", "세금 내역서")
                .replace("{{content}}", content);
    }

        private String formatAmount(Object amount) {
        if (amount == null) return "0";
        try {
            return String.format("%,d", Long.parseLong(amount.toString()));
        } catch (NumberFormatException e) {
            return amount.toString();
        }
    }
}
