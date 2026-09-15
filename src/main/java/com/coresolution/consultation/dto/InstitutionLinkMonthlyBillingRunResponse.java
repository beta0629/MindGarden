package com.coresolution.consultation.dto;

import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 타기관 연계 월청구 실행 결과.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstitutionLinkMonthlyBillingRunResponse {

    /**
     * 청구 대상 연월 ({@code yyyy-MM}).
     */
    private String yearMonth;

    /**
     * 신규 RECEIVABLES 건수.
     */
    private int chargedCount;

    /**
     * 스킵 총건 (금액0·기간외·기청구·상태 제외 포함).
     */
    private int skippedCount;

    /**
     * monthly_amount &lt;= 0 스킵.
     */
    private int skippedZeroAmount;

    /**
     * period 밖 스킵.
     */
    private int skippedOutOfPeriod;

    /**
     * 동일 계약+연월 기청구 스킵.
     */
    private int skippedAlreadyBilled;

    /**
     * 청구된 계약 ID.
     */
    @Builder.Default
    private List<Long> chargedContractIds = new ArrayList<>();
}
