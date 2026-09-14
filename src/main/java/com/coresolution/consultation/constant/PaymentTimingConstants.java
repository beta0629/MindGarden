package com.coresolution.consultation.constant;

/**
 * 매핑 결제 시점({@code consultant_client_mappings.payment_timing}) SSOT.
 *
 * <p>컬럼은 VARCHAR(32)이다. 공통코드 그룹이 도입되기 전까지 이 상수를 단일 소스로 쓴다.
 * 회기권({@link #ADVANCE})·당일카드({@link #SAME_DAY_CARD})와 타기관 연계({@link #INSTITUTION_LINK})는
 * 별 파이프라인이다. 바우처({@link #VOUCHER})는 상수·게이트 훅만 두고 원장 풀세트는 이 슬라이스에 두지 않는다.</p>
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
     * 타기관 연계. 회기권 {@code remainingSessions} / {@code SESSIONS_EXHAUSTED} 와 분리한다.
     * 결제 주기(월 등)는 고정하지 않는다. 초기 상담 선납은 기존 입금확인으로 ACTIVE 가 된 뒤,
     * 잔여 0이어도 일정·일지가 가능하다.
     */
    public static final String INSTITUTION_LINK = "INSTITUTION_LINK";

    /**
     * 바우처 연계 훅. 원장·매출 파이프라인은 미구현이지만,
     * ADVANCE 전용 하드코딩 필터에서 제외되도록 상수·판별만 둔다.
     */
    public static final String VOUCHER = "VOUCHER";

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
     * 타기관 연계 시점인지 — null/대소문자 안전.
     *
     * @param paymentTiming 매핑 {@code payment_timing}
     * @return INSTITUTION_LINK 이면 true
     */
    public static boolean isInstitutionLink(String paymentTiming) {
        return INSTITUTION_LINK.equalsIgnoreCase(paymentTiming);
    }

    /**
     * 바우처 시점인지 — null/대소문자 안전. 원장 미구현이어도 필터 훅으로 사용한다.
     *
     * @param paymentTiming 매핑 {@code payment_timing}
     * @return VOUCHER 이면 true
     */
    public static boolean isVoucher(String paymentTiming) {
        return VOUCHER.equalsIgnoreCase(paymentTiming);
    }

    /**
     * 회기권 잔여({@code remainingSessions})로 일정·일지를 막는 타입인지.
     * 타기관·바우처는 false. 레거시 null 과 ADVANCE·SAME_DAY_CARD 는 true.
     *
     * @param paymentTiming 매핑 {@code payment_timing}
     * @return 회기 잔여 게이트를 적용하면 true
     */
    public static boolean usesSessionPackRemainingGate(String paymentTiming) {
        return !isInstitutionLink(paymentTiming) && !isVoucher(paymentTiming);
    }

    /**
     * 대시보드·집계 쿼리에서 ADVANCE 전용으로 좁히면 안 되는 비회기권 시점인지.
     *
     * @param paymentTiming 매핑 {@code payment_timing}
     * @return INSTITUTION_LINK 또는 VOUCHER 이면 true
     */
    public static boolean isNonSessionPackEngagementTiming(String paymentTiming) {
        return isInstitutionLink(paymentTiming) || isVoucher(paymentTiming);
    }
}
