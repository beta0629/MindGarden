package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import com.coresolution.consultation.entity.NotificationBatchSendLog;
import com.coresolution.consultation.repository.NotificationBatchSendLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * {@code notification_batch_send_log} 멱등성 로그 기록기.
 *
 * <p>모든 메서드는 {@link Propagation#REQUIRES_NEW} 로 별도 트랜잭션을 사용한다 —
 * 발송 실패·외부 호출 롤백·UNIQUE 키 충돌 시에도 멱등 로그는 반드시 보존된다.
 *
 * @author MindGarden
 * @since 2026-05-23
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationBatchSendLogger {

    private final NotificationBatchSendLogRepository repository;

    /**
     * 발송 직전 로그 행 INSERT (success=false 초기값).
     *
     * <p>UNIQUE 키 충돌 ({@code DataIntegrityViolationException}) 은 멱등 skip 으로 해석하여
     * {@code null} 을 반환한다. 호출자는 null 응답을 발송 skip 신호로 해석한다.
     *
     * @param tenantId             테넌트 ID
     * @param templateCode         템플릿 코드
     * @param targetType           대상 타입 (SCHEDULE/MAPPING/USER)
     * @param targetId             대상 엔티티 PK
     * @param recipientUserId      수신자 users.id
     * @param recipientPhoneMasked 마스킹된 전화번호
     * @return 저장된 로그 또는 {@code null} (멱등 충돌)
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public NotificationBatchSendLog logAttempt(String tenantId, String templateCode,
            String targetType, Long targetId, Long recipientUserId, String recipientPhoneMasked) {
        NotificationBatchSendLog entity = NotificationBatchSendLog.builder()
            .templateCode(templateCode)
            .targetType(targetType)
            .targetId(targetId)
            .recipientUserId(recipientUserId)
            .recipientPhoneMasked(recipientPhoneMasked)
            .channelUsed("PENDING")
            .fallbackToSms(Boolean.FALSE)
            .success(Boolean.FALSE)
            .sentAt(LocalDateTime.now())
            .build();
        entity.setTenantId(tenantId);
        try {
            return repository.saveAndFlush(entity);
        } catch (DataIntegrityViolationException e) {
            log.info("멱등성 로그 UNIQUE 충돌 — skip: tenantId={}, templateCode={}, targetType={}, targetId={}, recipientUserId={}",
                tenantId, templateCode, targetType, targetId, recipientUserId);
            return null;
        }
    }

    /**
     * 발송 결과를 로그 행에 반영한다(별도 트랜잭션).
     *
     * @param logId           로그 PK
     * @param success         성공 여부
     * @param channelUsed     최종 발송 채널 ({@code ALIMTALK}/{@code SMS})
     * @param fallbackToSms   알림톡 실패 → SMS 폴백 여부
     * @param errorCode       에러 코드
     * @param errorMessage    에러 메시지
     * @param solapiGroupId   솔라피 groupId
     * @param solapiMessageId 솔라피 messageId
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updateResult(Long logId, boolean success, String channelUsed,
            boolean fallbackToSms, String errorCode, String errorMessage,
            String solapiGroupId, String solapiMessageId) {
        repository.findById(logId).ifPresent(entity -> {
            entity.setSuccess(success);
            entity.setChannelUsed(channelUsed);
            entity.setFallbackToSms(fallbackToSms);
            entity.setErrorCode(errorCode);
            entity.setErrorMessage(truncate(errorMessage, 1000));
            entity.setSolapiGroupId(solapiGroupId);
            entity.setSolapiMessageId(solapiMessageId);
            repository.save(entity);
        });
    }

    private String truncate(String value, int max) {
        if (value == null || value.length() <= max) {
            return value;
        }
        return value.substring(0, max);
    }
}
