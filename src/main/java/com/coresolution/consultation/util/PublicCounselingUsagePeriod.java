package com.coresolution.consultation.util;

/**
 * 공개 상품 이용기간 표기. 개월 수가 없으면 이미 고지된 회기 규칙만 쓴다.
 * 단회기 2개월, 10회기 3개월, 20회기 6개월. 그 외 회기는 개월을 만들지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-02
 */
public final class PublicCounselingUsagePeriod {

    /** 단회기 회기 수. */
    public static final int SESSIONS_SINGLE = 1;

    /** 단회기 이용기간(개월). */
    public static final int MONTHS_SINGLE = 2;

    /** 10회기. */
    public static final int SESSIONS_TEN = 10;

    /** 10회기 이용기간(개월). */
    public static final int MONTHS_TEN = 3;

    /** 20회기. */
    public static final int SESSIONS_TWENTY = 20;

    /** 20회기 이용기간(개월). */
    public static final int MONTHS_TWENTY = 6;

    private PublicCounselingUsagePeriod() {
    }

    /**
     * 이용기간 문구. 비어 있으면 빈 문자열. 「—」는 쓰지 않는다.
     *
     * @param validityMonths 상품 개월. 없으면 null
     * @param sessions 회기 수. 없으면 null
     * @return 표시 문구
     */
    public static String label(Integer validityMonths, Integer sessions) {
        if (validityMonths != null && validityMonths > 0) {
            return fromPayment(validityMonths);
        }
        if (sessions == null || sessions < SESSIONS_SINGLE) {
            return "";
        }
        if (sessions == SESSIONS_SINGLE) {
            return fromPayment(MONTHS_SINGLE);
        }
        if (sessions == SESSIONS_TEN) {
            return fromPayment(MONTHS_TEN);
        }
        if (sessions == SESSIONS_TWENTY) {
            return fromPayment(MONTHS_TWENTY);
        }
        return sessions + "회기";
    }

    /**
     * 회기 열 문구.
     *
     * @param sessions 회기 수
     * @return 「N회기」 또는 빈 문자열
     */
    public static String sessionsLabel(Integer sessions) {
        if (sessions == null || sessions < SESSIONS_SINGLE) {
            return "";
        }
        return sessions + "회기";
    }

    private static String fromPayment(int months) {
        return "결제일부터 " + months + "개월";
    }
}
