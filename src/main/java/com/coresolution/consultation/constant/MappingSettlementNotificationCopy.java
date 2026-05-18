package com.coresolution.consultation.constant;

/**
 * 매칭 정산 알림 카피(인앱·푸시). 어드민 인박스 키워드(결제·입금·승인)와 정합.
 *
 * @author MindGarden
 * @since 2026-05-18
 */
public final class MappingSettlementNotificationCopy {

    private MappingSettlementNotificationCopy() {
    }

    public static final String TITLE_PAYMENT_CONFIRMED = "결제 확인";
    public static final String TITLE_DEPOSIT_CONFIRMED = "입금 확인";
    public static final String TITLE_MAPPING_APPROVED = "매칭 승인";

    public static final String PUSH_TITLE_PAYMENT = "결제 확인";
    public static final String PUSH_TITLE_DEPOSIT = "입금 확인";
    public static final String PUSH_TITLE_APPROVED = "매칭 승인";

    public static final String MESSAGE_TYPE_PAYMENT = "PAYMENT_COMPLETION";

    public static final String BODY_PAYMENT_CONFIRMED_FMT =
            "매칭 결제가 확인되었습니다.\n패키지: %s\n금액: %s원";
    public static final String BODY_DEPOSIT_CONFIRMED_FMT =
            "입금이 확인되었습니다.\n패키지: %s\n금액: %s원";
    public static final String BODY_MAPPING_APPROVED_FMT =
            "상담 매칭이 승인되었습니다.\n패키지: %s";

    public static final String BODY_PUSH_PAYMENT = "매칭 결제가 확인되었습니다.";
    public static final String BODY_PUSH_DEPOSIT = "입금이 확인되었습니다.";
    public static final String BODY_PUSH_APPROVED_CLIENT = "상담 매칭이 승인되었습니다.";
    public static final String BODY_PUSH_APPROVED_CONSULTANT = "새 상담 매칭이 승인되었습니다.";

    public static final String FALLBACK_PACKAGE_NAME = "상담 패키지";
    public static final String FALLBACK_AMOUNT = "미정";
}
