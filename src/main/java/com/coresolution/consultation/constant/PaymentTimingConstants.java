package com.coresolution.consultation.constant;

/**
 * 매핑 결제 시점({@code consultant_client_mappings.payment_timing}) SSOT.
 *
 * <p>컬럼은 VARCHAR(32)이다. 공통코드 그룹이 도입되기 전까지 이 상수를 단일 소스로 쓴다.
 * 회기권({@link #ADVANCE})·당일카드({@link #SAME_DAY_CARD})와 타기관 연계({@link #INSTITUTION_LINK})는
 * 별 파이프라인이다. 바우처({@code VOUCHER})는 이 슬라이스에 두지 않는다.</p>
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
     * 타기관 연계(월 단위). 회기권 {@code remainingSessions} / {@code SESSIONS_EXHAUSTED} 와 분리한다.
     * 초기 상담 선납은 기존 입금확인으로 ACTIVE 가 된 뒤, 잔여 0이어도 일정·일지가 가능하다.
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
     * 회기권 잔여({@code remainingSessions})로 일정·일지를 막는 타입인지.
     * 타기관 연계는 false. 레거시 null 과 ADVANCE·SAME_DAY_CARD 는 true.
     *
     * @param paymentTiming 매핑 {@code payment_timing}
     * @return 회기 잔여 게이트를 적용하면 true
     */
    public static boolean usesSessionPackRemainingGate(String paymentTiming) {
        return !isInstitutionLink(paymentTiming);
    }
}
