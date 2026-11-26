package com.coresolution.consultation.constant;

import java.util.Objects;
import java.util.regex.Pattern;

import org.springframework.util.StringUtils;

/**
 * {@code client_event} 멱등 키 공통 팩토리 (실시간 훅 ↔ 백필 동일 형식).
 *
 * <p>형식: {@code {eventType}:{tenantId}:{entityKind}:{entityId}}
 * entityKind = {@code mapping} | {@code schedule} | {@code payment} | {@code ccmh}.</p>
 *
 * @author MindGarden
 * @since 2026-11-26
 */
public final class ClientEventIdempotencyKeys {

    public static final String ENTITY_MAPPING = "mapping";
    public static final String ENTITY_SCHEDULE = "schedule";
    public static final String ENTITY_PAYMENT = "payment";
    public static final String ENTITY_CCMH = "ccmh";

    /** 레거시 백필 접두 (롤백 시 과거 행 정리용). */
    public static final String LEGACY_BACKFILL_PREFIX = "BACKFILL:";

    private ClientEventIdempotencyKeys() {
    }

    /**
     * 통일 멱등 키를 만든다.
     *
     * @param eventType 이벤트 타입
     * @param tenantId 테넌트
     * @param entityKind entityKind
     * @param entityId 엔티티 ID
     * @return 멱등 키
     */
    public static String of(
            ClientEventType eventType, String tenantId, String entityKind, Long entityId) {
        Objects.requireNonNull(eventType, "eventType");
        if (!StringUtils.hasText(tenantId)) {
            throw new IllegalArgumentException("tenantId는 필수입니다.");
        }
        if (!StringUtils.hasText(entityKind)) {
            throw new IllegalArgumentException("entityKind는 필수입니다.");
        }
        if (entityId == null) {
            throw new IllegalArgumentException("entityId는 필수입니다.");
        }
        return eventType.getCode() + ":" + tenantId.trim() + ":" + entityKind + ":" + entityId;
    }

    /**
     * 배정(mapping) 기준 키.
     *
     * @param eventType 이벤트 타입
     * @param tenantId 테넌트
     * @param mappingId 배정 ID
     * @return 멱등 키
     */
    public static String forMapping(ClientEventType eventType, String tenantId, Long mappingId) {
        return of(eventType, tenantId, ENTITY_MAPPING, mappingId);
    }

    /**
     * 일정(schedule) 기준 키.
     *
     * @param eventType 이벤트 타입
     * @param tenantId 테넌트
     * @param scheduleId 일정 ID
     * @return 멱등 키
     */
    public static String forSchedule(ClientEventType eventType, String tenantId, Long scheduleId) {
        return of(eventType, tenantId, ENTITY_SCHEDULE, scheduleId);
    }

    /**
     * 결제(payment) 기준 키.
     *
     * @param eventType 이벤트 타입
     * @param tenantId 테넌트
     * @param paymentId 결제 ID
     * @return 멱등 키
     */
    public static String forPayment(ClientEventType eventType, String tenantId, Long paymentId) {
        return of(eventType, tenantId, ENTITY_PAYMENT, paymentId);
    }

    /**
     * 매핑 이력(ccmh) 기준 키.
     *
     * @param eventType 이벤트 타입
     * @param tenantId 테넌트
     * @param historyId consultant_client_mapping_history.id
     * @return 멱등 키
     */
    public static String forCcmh(ClientEventType eventType, String tenantId, Long historyId) {
        return of(eventType, tenantId, ENTITY_CCMH, historyId);
    }

    /**
     * 회기 이벤트 키 — scheduleId 가 있으면 schedule 우선, 없으면 ccmh.
     *
     * @param eventType SESSION_* 등
     * @param tenantId 테넌트
     * @param scheduleId 일정 ID(없으면 null)
     * @param historyId ccmh ID(schedule 없을 때)
     * @return 멱등 키(둘 다 없으면 null)
     */
    public static String forSession(
            ClientEventType eventType, String tenantId, Long scheduleId, Long historyId) {
        if (scheduleId != null) {
            return forSchedule(eventType, tenantId, scheduleId);
        }
        if (historyId != null) {
            return forCcmh(eventType, tenantId, historyId);
        }
        return null;
    }

    /**
     * 레거시 {@code BACKFILL:} 접두 키 여부.
     *
     * @param key 멱등 키
     * @return true 이면 레거시 백필 키
     */
    public static boolean isLegacyBackfillKey(String key) {
        return StringUtils.hasText(key) && key.startsWith(LEGACY_BACKFILL_PREFIX);
    }

    /**
     * 통일 키 패턴 여부 ({@code TYPE:tenant:kind:id}).
     *
     * @param key 멱등 키
     * @param tenantId 테넌트
     * @return true 이면 통일 형식
     */
    public static boolean matchesUnifiedPattern(String key, String tenantId) {
        if (!StringUtils.hasText(key) || !StringUtils.hasText(tenantId)) {
            return false;
        }
        Pattern pattern = Pattern.compile(
                "^[A-Z_]+:"
                        + Pattern.quote(tenantId.trim())
                        + ":(mapping|schedule|payment|ccmh):\\d+$");
        return pattern.matcher(key).matches();
    }

    /**
     * 롤백 대상 키(레거시 BACKFILL: 또는 통일 패턴).
     *
     * @param key 멱등 키
     * @param tenantId 테넌트
     * @return true 이면 롤백 후보
     */
    public static boolean isRollbackEligibleKey(String key, String tenantId) {
        return isLegacyBackfillKey(key) || matchesUnifiedPattern(key, tenantId);
    }
}
