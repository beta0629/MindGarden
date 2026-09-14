package com.coresolution.consultation.constant;

/**
 * 매핑 결제 시점({@code consultant_client_mappings.payment_timing}) SSOT.
 *
 * <p>컬럼은 VARCHAR(32)이다. 회기권({@link #ADVANCE})·당일카드({@link #SAME_DAY_CARD})와
 * 타기관 연계({@link #INSTITUTION_LINK})는 별 파이프라인이다.
 * 바우처({@code VOUCHER}) 상수는 이 슬라이스에 두지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
public final class PaymentTimingConstants {

    /** 선납 입금(회기권). 레거시 {@code null} 과 동등. */
    public static final String ADVANCE = "ADVANCE";

    /** 당일 방문 카드 결제 후 활성화 (옵션 B). */
    public static final String SAME_DAY_CARD = "SAME_DAY_CARD";

    /**
     * 타기관 연계(월 단위). 회기권 {@code remainingSessions} 와 분리한다.
     * 가예약(TENTATIVE) 일정 저장만 이 상수로 허용한다. 일지 {@code sessionNumber} 우회에는 쓰지 않는다.
     */
    public static final String INSTITUTION_LINK = "INSTITUTION_LINK";

    private PaymentTimingConstants() {
    }

    /**
     * 당일 카드 결제 시점인지 — null/대소문자 안전.
     *
     * @param paymentTiming 매핑 {@code payment_timing}
     * @return SAME_DAY_CARD 이면 true
     */
    public static boolean isSameDayCard(String paymentTiming) {
        return SAME_DAY_CARD.equalsIgnoreCase(paymentTiming);
    }

    /**
     * 타기관 연계(월 단위) 시점인지 — null/대소문자 안전.
     *
     * @param paymentTiming 매핑 {@code payment_timing}
     * @return INSTITUTION_LINK 이면 true
     */
    public static boolean isInstitutionLink(String paymentTiming) {
        return INSTITUTION_LINK.equalsIgnoreCase(paymentTiming);
    }

    /**
     * PENDING 가예약 일정을 회기 잔여 없이 저장할 수 있는 결제 시점인지.
     *
     * <p>일지/CONFIRMED {@code sessionSequence} 우회에 사용하지 않는다.</p>
     *
     * @param paymentTiming 매핑 {@code payment_timing}
     * @return SAME_DAY_CARD 또는 INSTITUTION_LINK 이면 true
     */
    public static boolean allowsTentativeScheduleWithoutRemaining(String paymentTiming) {
        return isSameDayCard(paymentTiming) || isInstitutionLink(paymentTiming);
    }
}
