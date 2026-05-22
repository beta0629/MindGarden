package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.Map;
import com.coresolution.consultation.dto.TestNotificationChannel;
import com.coresolution.consultation.dto.TestNotificationRecipientMode;
import com.coresolution.consultation.entity.AdminTestNotificationLog;
import com.coresolution.consultation.repository.AdminTestNotificationLogRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 어드민 테스트 발송 감사로그 기록기.
 *
 * <p>모든 메서드는 {@link Propagation#REQUIRES_NEW}로 별도 트랜잭션을 사용한다 —
 * 발송 실패·외부 호출 롤백 시에도 감사로그는 반드시 보존된다(기획서 §7 — 감사로그 누락 완화).
 *
 * @author MindGarden
 * @since 2026-05-22
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminTestNotificationLogger {

    private final AdminTestNotificationLogRepository repository;
    private final ObjectMapper objectMapper;

    /**
     * 발송 직전 로그 행 INSERT (success=false 초기값) — 단일 발송 도구 호환 오버로드.
     *
     * <p>{@code batchId=null}로 위임한다. 신규 호출자(수동 다중 발송)는
     * {@link #logAttempt(String, Long, String, TestNotificationRecipientMode, Long, String,
     * TestNotificationChannel, String, java.util.Map, String, String, String)}를 사용한다.
     *
     * @param tenantId          테넌트 ID
     * @param sentByUserId      발송자 PK
     * @param sentByUsername    발송자 로그인 ID
     * @param recipientMode     수신자 모드
     * @param recipientUserId   수신 사용자 PK(SELF인 경우 본인)
     * @param recipientPhoneMasked 마스킹된 전화번호
     * @param channel           채널
     * @param templateCode      알림톡 템플릿 코드(SMS는 null)
     * @param templateParams    템플릿 변수(SMS는 null)
     * @param messageContent    SMS 본문(알림톡은 null)
     * @param reason            발송 사유
     * @return 저장된 로그 행
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AdminTestNotificationLog logAttempt(String tenantId, Long sentByUserId, String sentByUsername,
            TestNotificationRecipientMode recipientMode, Long recipientUserId,
            String recipientPhoneMasked, TestNotificationChannel channel,
            String templateCode, Map<String, String> templateParams, String messageContent,
            String reason) {
        return logAttempt(tenantId, sentByUserId, sentByUsername, recipientMode, recipientUserId,
            recipientPhoneMasked, channel, templateCode, templateParams, messageContent, reason, null);
    }

    /**
     * 발송 직전 로그 행 INSERT (success=false 초기값) — {@code batchId} 포함.
     *
     * <p>수동 다중 발송({@code AdminManualNotificationService}) 에서 같은 배치의 모든 수신자 행에
     * 동일한 UUID 를 부여하기 위해 사용한다. 단일 발송 도구는 {@code batchId=null} 로 둔다.
     *
     * @param tenantId          테넌트 ID
     * @param sentByUserId      발송자 PK
     * @param sentByUsername    발송자 로그인 ID
     * @param recipientMode     수신자 모드
     * @param recipientUserId   수신 사용자 PK
     * @param recipientPhoneMasked 마스킹된 전화번호
     * @param channel           채널
     * @param templateCode      알림톡 템플릿 코드(SMS는 null)
     * @param templateParams    템플릿 변수(SMS는 null)
     * @param messageContent    SMS 본문(알림톡은 null)
     * @param reason            발송 사유
     * @param batchId           수동 발송 배치 ID(UUID). 단일 발송은 null
     * @return 저장된 로그 행
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AdminTestNotificationLog logAttempt(String tenantId, Long sentByUserId, String sentByUsername,
            TestNotificationRecipientMode recipientMode, Long recipientUserId,
            String recipientPhoneMasked, TestNotificationChannel channel,
            String templateCode, Map<String, String> templateParams, String messageContent,
            String reason, String batchId) {
        AdminTestNotificationLog entity = AdminTestNotificationLog.builder()
            .sentByUserId(sentByUserId)
            .sentByUsername(sentByUsername)
            .sentAt(LocalDateTime.now())
            .recipientMode(recipientMode)
            .recipientUserId(recipientUserId)
            .recipientPhoneMasked(recipientPhoneMasked)
            .channel(channel)
            .templateCode(templateCode)
            .templateParams(serializeParams(templateParams))
            .messageContent(messageContent)
            .reason(reason)
            .batchId(batchId)
            .success(Boolean.FALSE)
            .build();
        entity.setTenantId(tenantId);
        return repository.save(entity);
    }

    /**
     * 발송 결과를 로그 행에 반영한다(별도 트랜잭션).
     *
     * @param logId         로그 PK
     * @param success       성공 여부
     * @param solapiGroupId 솔라피 groupId
     * @param solapiMessageId 솔라피 messageId
     * @param errorCode     에러 코드
     * @param errorMessage  에러 메시지
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updateResult(Long logId, boolean success, String solapiGroupId, String solapiMessageId,
            String errorCode, String errorMessage) {
        repository.findById(logId).ifPresent(entity -> {
            entity.setSuccess(success);
            entity.setSolapiGroupId(solapiGroupId);
            entity.setSolapiMessageId(solapiMessageId);
            entity.setErrorCode(errorCode);
            entity.setErrorMessage(truncate(errorMessage, 1000));
            repository.save(entity);
        });
    }

    private String serializeParams(Map<String, String> params) {
        if (params == null || params.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(params);
        } catch (JsonProcessingException e) {
            log.warn("템플릿 파라미터 JSON 직렬화 실패 (로그 미보존): {}", e.getMessage());
            return null;
        }
    }

    private String truncate(String value, int max) {
        if (value == null || value.length() <= max) {
            return value;
        }
        return value.substring(0, max);
    }
}
