package com.coresolution.consultation.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.coresolution.consultation.constant.ClientEventSource;
import com.coresolution.consultation.constant.ClientEventType;

import lombok.Builder;
import lombok.Getter;

/**
 * {@code client_event} 기록용 커맨드 (서비스 계층 · HTTP 요청 아님).
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@Getter
@Builder
public class ClientEventRecordCommand {

    private final String tenantId;
    private final Long clientId;
    private final ClientEventType eventType;
    private final LocalDateTime occurredAt;
    private final Long actorUserId;
    private final String actorRole;
    private final ClientEventSource source;
    private final String reason;
    private final String beforeJson;
    private final String afterJson;
    private final Long scheduleId;
    private final Long mappingId;
    private final Long paymentId;
    private final String erpTransactionId;
    private final Integer sessionsRemainingBefore;
    private final Integer sessionsRemainingAfter;
    private final Integer sessionsUsedBefore;
    private final Integer sessionsUsedAfter;
    private final BigDecimal amount;
    private final String currency;
    private final String idempotencyKey;
}
