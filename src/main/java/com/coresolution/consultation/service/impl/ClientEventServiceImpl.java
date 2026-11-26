package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.dto.ClientEventRecordCommand;
import com.coresolution.consultation.dto.ClientEventResponse;
import com.coresolution.consultation.entity.ClientEvent;
import com.coresolution.consultation.repository.ClientEventRepository;
import com.coresolution.consultation.service.ClientEventService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * {@link ClientEventService} 구현 — 조회 + 기록 스켈레톤(멱등).
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ClientEventServiceImpl implements ClientEventService {

    private final ClientEventRepository clientEventRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<ClientEventResponse> findTimeline(String tenantId, Long clientId, Pageable pageable) {
        requireTenantId(tenantId);
        requireClientId(clientId);
        return clientEventRepository
                .findByTenantIdAndClientId(tenantId, clientId, pageable)
                .map(ClientEventResponse::fromEntity);
    }

    @Override
    @Transactional
    public ClientEvent record(ClientEventRecordCommand command) {
        if (command == null) {
            throw new IllegalArgumentException("ClientEventRecordCommand is required");
        }
        requireTenantId(command.getTenantId());
        requireClientId(command.getClientId());
        if (command.getEventType() == null) {
            throw new IllegalArgumentException("eventType is required");
        }
        if (command.getSource() == null) {
            throw new IllegalArgumentException("source is required");
        }
        if (command.getOccurredAt() == null) {
            throw new IllegalArgumentException("occurredAt is required");
        }

        String idempotencyKey = trimToNull(command.getIdempotencyKey());
        if (idempotencyKey != null) {
            return clientEventRepository
                    .findByTenantIdAndIdempotencyKey(command.getTenantId(), idempotencyKey)
                    .orElseGet(() -> saveNew(command, idempotencyKey));
        }
        return saveNew(command, null);
    }

    private ClientEvent saveNew(ClientEventRecordCommand command, String idempotencyKey) {
        ClientEvent entry = ClientEvent.builder()
                .tenantId(command.getTenantId())
                .clientId(command.getClientId())
                .eventType(command.getEventType())
                .occurredAt(command.getOccurredAt())
                .actorUserId(command.getActorUserId())
                .actorRole(command.getActorRole())
                .source(command.getSource())
                .reason(command.getReason())
                .beforeJson(command.getBeforeJson())
                .afterJson(command.getAfterJson())
                .scheduleId(command.getScheduleId())
                .mappingId(command.getMappingId())
                .paymentId(command.getPaymentId())
                .erpTransactionId(command.getErpTransactionId())
                .sessionsRemainingBefore(command.getSessionsRemainingBefore())
                .sessionsRemainingAfter(command.getSessionsRemainingAfter())
                .sessionsUsedBefore(command.getSessionsUsedBefore())
                .sessionsUsedAfter(command.getSessionsUsedAfter())
                .amount(command.getAmount())
                .currency(command.getCurrency())
                .idempotencyKey(idempotencyKey)
                .build();
        ClientEvent saved = clientEventRepository.save(entry);
        log.info(
                "client_event recorded: tenantId={}, clientId={}, eventType={}, id={}",
                saved.getTenantId(),
                saved.getClientId(),
                saved.getEventType(),
                saved.getId());
        return saved;
    }

    private static void requireTenantId(String tenantId) {
        if (!StringUtils.hasText(tenantId)) {
            throw new IllegalArgumentException("tenantId는 필수입니다.");
        }
    }

    private static void requireClientId(Long clientId) {
        if (clientId == null) {
            throw new IllegalArgumentException("clientId는 필수입니다.");
        }
    }

    private static String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }
}
