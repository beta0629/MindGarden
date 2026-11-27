package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import com.coresolution.consultation.constant.ClientEventBackfillConstants;
import com.coresolution.consultation.constant.ClientEventBackfillMode;
import com.coresolution.consultation.constant.ClientEventIdempotencyKeys;
import com.coresolution.consultation.constant.ClientEventSource;
import com.coresolution.consultation.constant.ClientEventType;
import com.coresolution.consultation.constant.ClientEventWriteConstants;
import com.coresolution.consultation.constant.MappingHistoryEventType;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.dto.ClientEventBackfillResult;
import com.coresolution.consultation.dto.ClientEventRecordCommand;
import com.coresolution.consultation.entity.ClientEvent;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMappingHistory;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ClientEventRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingHistoryRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.ClientEventBackfillService;
import com.coresolution.consultation.service.ClientEventService;
import com.coresolution.core.context.TenantContextHolder;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * {@link ClientEventBackfillService} 구현 — 테넌트 필수 백필(멱등).
 *
 * <p>순서: 배정 생성 → 결제 완료 → 일정 → 회기/배정 이력 → 결제 취소·환불.
 * dry-run 은 {@link ClientEventService#record} 를 호출하지 않는다.
 * .dev HTTP 환경 가드는 Controller 전용 — 본 구현은 CLI(운영)에서도 동작한다.</p>
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ClientEventBackfillServiceImpl implements ClientEventBackfillService {

    private final ClientEventService clientEventService;
    private final ClientEventRepository clientEventRepository;
    private final ConsultantClientMappingRepository mappingRepository;
    private final PaymentRepository paymentRepository;
    private final ScheduleRepository scheduleRepository;
    private final ConsultantClientMappingHistoryRepository historyRepository;
    private final ObjectMapper objectMapper;

    @Override
    public ClientEventBackfillResult dryRun(String tenantId) {
        return run(ClientEventBackfillMode.DRY_RUN, tenantId);
    }

    @Override
    public ClientEventBackfillResult apply(String tenantId) {
        return run(ClientEventBackfillMode.APPLY, tenantId);
    }

    @Override
    public ClientEventBackfillResult run(ClientEventBackfillMode mode, String tenantId) {
        requireTenantId(tenantId);
        ClientEventBackfillMode resolvedMode =
                mode != null ? mode : ClientEventBackfillMode.DRY_RUN;
        if (resolvedMode == ClientEventBackfillMode.ROLLBACK) {
            throw new IllegalArgumentException(
                    "ROLLBACK 모드는 rollback(tenantId, dryRun) 을 사용하세요.");
        }
        return runForTenant(resolvedMode, tenantId.trim());
    }

    @Override
    @Transactional
    public ClientEventBackfillResult rollback(String tenantId, boolean dryRun) {
        requireTenantId(tenantId);
        String scoped = tenantId.trim();
        String previousTenantId = TenantContextHolder.peekTenantId();
        try {
            TenantContextHolder.setTenantId(scoped);
            ClientEventBackfillMode mode = dryRun
                    ? ClientEventBackfillMode.DRY_RUN
                    : ClientEventBackfillMode.ROLLBACK;
            ClientEventBackfillResult result = ClientEventBackfillResult.empty(mode, scoped);

            List<ClientEvent> candidates =
                    clientEventRepository.findByTenantIdAndSource(scoped, ClientEventSource.BACKFILLED);
            List<Long> deleteIds = new ArrayList<>();
            Set<Long> clients = new HashSet<>();
            for (ClientEvent event : candidates) {
                if (event == null || event.getId() == null) {
                    continue;
                }
                result.setScanned(result.getScanned() + 1);
                if (!ClientEventIdempotencyKeys.isRollbackEligibleKey(
                        event.getIdempotencyKey(), scoped)) {
                    result.setSkipped(result.getSkipped() + 1);
                    continue;
                }
                if (event.getClientId() != null) {
                    clients.add(event.getClientId());
                }
                String typeCode = event.getEventType() != null
                        ? event.getEventType().getCode()
                        : "UNKNOWN";
                result.incrementInserted(typeCode);
                deleteIds.add(event.getId());
            }
            result.setClientCount(clients.size());

            if (!dryRun && !deleteIds.isEmpty()) {
                int deleted = clientEventRepository.deleteByTenantIdAndSourceAndIdIn(
                        scoped, ClientEventSource.BACKFILLED, deleteIds);
                log.info(
                        "client_event backfill rollback applied: tenantId={}, deleted={}",
                        scoped,
                        deleted);
            } else {
                log.info(
                        "client_event backfill rollback dry-run: tenantId={}, wouldDelete={}",
                        scoped,
                        deleteIds.size());
            }
            return result;
        } finally {
            restoreTenantContext(previousTenantId);
        }
    }

    @Transactional
    protected ClientEventBackfillResult runForTenant(ClientEventBackfillMode mode, String tenantId) {
        String previousTenantId = TenantContextHolder.peekTenantId();
        try {
            TenantContextHolder.setTenantId(tenantId);
            ClientEventBackfillResult result = ClientEventBackfillResult.empty(mode, tenantId);
            Set<Long> clients = new HashSet<>();
            backfillMappings(mode, tenantId, result, clients);
            backfillPaymentsCompleted(mode, tenantId, result, clients);
            backfillSchedules(mode, tenantId, result, clients);
            backfillHistories(mode, tenantId, result, clients);
            backfillPaymentsCancelledOrRefunded(mode, tenantId, result, clients);
            result.setClientCount(clients.size());
            log.info(
                    "client_event backfill: tenantId={}, mode={}, scanned={}, inserted={}, skipped={},"
                            + " errors={}, clientCount={}, byEventType={}",
                    tenantId,
                    mode,
                    result.getScanned(),
                    result.getInserted(),
                    result.getSkipped(),
                    result.getErrors(),
                    result.getClientCount(),
                    result.getByEventType());
            return result;
        } finally {
            restoreTenantContext(previousTenantId);
        }
    }

    private void backfillMappings(
            ClientEventBackfillMode mode,
            String tenantId,
            ClientEventBackfillResult result,
            Set<Long> clients) {
        List<ConsultantClientMapping> mappings = mappingRepository.findByTenantId(tenantId);
        for (ConsultantClientMapping mapping : mappings) {
            if (mapping == null || mapping.getId() == null) {
                continue;
            }
            result.setScanned(result.getScanned() + 1);
            try {
                Long clientId = resolveMappingClientId(mapping);
                if (clientId == null) {
                    result.setErrors(result.getErrors() + 1);
                    continue;
                }
                clients.add(clientId);
                String key = ClientEventBackfillConstants.idempotencyMappingCreated(
                        tenantId, mapping.getId());
                ClientEventRecordCommand command = ClientEventRecordCommand.builder()
                        .tenantId(tenantId)
                        .clientId(clientId)
                        .eventType(ClientEventType.MAPPING_CREATED)
                        .occurredAt(nullToNow(mapping.getCreatedAt()))
                        .actorUserId(null)
                        .actorRole(null)
                        .source(ClientEventSource.BACKFILLED)
                        .afterJson(toMappingSessionJson(mapping))
                        .mappingId(mapping.getId())
                        .sessionsRemainingAfter(mapping.getRemainingSessions())
                        .sessionsUsedAfter(mapping.getUsedSessions())
                        .idempotencyKey(key)
                        .build();
                accept(mode, tenantId, key, command, result);
            } catch (RuntimeException ex) {
                log.warn(
                        "client_event backfill mapping failed: tenantId={}, mappingId={}, reason={}",
                        tenantId,
                        mapping.getId(),
                        ex.getMessage());
                result.setErrors(result.getErrors() + 1);
            }
        }
    }

    private void backfillPaymentsCompleted(
            ClientEventBackfillMode mode,
            String tenantId,
            ClientEventBackfillResult result,
            Set<Long> clients) {
        backfillPayments(mode, tenantId, result, clients, true);
    }

    private void backfillPaymentsCancelledOrRefunded(
            ClientEventBackfillMode mode,
            String tenantId,
            ClientEventBackfillResult result,
            Set<Long> clients) {
        backfillPayments(mode, tenantId, result, clients, false);
    }

    /**
     * 결제 백필. {@code completedPhase=true} 이면 APPROVED 만,
     * false 이면 CANCELLED·REFUNDED 만 처리한다(타임라인 순서 유지).
     */
    private void backfillPayments(
            ClientEventBackfillMode mode,
            String tenantId,
            ClientEventBackfillResult result,
            Set<Long> clients,
            boolean completedPhase) {
        int page = 0;
        Page<Payment> paymentPage;
        do {
            paymentPage = paymentRepository.findByTenantIdAndIsDeletedFalse(
                    tenantId,
                    PageRequest.of(
                            page,
                            ClientEventBackfillConstants.PAYMENT_PAGE_SIZE,
                            Sort.by(Sort.Order.asc("createdAt"), Sort.Order.asc("id"))));
            for (Payment payment : paymentPage.getContent()) {
                if (payment == null || payment.getId() == null || payment.getStatus() == null) {
                    continue;
                }
                ClientEventType eventType = resolvePaymentEventType(payment.getStatus(), completedPhase);
                if (eventType == null) {
                    continue;
                }
                result.setScanned(result.getScanned() + 1);
                try {
                    if (payment.getPayerId() == null) {
                        result.setErrors(result.getErrors() + 1);
                        continue;
                    }
                    clients.add(payment.getPayerId());
                    String key = ClientEventIdempotencyKeys.forPayment(
                            eventType, tenantId, payment.getId());
                    LocalDateTime occurredAt = resolvePaymentOccurredAt(payment, eventType);
                    Map<String, Object> after = new LinkedHashMap<>();
                    after.put(
                            ClientEventWriteConstants.JSON_KEY_PAYMENT_STATUS_CODE,
                            payment.getStatus().name());
                    after.put(ClientEventWriteConstants.JSON_KEY_AMOUNT, payment.getAmount());
                    ClientEventRecordCommand command = ClientEventRecordCommand.builder()
                            .tenantId(tenantId)
                            .clientId(payment.getPayerId())
                            .eventType(eventType)
                            .occurredAt(occurredAt)
                            .actorUserId(null)
                            .actorRole(null)
                            .source(ClientEventSource.BACKFILLED)
                            .afterJson(toJson(after))
                            .paymentId(payment.getId())
                            .amount(payment.getAmount())
                            .currency(ClientEventWriteConstants.CURRENCY_KRW)
                            .idempotencyKey(key)
                            .build();
                    accept(mode, tenantId, key, command, result);
                } catch (RuntimeException ex) {
                    log.warn(
                            "client_event backfill payment failed: tenantId={}, paymentId={}, phase={}, reason={}",
                            tenantId,
                            payment.getId(),
                            completedPhase ? "completed" : "cancel-refund",
                            ex.getMessage());
                    result.setErrors(result.getErrors() + 1);
                }
            }
            page++;
        } while (paymentPage.hasNext());
    }

    private static ClientEventType resolvePaymentEventType(
            Payment.PaymentStatus status, boolean completedPhase) {
        if (completedPhase) {
            return status == Payment.PaymentStatus.APPROVED
                    ? ClientEventType.PAYMENT_COMPLETED
                    : null;
        }
        if (status == Payment.PaymentStatus.CANCELLED) {
            return ClientEventType.PAYMENT_CANCELLED;
        }
        if (status == Payment.PaymentStatus.REFUNDED) {
            return ClientEventType.PAYMENT_REFUNDED;
        }
        return null;
    }

    private void backfillSchedules(
            ClientEventBackfillMode mode,
            String tenantId,
            ClientEventBackfillResult result,
            Set<Long> clients) {
        List<Schedule> schedules = scheduleRepository.findByTenantId(tenantId);
        for (Schedule schedule : schedules) {
            if (schedule == null || schedule.getId() == null) {
                continue;
            }
            ClientEventType eventType = resolveScheduleEventType(schedule);
            if (eventType == null) {
                continue;
            }
            result.setScanned(result.getScanned() + 1);
            try {
                if (schedule.getClientId() == null) {
                    result.setErrors(result.getErrors() + 1);
                    continue;
                }
                clients.add(schedule.getClientId());
                String key = ClientEventBackfillConstants.idempotencySchedule(
                        tenantId, eventType, schedule.getId());
                Map<String, Object> after = new LinkedHashMap<>();
                after.put(
                        ClientEventWriteConstants.JSON_KEY_STATUS,
                        schedule.getStatus() != null ? schedule.getStatus().name() : null);
                after.put(
                        ClientEventWriteConstants.JSON_KEY_DATE,
                        schedule.getDate() != null ? schedule.getDate().toString() : null);
                after.put(
                        ClientEventWriteConstants.JSON_KEY_START_TIME,
                        schedule.getStartTime() != null ? schedule.getStartTime().toString() : null);
                after.put(
                        ClientEventWriteConstants.JSON_KEY_END_TIME,
                        schedule.getEndTime() != null ? schedule.getEndTime().toString() : null);
                ClientEventRecordCommand command = ClientEventRecordCommand.builder()
                        .tenantId(tenantId)
                        .clientId(schedule.getClientId())
                        .eventType(eventType)
                        .occurredAt(nullToNow(schedule.getCreatedAt()))
                        .actorUserId(null)
                        .actorRole(null)
                        .source(ClientEventSource.BACKFILLED)
                        .afterJson(toJson(after))
                        .scheduleId(schedule.getId())
                        .mappingId(schedule.getMappingId())
                        .idempotencyKey(key)
                        .build();
                accept(mode, tenantId, key, command, result);
            } catch (RuntimeException ex) {
                log.warn(
                        "client_event backfill schedule failed: tenantId={}, scheduleId={}, reason={}",
                        tenantId,
                        schedule.getId(),
                        ex.getMessage());
                result.setErrors(result.getErrors() + 1);
            }
        }
    }

    private void backfillHistories(
            ClientEventBackfillMode mode,
            String tenantId,
            ClientEventBackfillResult result,
            Set<Long> clients) {
        List<ConsultantClientMappingHistory> histories =
                historyRepository.findByTenantIdOrderByCreatedAtAscIdAsc(tenantId);
        for (ConsultantClientMappingHistory history : histories) {
            if (history == null || history.getId() == null) {
                continue;
            }
            ClientEventType eventType = resolveHistoryEventType(history.getEventType());
            if (eventType == null) {
                continue;
            }
            result.setScanned(result.getScanned() + 1);
            try {
                Long clientId = history.getClientId();
                if (clientId == null) {
                    result.setErrors(result.getErrors() + 1);
                    continue;
                }
                clients.add(clientId);
                Long scheduleId = resolveHistoryScheduleId(history);
                Integer usedBefore = readInt(history.getBeforeStateJson(),
                        ClientEventBackfillConstants.JSON_KEY_USED_SESSIONS);
                Integer remBefore = readInt(history.getBeforeStateJson(),
                        ClientEventBackfillConstants.JSON_KEY_REMAINING_SESSIONS);
                Integer usedAfter = readInt(history.getAfterStateJson(),
                        ClientEventBackfillConstants.JSON_KEY_USED_SESSIONS);
                Integer remAfter = readInt(history.getAfterStateJson(),
                        ClientEventBackfillConstants.JSON_KEY_REMAINING_SESSIONS);
                String key = resolveHistoryIdempotencyKey(
                        tenantId,
                        eventType,
                        scheduleId,
                        history.getId(),
                        history.getMappingId(),
                        remBefore,
                        usedBefore,
                        remAfter,
                        usedAfter);
                ClientEventRecordCommand command = ClientEventRecordCommand.builder()
                        .tenantId(tenantId)
                        .clientId(clientId)
                        .eventType(eventType)
                        .occurredAt(nullToNow(history.getCreatedAt()))
                        .actorUserId(history.getTriggeredByUserId())
                        .actorRole(null)
                        .source(ClientEventSource.BACKFILLED)
                        .reason(history.getReason())
                        .beforeJson(history.getBeforeStateJson())
                        .afterJson(history.getAfterStateJson())
                        .scheduleId(scheduleId)
                        .mappingId(history.getMappingId())
                        .sessionsRemainingBefore(remBefore)
                        .sessionsRemainingAfter(remAfter)
                        .sessionsUsedBefore(usedBefore)
                        .sessionsUsedAfter(usedAfter)
                        .idempotencyKey(key)
                        .build();
                accept(mode, tenantId, key, command, result);
            } catch (RuntimeException ex) {
                log.warn(
                        "client_event backfill history failed: tenantId={}, historyId={}, reason={}",
                        tenantId,
                        history.getId(),
                        ex.getMessage());
                result.setErrors(result.getErrors() + 1);
            }
        }
    }

    private void accept(
            ClientEventBackfillMode mode,
            String tenantId,
            String idempotencyKey,
            ClientEventRecordCommand command,
            ClientEventBackfillResult result) {
        String typeCode = command.getEventType() != null
                ? command.getEventType().getCode()
                : "UNKNOWN";
        Optional<ClientEvent> existing =
                clientEventRepository.findByTenantIdAndIdempotencyKey(tenantId, idempotencyKey);
        if (existing.isPresent()) {
            result.incrementSkipped(typeCode);
            return;
        }
        if (mode == ClientEventBackfillMode.DRY_RUN) {
            result.incrementInserted(typeCode);
            return;
        }
        clientEventService.record(command);
        result.incrementInserted(typeCode);
    }

    private static String resolveHistoryIdempotencyKey(
            String tenantId,
            ClientEventType eventType,
            Long scheduleId,
            Long historyId,
            Long mappingId,
            Integer remBefore,
            Integer usedBefore,
            Integer remAfter,
            Integer usedAfter) {
        if (eventType == ClientEventType.SESSION_DEDUCTED
                || eventType == ClientEventType.SESSION_RESTORED
                || eventType == ClientEventType.MAPPING_REASSIGNED) {
            return ClientEventIdempotencyKeys.forSession(
                    eventType, tenantId, scheduleId, historyId);
        }
        // live SESSION_ADJUSTED 와 동일 fingerprint (세션 before/after + mappingId 가능할 때)
        if (eventType == ClientEventType.SESSION_ADJUSTED
                && mappingId != null
                && remBefore != null
                && usedBefore != null
                && remAfter != null
                && usedAfter != null) {
            String actionUnit = ClientEventIdempotencyKeys.sessionAdjustedActionUnit(
                    remBefore, usedBefore, remAfter, usedAfter);
            return ClientEventIdempotencyKeys.forMappingAction(
                    eventType, tenantId, mappingId, actionUnit);
        }
        // 상태·조정 등 다회 가능 → ccmh 고유 키
        return ClientEventIdempotencyKeys.forCcmh(eventType, tenantId, historyId);
    }

    private Long resolveHistoryScheduleId(ConsultantClientMappingHistory history) {
        Long fromReason = extractScheduleIdFromReason(history.getReason());
        if (fromReason != null) {
            return fromReason;
        }
        Long fromBefore = readLong(
                history.getBeforeStateJson(), ClientEventWriteConstants.JSON_KEY_SCHEDULE_ID);
        if (fromBefore != null) {
            return fromBefore;
        }
        return readLong(history.getAfterStateJson(), ClientEventWriteConstants.JSON_KEY_SCHEDULE_ID);
    }

    private static ClientEventType resolveScheduleEventType(Schedule schedule) {
        if (schedule.getClientId() == null) {
            return null;
        }
        ScheduleStatus status = schedule.getStatus();
        if (status == null) {
            return null;
        }
        if (status == ScheduleStatus.AVAILABLE || status == ScheduleStatus.VACATION) {
            return null;
        }
        if (status == ScheduleStatus.TENTATIVE_PENDING_PAYMENT) {
            return ClientEventType.TEMP_RESERVATION_CREATED;
        }
        if (status == ScheduleStatus.CANCELLED) {
            return ClientEventType.SCHEDULE_CANCELLED;
        }
        return ClientEventType.SCHEDULE_CREATED;
    }

    private static ClientEventType resolveHistoryEventType(MappingHistoryEventType historyType) {
        if (historyType == null) {
            return null;
        }
        switch (historyType) {
            case SESSION_USED:
                return ClientEventType.SESSION_DEDUCTED;
            case SESSION_ADDED:
            case RESTORED:
                return ClientEventType.SESSION_RESTORED;
            case SESSION_REASSIGN_IN:
                return ClientEventType.MAPPING_REASSIGNED;
            case SESSION_REASSIGN_OUT:
                // IN 과 쌍 — 타임라인 중복 방지
                return null;
            case STATUS_CHANGED:
                return ClientEventType.MAPPING_STATUS_CHANGED;
            case UPDATED:
            case PARTIAL_REFUND:
            case TERMINATED:
                return ClientEventType.SESSION_ADJUSTED;
            case CREATED:
                // mappings 테이블 MAPPING_CREATED 로 처리
                return null;
            default:
                return null;
        }
    }

    private static LocalDateTime resolvePaymentOccurredAt(Payment payment, ClientEventType eventType) {
        if (eventType == ClientEventType.PAYMENT_COMPLETED && payment.getApprovedAt() != null) {
            return payment.getApprovedAt();
        }
        if (eventType == ClientEventType.PAYMENT_CANCELLED && payment.getCancelledAt() != null) {
            return payment.getCancelledAt();
        }
        if (eventType == ClientEventType.PAYMENT_REFUNDED && payment.getRefundedAt() != null) {
            return payment.getRefundedAt();
        }
        return nullToNow(payment.getCreatedAt());
    }

    private static Long resolveMappingClientId(ConsultantClientMapping mapping) {
        User client = mapping.getClient();
        return client != null ? client.getId() : null;
    }

    private static LocalDateTime nullToNow(LocalDateTime value) {
        return value != null ? value : LocalDateTime.now();
    }

    private static Long extractScheduleIdFromReason(String reason) {
        if (!StringUtils.hasText(reason)) {
            return null;
        }
        String marker = "via schedule ";
        int idx = reason.indexOf(marker);
        if (idx < 0) {
            return null;
        }
        String tail = reason.substring(idx + marker.length()).trim();
        StringBuilder digits = new StringBuilder();
        for (int i = 0; i < tail.length(); i++) {
            char ch = tail.charAt(i);
            if (Character.isDigit(ch)) {
                digits.append(ch);
            } else {
                break;
            }
        }
        if (digits.length() == 0) {
            return null;
        }
        try {
            return Long.parseLong(digits.toString());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private Integer readInt(String json, String field) {
        JsonNode value = readNode(json, field);
        if (value == null) {
            return null;
        }
        try {
            if (value.isNumber()) {
                return value.intValue();
            }
            if (value.isTextual()) {
                return Integer.parseInt(value.asText().trim());
            }
            return null;
        } catch (Exception ex) {
            return null;
        }
    }

    private Long readLong(String json, String field) {
        JsonNode value = readNode(json, field);
        if (value == null) {
            return null;
        }
        try {
            if (value.isNumber()) {
                return value.longValue();
            }
            if (value.isTextual()) {
                return Long.parseLong(value.asText().trim());
            }
            return null;
        } catch (Exception ex) {
            return null;
        }
    }

    private JsonNode readNode(String json, String field) {
        if (!StringUtils.hasText(json) || !StringUtils.hasText(field)) {
            return null;
        }
        try {
            JsonNode node = objectMapper.readTree(json);
            if (node == null || !node.has(field) || node.get(field).isNull()) {
                return null;
            }
            return node.get(field);
        } catch (Exception ex) {
            return null;
        }
    }

    private String toMappingSessionJson(ConsultantClientMapping mapping) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put(ClientEventBackfillConstants.JSON_KEY_TOTAL_SESSIONS, mapping.getTotalSessions());
        snapshot.put(ClientEventBackfillConstants.JSON_KEY_USED_SESSIONS, mapping.getUsedSessions());
        snapshot.put(
                ClientEventBackfillConstants.JSON_KEY_REMAINING_SESSIONS,
                mapping.getRemainingSessions());
        snapshot.put(
                ClientEventWriteConstants.JSON_KEY_STATUS,
                mapping.getStatus() != null ? mapping.getStatus().name() : null);
        snapshot.put(
                ClientEventWriteConstants.JSON_KEY_PAYMENT_STATUS,
                mapping.getPaymentStatus() != null ? mapping.getPaymentStatus().name() : null);
        return toJson(snapshot);
    }

    private String toJson(Map<String, Object> map) {
        if (map == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(map);
        } catch (Exception ex) {
            log.warn("client_event backfill JSON 직렬화 실패: {}", ex.getMessage());
            return null;
        }
    }

    private static void requireTenantId(String tenantId) {
        if (!StringUtils.hasText(tenantId)) {
            throw new IllegalArgumentException("tenantId는 필수입니다.");
        }
    }

    private static void restoreTenantContext(String previousTenantId) {
        if (previousTenantId != null) {
            TenantContextHolder.setTenantId(previousTenantId);
        } else {
            TenantContextHolder.clear();
        }
    }
}
