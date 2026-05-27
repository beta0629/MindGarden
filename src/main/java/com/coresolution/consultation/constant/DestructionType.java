package com.coresolution.consultation.constant;

/**
 * 개인정보 파기({@code personal_data_destruction_logs.destruction_type}) 유형 enum.
 *
 * <p>PIPA §16 파기 기록 의무를 위한 4가지 파기 경로의 SSOT.</p>
 * <ul>
 *   <li>{@link #ANONYMIZE} — 비식별화 (개인 식별 컬럼만 hash/null 처리, 행 유지)</li>
 *   <li>{@link #TOMBSTONE} — soft-delete (is_deleted=true, 데이터는 보존)</li>
 *   <li>{@link #HARD_DELETE} — 행 자체 DELETE</li>
 *   <li>{@link #DORMANT_TRANSITION} — 휴면 전환 (별도 dormant_users 등 보관)</li>
 * </ul>
 *
 * <p>한국어 라벨은 {@link #getMessageKey()} 의 i18n 키를 사용한다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-04
 */
public enum DestructionType {

    ANONYMIZE("ANONYMIZE", "enums.DestructionType.ANONYMIZE"),
    TOMBSTONE("TOMBSTONE", "enums.DestructionType.TOMBSTONE"),
    HARD_DELETE("HARD_DELETE", "enums.DestructionType.HARD_DELETE"),
    DORMANT_TRANSITION("DORMANT_TRANSITION", "enums.DestructionType.DORMANT_TRANSITION");

    private final String code;
    private final String messageKey;

    DestructionType(String code, String messageKey) {
        this.code = code;
        this.messageKey = messageKey;
    }

    public String getCode() {
        return code;
    }

    public String getMessageKey() {
        return messageKey;
    }

    public static DestructionType fromCode(String code) {
        if (code == null) {
            throw new IllegalArgumentException("DestructionType code is null");
        }
        for (DestructionType value : values()) {
            if (value.code.equals(code)) {
                return value;
            }
        }
        throw new IllegalArgumentException("Unknown DestructionType code: " + code);
    }
}
