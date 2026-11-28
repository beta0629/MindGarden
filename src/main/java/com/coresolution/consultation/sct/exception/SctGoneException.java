package com.coresolution.consultation.sct.exception;

import com.coresolution.consultation.sct.constant.SctConstants;
import com.coresolution.consultation.sct.constant.SctInviteStatus;

/**
 * SCT 만료·취소 — HTTP 410 Gone.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
public class SctGoneException extends RuntimeException {

    /**
     * @param message 메시지
     */
    public SctGoneException(String message) {
        super(message);
    }

    /**
     * 종료된 초대 상태에 맞는 410 예외. 취소는 {@link SctLinkCancelledException}(코드 SCT_LINK_CANCELLED),
     * 그 외(만료)는 기존 {@code SCT_GONE}.
     *
     * @param inviteStatus 초대 상태명
     * @return 예외
     */
    public static SctGoneException forInvitationStatus(String inviteStatus) {
        if (SctInviteStatus.CANCELLED.name().equals(inviteStatus)) {
            return new SctLinkCancelledException(SctConstants.MSG_LINK_CANCELLED);
        }
        return new SctGoneException(SctConstants.MSG_LINK_GONE);
    }
}
