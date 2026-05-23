package com.coresolution.consultation.constant;

import java.util.Set;

/**
 * 푸시 발송 화이트리스트(D-4).
 *
 * <p>운영 결정(2026-05-23 라운드): 결제·예약·매칭 관련 푸시는 다음 5건만 허용한다.
 * <ul>
 *   <li>{@link MobilePushCanonicalTypes#PAYMENT_COMPLETED} — 입금/결제 확인</li>
 *   <li>{@link MobilePushCanonicalTypes#BOOKING_CONFIRMED} — 예약 확정(첫상담 시 내담자 단독)</li>
 *   <li>{@link MobilePushCanonicalTypes#BOOKING_RESCHEDULED} — 예약 일정 변경</li>
 *   <li>{@link MobilePushCanonicalTypes#MAPPING_APPROVED} — 어드민 매칭 승인(내담자 단독)</li>
 *   <li>{@link MobilePushCanonicalTypes#BOOKING_REMINDER} — D-2 리마인더(내담자·상담사 양쪽)</li>
 * </ul>
 * 그 외(취소·실패·환불 등)는 푸시만 차단하며, 알림톡/SMS 등 다른 채널은 영향 없음.</p>
 *
 * @author MindGarden
 * @since 2026-05-23
 */
public final class MobilePushAllowedEvents {

    private MobilePushAllowedEvents() {
    }

    /** 푸시 발송이 허용된 canonical 이벤트 코드(불변). */
    public static final Set<String> PUSH_ALLOWED_EVENTS = Set.of(
            MobilePushCanonicalTypes.BOOKING_CONFIRMED,
            MobilePushCanonicalTypes.BOOKING_RESCHEDULED,
            MobilePushCanonicalTypes.PAYMENT_COMPLETED,
            MobilePushCanonicalTypes.MAPPING_APPROVED,
            MobilePushCanonicalTypes.BOOKING_REMINDER);

    /**
     * 해당 canonical 이벤트 코드가 푸시 발송이 허용된 코드인지 여부.
     *
     * @param canonicalType {@link MobilePushCanonicalTypes} 코드
     * @return 허용 여부
     */
    public static boolean isAllowed(String canonicalType) {
        return canonicalType != null && PUSH_ALLOWED_EVENTS.contains(canonicalType);
    }
}
