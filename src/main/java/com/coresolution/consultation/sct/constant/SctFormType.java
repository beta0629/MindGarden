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
}
