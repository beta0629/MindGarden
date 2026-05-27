package com.coresolution.consultation.constant;

/**
 * 컨설턴트-내담자 매핑 이력({@code consultant_client_mapping_history.event_type}) 이벤트 enum.
 *
 * <p>매핑 변경 이력의 분류. planner v1.1 합의서 §8 (병행) 가이드 도착 시 추가 항목이
 * 합쳐질 수 있다.</p>
 *
 * <ul>
 *   <li>{@link #CREATED} — 매핑 신설</li>
 *   <li>{@link #UPDATED} — 매핑 필드 갱신 (회기 수, 컨설턴트 등)</li>
 *   <li>{@link #PARTIAL_REFUND} — 부분 환불 트리거</li>
 *   <li>{@link #TERMINATED} — 매핑 종료</li>
 *   <li>{@link #RESTORED} — 종료된 매핑 복구</li>
 *   <li>{@link #SESSION_USED} — 회기 사용 차감</li>
 *   <li>{@link #SESSION_ADDED} — 회기 추가 (보상/연장)</li>
 *   <li>{@link #STATUS_CHANGED} — 매핑 상태 코드 변경</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-06-04
 */
public enum MappingHistoryEventType {

    CREATED("CREATED", "enums.MappingHistoryEventType.CREATED"),
    UPDATED("UPDATED", "enums.MappingHistoryEventType.UPDATED"),
    PARTIAL_REFUND("PARTIAL_REFUND", "enums.MappingHistoryEventType.PARTIAL_REFUND"),
    TERMINATED("TERMINATED", "enums.MappingHistoryEventType.TERMINATED"),
    RESTORED("RESTORED", "enums.MappingHistoryEventType.RESTORED"),
    SESSION_USED("SESSION_USED", "enums.MappingHistoryEventType.SESSION_USED"),
    SESSION_ADDED("SESSION_ADDED", "enums.MappingHistoryEventType.SESSION_ADDED"),
    STATUS_CHANGED("STATUS_CHANGED", "enums.MappingHistoryEventType.STATUS_CHANGED");

    private final String code;
    private final String messageKey;

    MappingHistoryEventType(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getCode() {
        return code;
    }

    public String getMessageKey() {
        return messageKey;
    }

    public static MappingHistoryEventType fromCode(String code) {
        if (code == null) {
            throw new IllegalArgumentException("MappingHistoryEventType code is null");
        }
        for (MappingHistoryEventType value : values()) {
            if (value.code.equals(code)) {
                return value;
            }
        }
        throw new IllegalArgumentException("Unknown MappingHistoryEventType code: " + code);
    }
}
