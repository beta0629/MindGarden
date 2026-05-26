package com.coresolution.consultation.constant;

import com.coresolution.consultation.entity.MobilePushSettings;

/**
 * 모바일 푸시 설정({@link MobilePushSettings}) 카테고리와 canonical type 매핑.
 *
 * @author MindGarden
 * @since 2026-05-16
 */
public enum MobilePushNotificationCategory {

    /** schedule_* · booking_* · session_* · consultation_record_* */
    SCHEDULE,
    /** payment_* · session_low */
    PAYMENT,
    /** new_message */
    MESSAGE,
    /** mood_reminder */
    WELLNESS,
    /** system_notice */
    SYSTEM;

    /**
     * canonical type 문자열에 대응하는 알림 설정 카테고리를 반환한다.
     *
     * @param canonicalType {@link MobilePushCanonicalTypes} 등 snake_case type
     * @return 카테고리
     */
    public static MobilePushNotificationCategory forCanonicalType(String canonicalType) {
        if (canonicalType == null || canonicalType.isBlank()) {
            return SYSTEM;
        }
        return switch (canonicalType) {
            case MobilePushCanonicalTypes.PAYMENT_COMPLETED,
                    MobilePushCanonicalTypes.PAYMENT_FAILED,
                    MobilePushCanonicalTypes.SESSION_LOW,
                    MobilePushCanonicalTypes.SHOP_ORDER_PAID,
                    MobilePushCanonicalTypes.SHOP_PAYMENT_FAILED,
                    MobilePushCanonicalTypes.POINT_EARNED,
                    MobilePushCanonicalTypes.SHOP_ORDER_REFUNDED -> PAYMENT;
            case MobilePushCanonicalTypes.SHOP_ORDER_HOLD_EXPIRED,
                    MobilePushCanonicalTypes.SHOP_FULFILLMENT_COMPLETED -> SYSTEM;
            case "new_message" -> MESSAGE;
            case "mood_reminder",
                    MobilePushCanonicalTypes.MIND_WEATHER_SHARED -> WELLNESS;
            case "system_notice",
                    MobilePushCanonicalTypes.MAPPING_APPROVED,
                    MobilePushCanonicalTypes.ADMIN_ANNOUNCEMENT,
                    MobilePushCanonicalTypes.REFUND_AUTO_CANCEL -> SYSTEM;
            default -> SCHEDULE;
        };
    }

    /**
     * 사용자 설정에서 해당 카테고리 발송이 허용되는지 여부.
     *
     * @param settings 설정 엔티티
     * @return 허용 여부
     */
    public boolean isEnabledOn(MobilePushSettings settings) {
        return switch (this) {
            case SCHEDULE -> settings.isScheduleEnabled();
            case PAYMENT -> settings.isPaymentEnabled();
            case MESSAGE -> settings.isMessageEnabled();
            case WELLNESS -> settings.isWellnessEnabled();
            case SYSTEM -> settings.isSystemEnabled();
        };
    }
}
