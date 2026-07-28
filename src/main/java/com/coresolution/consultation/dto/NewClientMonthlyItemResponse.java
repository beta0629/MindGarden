package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 월별 신규 내담자 유입 집계 항목.
 *
 * @author CoreSolution
 * @since 2026-07-28
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NewClientMonthlyItemResponse {

    /** 기간 라벨 (yyyy-MM) */
    private String period;

    /** 해당 월 신규 CLIENT 등록 수 */
    private long newClientCount;

    /**
     * 전월 대비 증감률(%). 첫 구간·전월 0건이면 null.
     */
    private Double growthRate;
}
