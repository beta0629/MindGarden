package com.coresolution.consultation.service;

import java.util.function.Consumer;
import com.coresolution.consultation.config.TemporaryPasswordProperties;
import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.dto.CredentialSmsResult;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.util.PhoneLogMasking;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.repository.TenantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 임시 비밀번호를 문자로만 알린다. 알림톡은 사용하지 않는다.
 *
 * @author MindGarden
 * @since 2026-10-14
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ClientCredentialNotificationService {

    public static final String REASON_PHONE_MISSING = "PHONE_MISSING";
    public static final String REASON_TEMPLATE_MISSING = "TEMPLATE_MISSING";
    public static final String REASON_SEND_FAILED = "SMS_SEND_FAILED";

    private static final String TOKEN_CENTER = "{centerName}";
    private static final String TOKEN_LOGIN_ID = "{loginId}";
    private static final String TOKEN_PASSWORD = "{tempPassword}";
    private static final String TOKEN_LOGIN_URL = "{loginUrl}";
    private static final String ENTITY_USER = "USER";

    private final TemporaryPasswordProperties temporaryPasswordProperties;
    private final SmsAuthService smsAuthService;
    private final TenantRepository tenantRepository;
    private final AuditLogService auditLogService;

    /**
     * 트랜잭션이 있으면 커밋 뒤에 발송하고, 없으면 바로 발송한다.
     * 결과는 {@code sink} 로만 전달한다.
     */
    public void deliverAfterCommit(Consumer<CredentialSmsResult> sink, String phone, String loginId,
            String tempPassword, String tenantId, Long userId) {
        Runnable job = () -> {
            CredentialSmsResult result = deliver(phone, loginId, tempPassword, tenantId, userId);
            if (sink != null) {
                sink.accept(result);
            }
        };
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    job.run();
                }
            });
            return;
        }
        job.run();
    }

    /**
     * @return 발송 결과. 비밀번호·본문은 반환하지 않는다.
     */
    public CredentialSmsResult deliver(String phone, String loginId, String tempPassword,
            String tenantId, Long userId) {
        CredentialSmsResult result = new CredentialSmsResult();
        String templateKey = temporaryPasswordProperties.getSmsTemplateKey();
        String maskedPhone = PhoneLogMasking.maskForLog(phone);
        try {
            if (phone == null || phone.isBlank()) {
                result.setSmsSent(false);
                result.setSkipReason(REASON_PHONE_MISSING);
                return result;
            }
            String template = temporaryPasswordProperties.getSmsTemplate();
            if (template == null || template.isBlank()) {
                result.setSmsSent(false);
                result.setSkipReason(REASON_TEMPLATE_MISSING);
                return result;
            }
            String message = render(template, centerName(tenantId), loginId, tempPassword,
                    temporaryPasswordProperties.getLoginUrl());
            boolean sent = smsAuthService.sendConfidentialNotificationMessage(phone, message);
            result.setSmsSent(sent);
            if (!sent) {
                result.setSkipReason(REASON_SEND_FAILED);
            }
            return result;
        } catch (RuntimeException ex) {
            log.warn("임시 비밀번호 문자 발송 실패: userId={}, errorType={}",
                    userId, ex.getClass().getSimpleName());
            result.setSmsSent(false);
            result.setSkipReason(REASON_SEND_FAILED);
            return result;
        } finally {
            log.info("임시 비밀번호 문자 처리: templateKey={}, phone={}, bodyLength={}, smsSent={}, reason={}",
                    templateKey,
                    maskedPhone,
                    bodyLength(temporaryPasswordProperties.getSmsTemplate(), tempPassword),
                    result.isSmsSent(),
                    result.getSkipReason());
            recordAudit(tenantId, userId, templateKey, maskedPhone, result);
        }
    }

    private static int bodyLength(String template, String tempPassword) {
        if (template == null) {
            return 0;
        }
        int passwordLength = tempPassword == null ? 0 : tempPassword.length();
        return template.length() + passwordLength;
    }

    private String render(String template, String centerName, String loginId, String tempPassword, String loginUrl) {
        return template
                .replace(TOKEN_CENTER, centerName == null ? "" : centerName)
                .replace(TOKEN_LOGIN_ID, loginId == null ? "" : loginId)
                .replace(TOKEN_PASSWORD, tempPassword == null ? "" : tempPassword)
                .replace(TOKEN_LOGIN_URL, loginUrl == null ? "" : loginUrl);
    }

    private String centerName(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            return "";
        }
        return tenantRepository.findByTenantId(tenantId).map(Tenant::getName).orElse("");
    }

    private void recordAudit(String tenantId, Long userId, String templateKey, String maskedPhone,
            CredentialSmsResult result) {
        if (tenantId == null || tenantId.isBlank()) {
            return;
        }
        try {
            String metadata = "{\"templateKey\":\"" + safe(templateKey)
                    + "\",\"maskedPhone\":\"" + safe(maskedPhone)
                    + "\",\"smsSent\":" + result.isSmsSent()
                    + ",\"reason\":\"" + safe(result.getSkipReason()) + "\"}";
            auditLogService.record(AuditLog.builder()
                    .tenantId(tenantId)
                    .targetUserId(userId)
                    .action(AuditAction.TEMP_PASSWORD_SMS)
                    .entityType(ENTITY_USER)
                    .entityId(userId)
                    .metadataJson(metadata)
                    .build());
        } catch (RuntimeException ex) {
            log.warn("임시 비밀번호 문자 감사 기록 실패: userId={}, errorType={}",
                    userId, ex.getClass().getSimpleName());
        }
    }

    private static String safe(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\\", "").replace("\"", "");
    }
}
