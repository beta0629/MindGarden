package com.coresolution.consultation.constant;

/**
 * 내담자 관리용 타임라인({@code client_event.source}) 발생 출처 enum.
 *
 * @author MindGarden
 * @since 2026-11-26
 */
public enum ClientEventSource {

    SCREEN("SCREEN", "enums.ClientEventSource.SCREEN"),
    API("API", "enums.ClientEventSource.API"),
    SCHEDULER("SCHEDULER", "enums.ClientEventSource.SCHEDULER"),
    PG_CALLBACK("PG_CALLBACK", "enums.ClientEventSource.PG_CALLBACK"),
    BACKFILLED("BACKFILLED", "enums.ClientEventSource.BACKFILLED"),
    SYSTEM("SYSTEM", "enums.ClientEventSource.SYSTEM");

    private final String code;
    private final String messageKey;

    ClientEventSource(String code, String messageKey) {
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
     * @param code 출처 코드
     * @return 매칭 enum
     * @throws IllegalArgumentException code 가 null 이거나 알 수 없을 때
     */
    public static ClientEventSource fromCode(String code) {
        if (code == null) {
            throw new IllegalArgumentException("ClientEventSource code is null");
        }
        for (ClientEventSource value : values()) {
            if (value.code.equals(code)) {
                return value;
            }
        }
        throw new IllegalArgumentException("Unknown ClientEventSource code: " + code);
    }
}
