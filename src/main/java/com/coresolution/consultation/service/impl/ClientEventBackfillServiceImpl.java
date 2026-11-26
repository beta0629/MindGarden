package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.coresolution.consultation.constant.ClientEventBackfillConstants;
import com.coresolution.consultation.constant.ClientEventBackfillMode;
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
import com.coresolution.consultation.service.support.ClientEventBackfillEnvironmentGuard;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.repository.TenantRepository;

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
 * {@link ClientEventBackfillService} 구현 — 테넌트 스코프 백필(멱등).
 *
 * <p>순서: 배정 생성 → 결제 완료 → 일정 → 회기/배정 이력 → 결제 취소·환불.
 * dry-run 은 {@link ClientEventService#record} 를 호출하지 않는다.</p>
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
    private final TenantRepository tenantRepository;
    private final ClientEventBackfillEnvironmentGuard environmentGuard;
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
        environmentGuard.requireDevOnly();
        ClientEventBackfillMode resolvedMode =
                mode != null ? mode : ClientEventBackfillMode.DRY_RUN;

        if (StringUtils.hasText(tenantId)) {
            return runForTenant(resolvedMode, tenantId.trim());
        }

        ClientEventBackfillResult total = ClientEventBackfillResult.empty(resolvedMode, null);
        List<Tenant> tenants = tenantRepository.findAllActive();
        for (Tenant tenant : tenants) {
            if (tenant == null || !StringUtils.hasText(tenant.getTenantId())) {
                continue;
            }
            try {
                total.add(runForTenant(resolvedMode, tenant.getTenantId()));
            } catch (RuntimeException ex) {
                log.warn(
                        "client_event backfill tenant failed: tenantId={}, mode={}, reason={}",
                        tenant.getTenantId(),
                        resolvedMode,
                        ex.getMessage());
                total.setErrors(total.getErrors() + 1);
            }
        }
        log.info(
                "client_event backfill ALL done: mode={}, scanned={}, inserted={}, skipped={}, errors={}",
                resolvedMode,
                total.getScanned(),
                total.getInserted(),
                total.getSkipped(),
                total.getErrors());
        return total;
    }

    @Transactional
    protected ClientEventBackfillResult runForTenant(ClientEventBackfillMode mode, String tenantId) {
        if (!StringUtils.hasText(tenantId)) {
            throw new IllegalArgumentException("tenantId는 필수입니다.");
        }
        String previousTenantId = TenantContextHolder.peekTenantId();
        try {
            TenantContextHolder.setTenantId(tenantId);
            ClientEventBackfillResult result = ClientEventBackfillResult.empty(mode, tenantId);
            backfillMappings(mode, tenantId, result);
            backfillPaymentsCompleted(mode, tenantId, result);
            backfillSchedules(mode, tenantId, result);
            backfillHistories(mode, tenantId, result);
            backfillPaymentsCancelledOrRefunded(mode, tenantId, result);
            log.info(
                    "client_event backfill: tenantId={}, mode={}, scanned={}, inserted={}, skipped={}, errors={}",
                    tenantId,
                    mode,
                    result.getScanned(),
                    result.getInserted(),
                    result.getSkipped(),
                    result.getErrors());
            return result;
        } finally {
            if (previousTenantId != null) {
                TenantContextHolder.setTenantId(previousTenantId);
            } else {
                TenantContextHolder.clear();
            }
        }
    }

    private void backfillMappings(
            ClientEventBackfillMode mode, String tenantId, ClientEventBackfillResult result) {
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
            ClientEventBackfillMode mode, String tenantId, ClientEventBackfillResult result) {
        backfillPayments(mode, tenantId, result, true);
    }

    private void backfillPaymentsCancelledOrRefunded(
            ClientEventBackfillMode mode, String tenantId, ClientEventBackfillResult result) {
        backfillPayments(mode, tenantId, result, false);
    }

    /**
     * 결제 백필. {@code completedPhase=true} 이면 APPROVED 만,
     * false 이면 CANCELLED·REFUNDED 만 처리한다(타임라인 순서 유지).
     */
    private void backfillPayments(
            ClientEventBackfillMode mode,
            String tenantId,
            ClientEventBackfillResult result,
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
                    String key = resolvePaymentIdempotencyKey(tenantId, eventType, payment.getId());
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
            ClientEventBackfillMode mode, String tenantId, ClientEventBackfillResult result) {
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
            ClientEventBackfillMode mode, String tenantId, ClientEventBackfillResult result) {
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
                String key = ClientEventBackfillConstants.idempotencyHistory(
                        tenantId, eventType, history.getId());
                Integer usedBefore = readInt(history.getBeforeStateJson(),
                        ClientEventBackfillConstants.JSON_KEY_USED_SESSIONS);
                Integer remBefore = readInt(history.getBeforeStateJson(),
                        ClientEventBackfillConstants.JSON_KEY_REMAINING_SESSIONS);
                Integer usedAfter = readInt(history.getAfterStateJson(),
                        ClientEventBackfillConstants.JSON_KEY_USED_SESSIONS);
                Integer remAfter = readInt(history.getAfterStateJson(),
                        ClientEventBackfillConstants.JSON_KEY_REMAINING_SESSIONS);
                Long scheduleId = extractScheduleIdFromReason(history.getReason());
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
        Optional<ClientEvent> existing =
                clientEventRepository.findByTenantIdAndIdempotencyKey(tenantId, idempotencyKey);
        if (existing.isPresent()) {
            result.setSkipped(result.getSkipped() + 1);
            return;
        }
        if (mode == ClientEventBackfillMode.DRY_RUN) {
            result.setInserted(result.getInserted() + 1);
            return;
        }
        clientEventService.record(command);
        result.setInserted(result.getInserted() + 1);
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

    private static String resolvePaymentIdempotencyKey(
            String tenantId, ClientEventType eventType, Long paymentId) {
        if (eventType == ClientEventType.PAYMENT_COMPLETED) {
            return ClientEventBackfillConstants.idempotencyPaymentCompleted(tenantId, paymentId);
        }
        if (eventType == ClientEventType.PAYMENT_CANCELLED) {
            return ClientEventBackfillConstants.idempotencyPaymentCancelled(tenantId, paymentId);
        }
        if (eventType == ClientEventType.PAYMENT_REFUNDED) {
            return ClientEventBackfillConstants.idempotencyPaymentRefunded(tenantId, paymentId);
        }
        throw new IllegalArgumentException("Unsupported payment eventType: " + eventType);
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
        if (!StringUtils.hasText(json) || !StringUtils.hasText(field)) {
            return null;
        }
        try {
            JsonNode node = objectMapper.readTree(json);
            if (node == null || !node.has(field) || node.get(field).isNull()) {
                return null;
            }
            JsonNode value = node.get(field);
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
}
