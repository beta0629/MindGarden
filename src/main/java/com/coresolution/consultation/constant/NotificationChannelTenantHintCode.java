package com.coresolution.consultation.constant;

/**
 * 테넌트 기본(HIGH 우선순위 1순위) 채널 힌트 API 값.
 *
 * @author CoreSolution
 * @since 2026-04-24
 */
public enum NotificationChannelTenantHintCode {

    /** 알림톡이 1순위로 가정될 때 */
    KAKAO,

    /** SMS가 1순위로 가정될 때 */
    SMS,

    /** 둘 다 인프라 불가 */
    NONE
}
