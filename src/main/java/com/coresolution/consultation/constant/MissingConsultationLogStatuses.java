package com.coresolution.consultation.constant;

import java.util.Collections;
import java.util.EnumSet;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 상담일지 누락 판정 대상 일정 상태.
 *
 * <p>{@code ScheduleServiceImpl}·{@code ConsultantDashboardServiceImpl} 의 누락 집계 대상과 같은 집합이다
 * (지난 일정 + 일지 미작성이면 COMPLETED 승격이 보류되어 CONFIRMED·BOOKED 로 남는다). 프로시저에는 CSV 로 넘긴다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
public final class MissingConsultationLogStatuses {

    /** 누락 판정 대상 상태 */
    public static final Set<ScheduleStatus> TARGET = Collections.unmodifiableSet(
            EnumSet.of(ScheduleStatus.COMPLETED, ScheduleStatus.CONFIRMED, ScheduleStatus.BOOKED));

    private MissingConsultationLogStatuses() {
    }

    /**
     * 프로시저 {@code p_statuses}(FIND_IN_SET) 인자.
     *
     * @return 상태 이름 CSV
     */
    public static String toProcedureCsv() {
        return TARGET.stream().map(Enum::name).sorted().collect(Collectors.joining(","));
    }
}
