package com.coresolution.consultation.dto;

import java.time.LocalDate;

import lombok.Builder;
import lombok.Getter;

/**
 * 상담일지 조회 응답의 내담자별 기간 집계.
 * 현재 페이지에 보이는 행 수가 아니라 같은 필터의 기간 전체다.
 *
 * @author CoreSolution
 * @since 2026-10-11
 */
@Getter
@Builder
public class ConsultationLogClientPeriodResponse {

    private final Long clientId;
    private final long sessionCount;
    private final LocalDate firstSessionDate;
    private final LocalDate lastSessionDate;
}
