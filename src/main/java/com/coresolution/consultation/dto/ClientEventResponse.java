package com.coresolution.consultation.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.coresolution.consultation.constant.ClientEventSource;
import com.coresolution.consultation.constant.ClientEventType;
import com.coresolution.consultation.entity.ClientEvent;

import lombok.Builder;
import lombok.Getter;

/**
 * 내담자 관리용 타임라인 이벤트 응답.
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@Getter
@Builder
public class ClientEventResponse {

    private final Long id;
    private final Long clientId;
    private final String eventType;
    private final LocalDateTime occurredAt;
    private final Long actorUserId;
    private final String actorRole;
    private final String source;
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
    private final LocalDateTime createdAt;

    /**
     * 엔티티 → 응답 DTO.
     *
     * @param entity 이벤트 엔티티
     * @return 응답 DTO
     */
    public static ClientEventResponse fromEntity(ClientEvent entity) {
        ClientEventType eventType = entity.getEventType();
        ClientEventSource source = entity.getSource();
        return ClientEventResponse.builder()
                .id(entity.getId())
                .clientId(entity.getClientId())
                .eventType(eventType != null ? eventType.getCode() : null)
                .occurredAt(entity.getOccurredAt())
                .actorUserId(entity.getActorUserId())
                .actorRole(entity.getActorRole())
                .source(source != null ? source.getCode() : null)
                .reason(entity.getReason())
                .beforeJson(entity.getBeforeJson())
                .afterJson(entity.getAfterJson())
                .scheduleId(entity.getScheduleId())
                .mappingId(entity.getMappingId())
                .paymentId(entity.getPaymentId())
                .erpTransactionId(entity.getErpTransactionId())
                .sessionsRemainingBefore(entity.getSessionsRemainingBefore())
                .sessionsRemainingAfter(entity.getSessionsRemainingAfter())
                .sessionsUsedBefore(entity.getSessionsUsedBefore())
                .sessionsUsedAfter(entity.getSessionsUsedAfter())
                .amount(entity.getAmount())
                .currency(entity.getCurrency())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
