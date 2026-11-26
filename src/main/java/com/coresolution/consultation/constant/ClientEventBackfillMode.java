package com.coresolution.consultation.constant;

/**
 * {@code client_event} 백필 실행 모드.
 *
 * @author MindGarden
 * @since 2026-11-26
 */
public enum ClientEventBackfillMode {

    DRY_RUN(ClientEventBackfillConstants.MODE_DRY_RUN),
    APPLY(ClientEventBackfillConstants.MODE_APPLY);

    private final String code;

    ClientEventBackfillMode(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    /**
     * 입력 문자열을 모드로 변환한다.
     *
     * @param raw dry-run | apply (대소문자·공백 무시)
     * @return 모드
     * @throws IllegalArgumentException 알 수 없는 값
     */
    public static ClientEventBackfillMode fromCode(String raw) {
        if (raw == null || raw.isBlank()) {
            return DRY_RUN;
        }
        String normalized = raw.trim().toLowerCase();
        for (ClientEventBackfillMode mode : values()) {
            if (mode.code.equals(normalized)) {
                return mode;
            }
        }
        throw new IllegalArgumentException("Unknown ClientEventBackfillMode: " + raw);
    }
}
