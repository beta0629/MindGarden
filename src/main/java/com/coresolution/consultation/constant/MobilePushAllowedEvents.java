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
 * <p>2026-05-26 Phase 0 추가({@code SESSION_MANAGEMENT_POLICY_DECISIONS.md} Q3=3A·보조=C):
 * <ul>
 *   <li>{@link MobilePushCanonicalTypes#REFUND_AUTO_CANCEL} — 부분 환불/강제 종료로 회기 소진 시
 *       미래 예약 일괄 취소 통지. 약관·전자상거래법상 의무 통지에 해당하여 사용자 선호도와
 *       무관하게 4채널 동시 발송({@code dispatchAutoCancellation} 전용 경로)에서만 사용한다.</li>
 * </ul></p>
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
            MobilePushCanonicalTypes.BOOKING_REMINDER,
            MobilePushCanonicalTypes.REFUND_AUTO_CANCEL);

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
