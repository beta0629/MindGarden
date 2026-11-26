package com.coresolution.consultation.constant;

/**
 * 내담자 관리용 타임라인({@code client_event.event_type}) 이벤트 enum.
 *
 * <p>상담일지·문자(SMS) 관련 타입은 포함하지 않는다. 사용자 문구는 「배정」을 사용한다.</p>
 *
 * @author MindGarden
 * @since 2026-11-26
 */
public enum ClientEventType {

    TEMP_RESERVATION_CREATED(
            "TEMP_RESERVATION_CREATED",
            "enums.ClientEventType.TEMP_RESERVATION_CREATED"),
    TEMP_RESERVATION_CONFIRMED(
            "TEMP_RESERVATION_CONFIRMED",
            "enums.ClientEventType.TEMP_RESERVATION_CONFIRMED"),
    SCHEDULE_CREATED("SCHEDULE_CREATED", "enums.ClientEventType.SCHEDULE_CREATED"),
    SCHEDULE_UPDATED("SCHEDULE_UPDATED", "enums.ClientEventType.SCHEDULE_UPDATED"),
    SCHEDULE_CANCELLED("SCHEDULE_CANCELLED", "enums.ClientEventType.SCHEDULE_CANCELLED"),
    MAPPING_CREATED("MAPPING_CREATED", "enums.ClientEventType.MAPPING_CREATED"),
    MAPPING_STATUS_CHANGED(
            "MAPPING_STATUS_CHANGED",
            "enums.ClientEventType.MAPPING_STATUS_CHANGED"),
    MAPPING_REASSIGNED("MAPPING_REASSIGNED", "enums.ClientEventType.MAPPING_REASSIGNED"),
    SESSION_DEDUCTED("SESSION_DEDUCTED", "enums.ClientEventType.SESSION_DEDUCTED"),
    SESSION_RESTORED("SESSION_RESTORED", "enums.ClientEventType.SESSION_RESTORED"),
    SESSION_ADJUSTED("SESSION_ADJUSTED", "enums.ClientEventType.SESSION_ADJUSTED"),
    PAYMENT_COMPLETED("PAYMENT_COMPLETED", "enums.ClientEventType.PAYMENT_COMPLETED"),
    PAYMENT_CANCELLED("PAYMENT_CANCELLED", "enums.ClientEventType.PAYMENT_CANCELLED"),
    PAYMENT_REFUNDED("PAYMENT_REFUNDED", "enums.ClientEventType.PAYMENT_REFUNDED");

    private final String code;
    private final String messageKey;

    ClientEventType(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getCode() {
        return code;
    }

    public String getMessageKey() {
        return messageKey;
    }

    /**
     * 코드 문자열로 enum 값을 찾는다.
     *
     * @param code 이벤트 타입 코드
     * @return 매칭 enum
     * @throws IllegalArgumentException code 가 null 이거나 알 수 없을 때
     */
    public static ClientEventType fromCode(String code) {
        if (code == null) {
            throw new IllegalArgumentException("ClientEventType code is null");
        }
        for (ClientEventType value : values()) {
            if (value.code.equals(code)) {
                return value;
            }
        }
        throw new IllegalArgumentException("Unknown ClientEventType code: " + code);
    }
}
