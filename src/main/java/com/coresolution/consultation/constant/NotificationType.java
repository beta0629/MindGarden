package com.coresolution.consultation.constant;

/**
 * 사용자별 in-app 알림({@code notifications.notification_type}) 타입 enum.
 *
 * <p>broadcast {@code system_notifications} 와 분리된 수신자 단일-행 in-app 알림의
 * 분류. 한국어 라벨은 {@link #getMessageKey()} 가 반환하는 i18n 키로 분리 관리한다
 * (하드코딩 게이트 §17.1 정합).</p>
 *
 * <p>code 값은 Flyway V20260604_001 의 {@code notifications.notification_type VARCHAR(40)}
 * 컬럼에 그대로 적재된다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-04
 */
public enum NotificationType {

    SYSTEM("SYSTEM", "enums.NotificationType.SYSTEM"),
    WITHDRAWAL("WITHDRAWAL", "enums.NotificationType.WITHDRAWAL"),
    MAPPING("MAPPING", "enums.NotificationType.MAPPING"),
    PAYMENT("PAYMENT", "enums.NotificationType.PAYMENT"),
    WELLNESS("WELLNESS", "enums.NotificationType.WELLNESS"),
    SCHEDULE("SCHEDULE", "enums.NotificationType.SCHEDULE"),
    MESSAGE("MESSAGE", "enums.NotificationType.MESSAGE"),
    SHOP_ORDER("SHOP_ORDER", "enums.NotificationType.SHOP_ORDER");

    private final String code;
    private final String messageKey;

    NotificationType(String code, String messageKey) {
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
     * 코드 문자열로 enum 을 찾는다.
     *
     * @param code notifications.notification_type 코드
     * @return 매칭되는 enum
     * @throws IllegalArgumentException 알 수 없는 코드일 때
     */
    public static NotificationType fromCode(String code) {
        if (code == null) {
            throw new IllegalArgumentException("NotificationType code is null");
        }
        for (NotificationType value : values()) {
            if (value.code.equals(code)) {
                return value;
            }
        }
        throw new IllegalArgumentException("Unknown NotificationType code: " + code);
    }
}
