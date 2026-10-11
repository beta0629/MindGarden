package com.coresolution.consultation.dto;

import java.time.LocalDate;
import java.util.List;

import com.coresolution.consultation.util.ConsultationLogGroupMode;

import lombok.Builder;
import lombok.Getter;

/**
 * 상담일지 목록 응답의 묶음 요약.
 *
 * <p>{@code sessionCount}·첫·최근 상담일은 내담자를 고른 모드에서만 채운다.
 * 상담사 선택은 {@code clients} 의 내담자별 기간 집계를 쓴다.
 * 선택 없음은 건수를 싣지 않는다. 페이지 총건은 기존 {@code totalCount} 다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-11
 */
@Getter
@Builder
public class ConsultationLogGroupSummaryResponse {

    private final String mode;
    private final Long sessionCount;
    private final LocalDate firstSessionDate;
    private final LocalDate lastSessionDate;
    private final List<ConsultationLogClientPeriodResponse> clients;

    /**
     * @return 묶지 않는 목록. 기간 건수는 없다
     */
    public static ConsultationLogGroupSummaryResponse none() {
        return ConsultationLogGroupSummaryResponse.builder()
                .mode(ConsultationLogGroupMode.NONE.name())
                .clients(List.of())
                .build();
    }
}
