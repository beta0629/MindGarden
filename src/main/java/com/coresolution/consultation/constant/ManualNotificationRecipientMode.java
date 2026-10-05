package com.coresolution.consultation.constant;

/**
 * 수동 발송 수신자 선택 방식.
 *
 * @author MindGarden
 * @since 2026-10-05
 */
public enum ManualNotificationRecipientMode {
    /** 전체 내담자 − 제외 목록. 대상은 서버가 정한다. */
    ALL_CLIENTS,
    /** 관리자가 고른 사용자·직접 입력 번호. 서버가 같은 규칙으로 다시 거른다. */
    SELECTED
}
