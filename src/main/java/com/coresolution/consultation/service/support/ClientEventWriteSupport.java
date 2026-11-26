package com.coresolution.consultation.service.support;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

import com.coresolution.consultation.constant.ClientEventSource;
import com.coresolution.consultation.constant.ClientEventType;
import com.coresolution.consultation.constant.ClientEventWriteConstants;
import com.coresolution.consultation.dto.ClientEventRecordCommand;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.ClientEventService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * {@code client_event} 실시간 기록 헬퍼.
 *
 * <p>Command 빌드 + {@link ClientEventService#record} 호출을 한곳에 모은다.
 * 기록 실패 시 예외를 삼키지 않고 전파한다(부모 트랜잭션 롤백).</p>
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ClientEventWriteSupport {

    private final ClientEventService clientEventService;
    private final ObjectMapper objectMapper;

    /**
     * 일정 생성(확정 예약) 또는 가예약 생성.
     *
     * @param schedule 저장된 일정
     * @param tentative true 이면 TEMP_RESERVATION_CREATED
     */
    public void recordScheduleCreated(Schedule schedule, boolean tentative) {
        if (schedule == null || schedule.getClientId() == null) {
            return;
        }
        ClientEventType type = tentative
                ? ClientEventType.TEMP_RESERVATION_CREATED
                : ClientEventType.SCHEDULE_CREATED;
        record(ClientEventRecordCommand.builder()
                .tenantId(resolveTenantId(schedule.getTenantId()))
                .clientId(schedule.getClientId())
                .eventType(type)
                .occurredAt(LocalDateTime.now())
                .actorUserId(resolveActorUserId())
                .actorRole(resolveActorRole())
                .source(resolveSource(null))
                .afterJson(toScheduleSlotJson(schedule))
                .scheduleId(schedule.getId())
                .mappingId(schedule.getMappingId())
                .build());
    }

    /**
     * 가예약 확정(TEMP → BOOKED/CONFIRMED).
     *
     * @param schedule 확정된 일정
     * @param previousStatusName 이전 상태명
     */
    public void recordTempReservationConfirmed(Schedule schedule, String previousStatusName) {
        if (schedule == null || schedule.getClientId() == null) {
            return;
        }
        Map<String, Object> before = new LinkedHashMap<>();
        before.put(ClientEventWriteConstants.JSON_KEY_STATUS, previousStatusName);
        record(ClientEventRecordCommand.builder()
                .tenantId(resolveTenantId(schedule.getTenantId()))
                .clientId(schedule.getClientId())
                .eventType(ClientEventType.TEMP_RESERVATION_CONFIRMED)
                .occurredAt(LocalDateTime.now())
                .actorUserId(resolveActorUserId())
                .actorRole(resolveActorRole())
                .source(resolveSource(null))
                .beforeJson(toJson(before))
                .afterJson(toScheduleSlotJson(schedule))
                .scheduleId(schedule.getId())
                .mappingId(schedule.getMappingId())
                .build());
    }

    /**
     * 일정 변경/이동.
     *
     * @param schedule 저장 후 일정
     * @param beforeJson 변경 전 슬롯 JSON
     */
    public void recordScheduleUpdated(Schedule schedule, String beforeJson) {
        if (schedule == null || schedule.getClientId() == null) {
            return;
        }
        record(ClientEventRecordCommand.builder()
                .tenantId(resolveTenantId(schedule.getTenantId()))
                .clientId(schedule.getClientId())
                .eventType(ClientEventType.SCHEDULE_UPDATED)
                .occurredAt(LocalDateTime.now())
                .actorUserId(resolveActorUserId())
                .actorRole(resolveActorRole())
                .source(resolveSource(null))
                .beforeJson(beforeJson)
                .afterJson(toScheduleSlotJson(schedule))
                .scheduleId(schedule.getId())
                .mappingId(schedule.getMappingId())
                .build());
    }

    /**
     * 일정 취소.
     *
     * @param schedule 취소된 일정
     * @param previousStatusName 이전 상태
     * @param reason 취소 사유
     */
    public void recordScheduleCancelled(Schedule schedule, String previousStatusName, String reason) {
        if (schedule == null || schedule.getClientId() == null) {
            return;
        }
        Map<String, Object> before = new LinkedHashMap<>();
        before.put(ClientEventWriteConstants.JSON_KEY_STATUS, previousStatusName);
        record(ClientEventRecordCommand.builder()
                .tenantId(resolveTenantId(schedule.getTenantId()))
                .clientId(schedule.getClientId())
                .eventType(ClientEventType.SCHEDULE_CANCELLED)
                .occurredAt(LocalDateTime.now())
                .actorUserId(resolveActorUserId())
                .actorRole(resolveActorRole())
                .source(resolveSource(null))
                .reason(reason)
                .beforeJson(toJson(before))
                .afterJson(toScheduleSlotJson(schedule))
                .scheduleId(schedule.getId())
                .mappingId(schedule.getMappingId())
                .build());
    }

    /**
     * 배정(매핑) 생성.
     *
     * @param mapping 저장된 매핑
     */
    public void recordMappingCreated(ConsultantClientMapping mapping) {
        if (mapping == null || mapping.getClient() == null || mapping.getClient().getId() == null) {
            return;
        }
        record(ClientEventRecordCommand.builder()
                .tenantId(resolveTenantId(mapping.getTenantId()))
                .clientId(mapping.getClient().getId())
                .eventType(ClientEventType.MAPPING_CREATED)
                .occurredAt(LocalDateTime.now())
                .actorUserId(resolveActorUserId())
                .actorRole(resolveActorRole())
                .source(resolveSource(null))
                .afterJson(toMappingSessionJson(mapping))
                .mappingId(mapping.getId())
                .sessionsRemainingAfter(mapping.getRemainingSessions())
                .sessionsUsedAfter(mapping.getUsedSessions())
                .build());
    }

    /**
     * 배정 상태 변경.
     *
     * @param mapping 저장 후 매핑
     * @param previousStatusName 이전 상태
     */
    public void recordMappingStatusChanged(ConsultantClientMapping mapping, String previousStatusName) {
        if (mapping == null || mapping.getClient() == null || mapping.getClient().getId() == null) {
            return;
        }
        Map<String, Object> before = new LinkedHashMap<>();
        before.put(ClientEventWriteConstants.JSON_KEY_STATUS, previousStatusName);
        record(ClientEventRecordCommand.builder()
                .tenantId(resolveTenantId(mapping.getTenantId()))
                .clientId(mapping.getClient().getId())
                .eventType(ClientEventType.MAPPING_STATUS_CHANGED)
                .occurredAt(LocalDateTime.now())
                .actorUserId(resolveActorUserId())
                .actorRole(resolveActorRole())
                .source(resolveSource(null))
                .beforeJson(toJson(before))
                .afterJson(toMappingSessionJson(mapping))
                .mappingId(mapping.getId())
                .sessionsRemainingBefore(null)
                .sessionsRemainingAfter(mapping.getRemainingSessions())
                .sessionsUsedAfter(mapping.getUsedSessions())
                .build());
    }

    /**
     * 일정 배정 변경(reassign).
     *
     * @param schedule 변경된 일정
     * @param originMappingId 원 매핑 ID
     * @param target 대상 매핑(차감 후)
     * @param originBeforeJson 원 매핑 before 스냅샷
     * @param targetBeforeJson 대상 매핑 before 스냅샷
     * @param remBefore 대상 remaining before
     * @param usedBefore 대상 used before
     * @param reason 사유
     */
    public void recordMappingReassigned(
            Schedule schedule,
            Long originMappingId,
            ConsultantClientMapping target,
            String originBeforeJson,
            String targetBeforeJson,
            Integer remBefore,
            Integer usedBefore,
            String reason) {
        if (schedule == null || schedule.getClientId() == null || target == null) {
            return;
        }
        Map<String, Object> after = new LinkedHashMap<>();
        after.put(ClientEventWriteConstants.JSON_KEY_ORIGIN_MAPPING_ID, originMappingId);
        after.put(ClientEventWriteConstants.JSON_KEY_TARGET_MAPPING_ID, target.getId());
        after.put(ClientEventWriteConstants.JSON_KEY_REMAINING_SESSIONS, target.getRemainingSessions());
        after.put(ClientEventWriteConstants.JSON_KEY_USED_SESSIONS, target.getUsedSessions());
        String idempotencyKey = schedule.getId() != null
                ? ClientEventWriteConstants.IDEMPOTENCY_MAPPING_REASSIGNED_SCHEDULE_PREFIX + schedule.getId()
                        + ":target:" + target.getId()
                : null;
        record(ClientEventRecordCommand.builder()
                .tenantId(resolveTenantId(schedule.getTenantId()))
                .clientId(schedule.getClientId())
                .eventType(ClientEventType.MAPPING_REASSIGNED)
                .occurredAt(LocalDateTime.now())
                .actorUserId(resolveActorUserId())
                .actorRole(resolveActorRole())
                .source(resolveSource(null))
                .reason(reason)
                .beforeJson(mergeReassignBeforeJson(originBeforeJson, targetBeforeJson))
                .afterJson(toJson(after))
                .scheduleId(schedule.getId())
                .mappingId(target.getId())
                .sessionsRemainingBefore(remBefore)
                .sessionsRemainingAfter(target.getRemainingSessions())
                .sessionsUsedBefore(usedBefore)
                .sessionsUsedAfter(target.getUsedSessions())
                .idempotencyKey(idempotencyKey)
                .build());
    }

    /**
     * 회기 차감.
     *
     * @param tenantId 테넌트
     * @param clientId 내담자
     * @param mappingId 매핑
     * @param scheduleId 일정(가능하면)
     * @param remBefore 차감 전 remaining
     * @param remAfter 차감 후 remaining
     * @param usedBefore 차감 전 used
     * @param usedAfter 차감 후 used
     * @param beforeJson 차감 전 JSON
     * @param afterJson 차감 후 JSON
     */
    public void recordSessionDeducted(
            String tenantId,
            Long clientId,
            Long mappingId,
            Long scheduleId,
            Integer remBefore,
            Integer remAfter,
            Integer usedBefore,
            Integer usedAfter,
            String beforeJson,
            String afterJson) {
        if (clientId == null) {
            return;
        }
        String idempotencyKey = scheduleId != null
                ? ClientEventWriteConstants.IDEMPOTENCY_SESSION_DEDUCTED_SCHEDULE_PREFIX + scheduleId
                : null;
        record(ClientEventRecordCommand.builder()
                .tenantId(resolveTenantId(tenantId))
                .clientId(clientId)
                .eventType(ClientEventType.SESSION_DEDUCTED)
                .occurredAt(LocalDateTime.now())
                .actorUserId(resolveActorUserId())
                .actorRole(resolveActorRole())
                .source(resolveSource(null))
                .beforeJson(beforeJson)
                .afterJson(afterJson)
                .scheduleId(scheduleId)
                .mappingId(mappingId)
                .sessionsRemainingBefore(remBefore)
                .sessionsRemainingAfter(remAfter)
                .sessionsUsedBefore(usedBefore)
                .sessionsUsedAfter(usedAfter)
                .idempotencyKey(idempotencyKey)
                .build());
    }

    /**
     * 회기 원복(실제 restore 성공 시).
     *
     * @param tenantId 테넌트
     * @param clientId 내담자
     * @param mapping 원복 후 매핑
     * @param scheduleId 일정
     * @param remBefore 원복 전 remaining
     * @param usedBefore 원복 전 used
     * @param beforeJson 원복 전 JSON
     */
    public void recordSessionRestored(
            String tenantId,
            Long clientId,
            ConsultantClientMapping mapping,
            Long scheduleId,
            Integer remBefore,
            Integer usedBefore,
            String beforeJson) {
        if (clientId == null || mapping == null) {
            return;
        }
        String idempotencyKey = scheduleId != null
                ? ClientEventWriteConstants.IDEMPOTENCY_SESSION_RESTORED_SCHEDULE_PREFIX + scheduleId
                : null;
        record(ClientEventRecordCommand.builder()
                .tenantId(resolveTenantId(tenantId))
                .clientId(clientId)
                .eventType(ClientEventType.SESSION_RESTORED)
                .occurredAt(LocalDateTime.now())
                .actorUserId(resolveActorUserId())
                .actorRole(resolveActorRole())
                .source(resolveSource(null))
                .beforeJson(beforeJson)
                .afterJson(toMappingSessionJson(mapping))
                .scheduleId(scheduleId)
                .mappingId(mapping.getId())
                .sessionsRemainingBefore(remBefore)
                .sessionsRemainingAfter(mapping.getRemainingSessions())
                .sessionsUsedBefore(usedBefore)
                .sessionsUsedAfter(mapping.getUsedSessions())
                .idempotencyKey(idempotencyKey)
                .build());
    }

    /**
     * 결제 완료.
     *
     * @param payment 승인된 결제
     * @param source 출처(null 이면 기본 해석)
     */
    public void recordPaymentCompleted(Payment payment, ClientEventSource source) {
        recordPaymentEvent(payment, ClientEventType.PAYMENT_COMPLETED, source,
                ClientEventWriteConstants.IDEMPOTENCY_PAYMENT_COMPLETED_PREFIX);
    }

    /**
     * 결제 취소.
     *
     * @param payment 취소된 결제
     * @param source 출처
     * @param reason 사유
     */
    public void recordPaymentCancelled(Payment payment, ClientEventSource source, String reason) {
        recordPaymentEvent(payment, ClientEventType.PAYMENT_CANCELLED, source,
                ClientEventWriteConstants.IDEMPOTENCY_PAYMENT_CANCELLED_PREFIX, reason);
    }

    /**
     * 결제 환불.
     *
     * @param payment 환불된 결제
     * @param source 출처
     * @param reason 사유
     */
    public void recordPaymentRefunded(Payment payment, ClientEventSource source, String reason) {
        recordPaymentEvent(payment, ClientEventType.PAYMENT_REFUNDED, source,
                ClientEventWriteConstants.IDEMPOTENCY_PAYMENT_REFUNDED_PREFIX, reason);
    }

    /**
     * 매핑 세션 스냅샷 JSON (민감값 제외).
     *
     * @param mapping 매핑
     * @return JSON 문자열 또는 null
     */
    public String toMappingSessionJson(ConsultantClientMapping mapping) {
        if (mapping == null) {
            return null;
        }
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put(ClientEventWriteConstants.JSON_KEY_TOTAL_SESSIONS, mapping.getTotalSessions());
        snapshot.put(ClientEventWriteConstants.JSON_KEY_USED_SESSIONS, mapping.getUsedSessions());
        snapshot.put(ClientEventWriteConstants.JSON_KEY_REMAINING_SESSIONS, mapping.getRemainingSessions());
        snapshot.put(ClientEventWriteConstants.JSON_KEY_STATUS,
                mapping.getStatus() != null ? mapping.getStatus().name() : null);
        snapshot.put(ClientEventWriteConstants.JSON_KEY_PAYMENT_STATUS,
                mapping.getPaymentStatus() != null ? mapping.getPaymentStatus().name() : null);
        return toJson(snapshot);
    }

    /**
     * 일정 슬롯 JSON (민감값 제외).
     *
     * @param schedule 일정
     * @return JSON 문자열 또는 null
     */
    public String toScheduleSlotJson(Schedule schedule) {
        if (schedule == null) {
            return null;
        }
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put(ClientEventWriteConstants.JSON_KEY_STATUS,
                schedule.getStatus() != null ? schedule.getStatus().name() : null);
        snapshot.put(ClientEventWriteConstants.JSON_KEY_DATE,
                schedule.getDate() != null ? schedule.getDate().toString() : null);
        snapshot.put(ClientEventWriteConstants.JSON_KEY_START_TIME,
                schedule.getStartTime() != null ? schedule.getStartTime().toString() : null);
        snapshot.put(ClientEventWriteConstants.JSON_KEY_END_TIME,
                schedule.getEndTime() != null ? schedule.getEndTime().toString() : null);
        return toJson(snapshot);
    }

    private void recordPaymentEvent(
            Payment payment, ClientEventType type, ClientEventSource source, String idempotencyPrefix) {
        recordPaymentEvent(payment, type, source, idempotencyPrefix, null);
    }

    private void recordPaymentEvent(
            Payment payment,
            ClientEventType type,
            ClientEventSource source,
            String idempotencyPrefix,
            String reason) {
        if (payment == null || payment.getPayerId() == null) {
            return;
        }
        Map<String, Object> after = new LinkedHashMap<>();
        after.put(ClientEventWriteConstants.JSON_KEY_PAYMENT_STATUS_CODE,
                payment.getStatus() != null ? payment.getStatus().name() : null);
        after.put(ClientEventWriteConstants.JSON_KEY_AMOUNT, payment.getAmount());
        String idempotencyKey = payment.getId() != null
                ? idempotencyPrefix + payment.getId()
                : null;
        record(ClientEventRecordCommand.builder()
                .tenantId(resolveTenantId(payment.getTenantId()))
                .clientId(payment.getPayerId())
                .eventType(type)
                .occurredAt(LocalDateTime.now())
                .actorUserId(resolveActorUserId())
                .actorRole(resolveActorRole())
                .source(resolveSource(source))
                .reason(reason)
                .afterJson(toJson(after))
                .paymentId(payment.getId())
                .amount(payment.getAmount())
                .currency(ClientEventWriteConstants.CURRENCY_KRW)
                .idempotencyKey(idempotencyKey)
                .build());
    }

    private void record(ClientEventRecordCommand command) {
        clientEventService.record(command);
    }

    private String resolveTenantId(String entityTenantId) {
        if (entityTenantId != null && !entityTenantId.isBlank()) {
            return entityTenantId;
        }
        return TenantContextHolder.getRequiredTenantId();
    }

    private Long resolveActorUserId() {
        return SessionUtils.getCurrentUserId();
    }

    private String resolveActorRole() {
        User user = SessionUtils.getCurrentUser(null);
        if (user == null || user.getRole() == null) {
            return null;
        }
        return user.getRole().name();
    }

    private ClientEventSource resolveSource(ClientEventSource override) {
        if (override != null) {
            return override;
        }
        return SessionUtils.getCurrentUserId() != null
                ? ClientEventSource.API
                : ClientEventSource.SYSTEM;
    }

    private String mergeReassignBeforeJson(String originBeforeJson, String targetBeforeJson) {
        Map<String, Object> before = new LinkedHashMap<>();
        before.put(ClientEventWriteConstants.JSON_KEY_ORIGIN, originBeforeJson);
        before.put(ClientEventWriteConstants.JSON_KEY_TARGET, targetBeforeJson);
        return toJson(before);
    }

    private String toJson(Map<String, Object> map) {
        if (map == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(map);
        } catch (Exception e) {
            log.warn("client_event JSON 직렬화 실패: {}", e.getMessage());
            return null;
        }
    }
}
