package com.coresolution.consultation.service;

import java.time.LocalDate;
import com.coresolution.consultation.constant.SessionStatisticsGranularity;
import com.coresolution.consultation.dto.response.ConsultantSessionStatisticsResponse;

/**
 * 상담사 본인 완료(COMPLETED) 회기 수 기간·단위 집계.
 *
 * @author CoreSolution
 * @since 2026-05-16
 */
public interface ConsultantCompletedSessionStatisticsService {

    /**
     * 테넌트·상담사 스코프에서 완료 일정을 집계한다.
     *
     * @param tenantId 테넌트 ID(비어 있으면 안 됨)
     * @param consultantId 상담사 사용자 ID
     * @param startDate 조회 시작일(포함)
     * @param endDate 조회 종료일(포함)
     * @param granularity 버킷 단위
     * @return 총합·버킷·이전 동일 길이 기간 합계
     * @throws IllegalArgumentException 날짜 역전·허용 일수 초과
     */
    ConsultantSessionStatisticsResponse aggregateCompletedSessions(
            String tenantId,
            Long consultantId,
            LocalDate startDate,
            LocalDate endDate,
            SessionStatisticsGranularity granularity);
}
