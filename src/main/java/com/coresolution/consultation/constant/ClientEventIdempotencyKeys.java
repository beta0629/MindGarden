package com.coresolution.consultation.constant;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Objects;
import java.util.regex.Pattern;

import org.springframework.util.StringUtils;

/**
 * {@code client_event} 멱등 키 공통 팩토리 (실시간 훅 ↔ 백필 동일 형식).
 *
 * <p>형식: {@code {eventType}:{tenantId}:{entityKind}:{entityId}}
 * 동작 단위가 있으면 {@code :{actionUnit}} 을 덧붙인다.
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

    private static final String NULL_TOKEN = "n";
    private static final String NOREF_TOKEN = "noref";

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
     * 통일 멱등 키 + 동작 단위(actionUnit).
     *
     * <p>형식: {@code {TYPE}:{tenant}:{kind}:{id}:{actionUnit}}</p>
     *
     * @param eventType 이벤트 타입
     * @param tenantId 테넌트
     * @param entityKind entityKind
     * @param entityId 엔티티 ID
     * @param actionUnit 동작 지문(필수)
     * @return 멱등 키
     */
    public static String ofAction(
            ClientEventType eventType,
            String tenantId,
            String entityKind,
            Long entityId,
            String actionUnit) {
        if (!StringUtils.hasText(actionUnit)) {
            throw new IllegalArgumentException("actionUnit은 필수입니다.");
        }
        return of(eventType, tenantId, entityKind, entityId) + ":" + actionUnit.trim();
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
     * 배정(mapping) + 동작 단위 키.
     *
     * @param eventType 이벤트 타입
     * @param tenantId 테넌트
     * @param mappingId 배정 ID
     * @param actionUnit 동작 지문
     * @return 멱등 키
     */
    public static String forMappingAction(
            ClientEventType eventType, String tenantId, Long mappingId, String actionUnit) {
        return ofAction(eventType, tenantId, ENTITY_MAPPING, mappingId, actionUnit);
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
     * SESSION_ADJUSTED 동작 지문.
     *
     * <p>형식: {@code rem{before}-u{before}_rem{after}-u{after}} (null → {@code n})</p>
     *
     * @param remBefore 정정 전 remaining
     * @param usedBefore 정정 전 used
     * @param remAfter 정정 후 remaining
     * @param usedAfter 정정 후 used
     * @return actionUnit
     */
    public static String sessionAdjustedActionUnit(
            Integer remBefore, Integer usedBefore, Integer remAfter, Integer usedAfter) {
        return "rem" + nullToToken(remBefore)
                + "-u" + nullToToken(usedBefore)
                + "_rem" + nullToToken(remAfter)
                + "-u" + nullToToken(usedAfter);
    }

    /**
     * mapping-only PAYMENT_COMPLETED 동작 지문.
     *
     * <p>형식: {@code ref:{paymentReference|noref}:amt:{scaledAmount|n}}</p>
     *
     * @param paymentReference 결제 참조(없으면 noref)
     * @param amount 금액(없으면 n)
     * @return actionUnit
     */
    public static String paymentCompletedActionUnit(String paymentReference, BigDecimal amount) {
        String ref = StringUtils.hasText(paymentReference) ? paymentReference.trim() : NOREF_TOKEN;
        return "ref:" + ref + ":amt:" + scaleAmountOrN(amount);
    }

    /**
     * mapping-only PAYMENT_REFUNDED 동작 지문.
     *
     * <p>형식: {@code amt:{scaled}:r:{reasonHashOrEmpty}}</p>
     *
     * @param amount 환불 금액
     * @param reason 사유(해시; 없으면 빈 문자열)
     * @return actionUnit
     */
    public static String paymentRefundedActionUnit(BigDecimal amount, String reason) {
        return "amt:" + scaleAmountOrN(amount) + ":r:" + reasonHashOrEmpty(reason);
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
     * 통일 키 패턴 여부 ({@code TYPE:tenant:kind:id} 또는 optional actionUnit).
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
                        + ":(mapping|schedule|payment|ccmh):\\d+(?::.+)?$");
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

    private static String nullToToken(Integer value) {
        return value == null ? NULL_TOKEN : String.valueOf(value.intValue());
    }

    private static String scaleAmountOrN(BigDecimal amount) {
        if (amount == null) {
            return NULL_TOKEN;
        }
        return amount.stripTrailingZeros().toPlainString();
    }

    private static String reasonHashOrEmpty(String reason) {
        if (!StringUtils.hasText(reason)) {
            return "";
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(reason.trim().getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(16);
            for (int i = 0; i < 8 && i < hashed.length; i++) {
                hex.append(String.format("%02x", hashed[i]));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException ex) {
            return Integer.toHexString(reason.trim().hashCode());
        }
    }
}
