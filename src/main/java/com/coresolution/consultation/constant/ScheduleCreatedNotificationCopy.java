package com.coresolution.consultation.constant;

import com.coresolution.consultation.util.ConsultationMessageTypeCodes;

/**
 * 일정 등록(BOOKED/CONFIRMED) 인앱·푸시 알림 문구·메시지 유형 SSOT.
 *
 * @author MindGarden
 * @since 2026-05-18
 */
public final class ScheduleCreatedNotificationCopy {

    /** 내담자 예약 확인 — DB message_type(≤20자) */
    public static final String MESSAGE_TYPE_CLIENT = ConsultationMessageTypeCodes.CANONICAL_APPOINTMENT;
    public static final String COMMON_CODE_KEY_CLIENT = ConsultationMessageTypeCodes.CANONICAL_APPOINTMENT;

    /** 상담사 신규 예약 */
    public static final String MESSAGE_TYPE_CONSULTANT = ConsultationMessageTypeCodes.CANONICAL_NEW_APPOINTMENT;
    public static final String COMMON_CODE_KEY_CONSULTANT = ConsultationMessageTypeCodes.CANONICAL_NEW_APPOINTMENT;

    public static final String TITLE_CLIENT = "예약 확인";
    public static final String TITLE_CONSULTANT = "새 예약";

    private ScheduleCreatedNotificationCopy() {
    }
}
