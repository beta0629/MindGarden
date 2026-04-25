package com.coresolution.consultation.constant;

/**
 * 사용자 알림 수신 채널 선호(카카오 알림톡 계열 / SMS / 테넌트 기본).
 *
 * @author CoreSolution
 * @since 2026-04-24
 */
public enum NotificationChannelPreferenceCode {

    /** HIGH=알림톡→SMS, MEDIUM=SMS→알림톡 등 기존 priority 정책 + 레거시 notification_preferences 반영 */
    TENANT_DEFAULT,

    /** 가능 시 알림톡 우선, 불가 시 SMS */
    KAKAO,

    /** 가능 시 SMS 우선, 불가 시 알림톡 */
    SMS;

    /**
     * DB 저장값 파싱. 비어 있거나 알 수 없으면 {@link #TENANT_DEFAULT}.
     *
     * @param stored DB 문자열
     * @return 열거값
     */
    public static NotificationChannelPreferenceCode fromStored(String stored) {
        if (stored == null || stored.isBlank()) {
            return TENANT_DEFAULT;
        }
        try {
            return NotificationChannelPreferenceCode.valueOf(stored.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return TENANT_DEFAULT;
        }
    }
}
