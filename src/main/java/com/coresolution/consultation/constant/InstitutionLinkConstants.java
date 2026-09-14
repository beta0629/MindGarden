package com.coresolution.consultation.constant;

/**
 * 타기관 연계 SSOT. 회기권 remainingSessions·바우처와 섞지 않는다.
 *
 * <p>재무: {@code docs/project-management/INSTITUTION_LINK_FINANCE.md}</p>
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
public final class InstitutionLinkConstants {

    /**
     * 내담자 engagement / 매핑 paymentTiming 공통 값 (타기관 연계).
     */
    public static final String ENGAGEMENT_TYPE = "INSTITUTION_LINK";

    /**
     * {@code consultant_client_mappings.payment_timing} — 타기관 연계.
     * {@link #ENGAGEMENT_TYPE} 과 동일 코드값.
     */
    public static final String PAYMENT_TIMING = ENGAGEMENT_TYPE;

    /**
     * 회기권 선납(패키지) paymentTiming.
     */
    public static final String PAYMENT_TIMING_ADVANCE = "ADVANCE";

    /**
     * 공통코드 {@code INSTITUTION_LINK_CONTRACT_STATUS} 진행.
     */
    public static final String STATUS_ACTIVE = "ACTIVE";

    /**
     * 공통코드 {@code INSTITUTION_LINK_CONTRACT_STATUS} 선납.
     */
    public static final String STATUS_PREPAID = "PREPAID";

    /**
     * 공통코드 그룹.
     */
    public static final String CONTRACT_STATUS_GROUP = "INSTITUTION_LINK_CONTRACT_STATUS";

    /**
     * 청구 연월 형식.
     */
    public static final String BILLING_YEAR_MONTH_PATTERN = "yyyy-MM";

    private InstitutionLinkConstants() {
    }
}
