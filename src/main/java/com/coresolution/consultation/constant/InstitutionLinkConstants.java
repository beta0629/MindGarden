package com.coresolution.consultation.constant;

/**
 * 타기관 연계 등록 SSOT. 회기권 remainingSessions·바우처와 섞지 않는다.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
public final class InstitutionLinkConstants {

    /**
     * 타기관 연계(최가을). 바우처 아님.
     */
    public static final String ENGAGEMENT_TYPE = "INSTITUTION_LINK";

    /**
     * 공통코드 {@code INSTITUTION_LINK_CONTRACT_STATUS} 진행.
     */
    public static final String STATUS_ACTIVE = "ACTIVE";

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
