package com.coresolution.consultation.sct.constant;

/**
 * SCT 초대 상태.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
public enum SctInviteStatus {
    SENT,
    DRAFT,
    SUBMITTED,
    EXPIRED,
    CANCELLED;

    /**
     * @param code 상태 코드
     * @return enum
     */
    public static SctInviteStatus fromCode(String code) {
        return SctInviteStatus.valueOf(code);
    }
}
