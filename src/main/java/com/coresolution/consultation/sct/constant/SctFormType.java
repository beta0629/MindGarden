package com.coresolution.consultation.sct.constant;

/**
 * SCT 양식 유형.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
public enum SctFormType {
    ADULT,
    ADOLESCENT,
    CHILD;

    /**
     * @param code 양식 코드
     * @return enum
     */
    public static SctFormType fromCode(String code) {
        return SctFormType.valueOf(code);
    }

    /**
     * 온라인 실시 가능 여부(성인·청소년만).
     *
     * @return true면 온라인 발송·공개 실시 가능
     */
    public boolean isOnlineSupported() {
        return this == ADULT || this == ADOLESCENT;
    }
}
