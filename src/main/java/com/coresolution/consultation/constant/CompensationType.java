package com.coresolution.consultation.constant;

/**
 * 회기 보상 이력({@code session_compensation_history.compensation_type}) 유형 enum.
 *
 * <ul>
 *   <li>{@link #NO_SHOW_COMP} — 내담자 노쇼 시 컨설턴트 회기 보상</li>
 *   <li>{@link #LATE_CANCEL_COMP} — 지연 취소 (24h 이내) 시 회기 보상</li>
 *   <li>{@link #EXTENSION} — 정책상 회기 연장 보상</li>
 *   <li>{@link #PARTIAL_REFUND_ROLLBACK} — 부분 환불 회수에 따른 회기 복원</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-06-04
 */
public enum CompensationType {

    NO_SHOW_COMP("NO_SHOW_COMP", "enums.CompensationType.NO_SHOW_COMP"),
    LATE_CANCEL_COMP("LATE_CANCEL_COMP", "enums.CompensationType.LATE_CANCEL_COMP"),
    EXTENSION("EXTENSION", "enums.CompensationType.EXTENSION"),
    PARTIAL_REFUND_ROLLBACK("PARTIAL_REFUND_ROLLBACK", "enums.CompensationType.PARTIAL_REFUND_ROLLBACK");

    private final String code;
    private final String messageKey;

    CompensationType(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getCode() {
        return code;
    }

    public String getMessageKey() {
        return messageKey;
    }

    public static CompensationType fromCode(String code) {
        if (code == null) {
            throw new IllegalArgumentException("CompensationType code is null");
        }
        for (CompensationType value : values()) {
            if (value.code.equals(code)) {
                return value;
            }
        }
        throw new IllegalArgumentException("Unknown CompensationType code: " + code);
    }
}
