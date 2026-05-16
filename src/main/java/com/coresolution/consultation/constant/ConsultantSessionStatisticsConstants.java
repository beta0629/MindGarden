package com.coresolution.consultation.constant;

/**
 * 상담사 본인 완료 회기 통계 API 상수.
 *
 * @author CoreSolution
 * @since 2026-05-16
 */
public final class ConsultantSessionStatisticsConstants {

    private ConsultantSessionStatisticsConstants() {
    }

    /**
     * 조회 허용 최대 기간(일). 초과 시 400으로 거절하여 과도한 집계 부하를 방지한다.
     */
    public static final int MAX_QUERY_RANGE_DAYS_INCLUSIVE = 731;
}
