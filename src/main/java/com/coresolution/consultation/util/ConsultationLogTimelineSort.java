package com.coresolution.consultation.util;

/**
 * 내담자를 고른 상담일지 타임라인 정렬.
 * 기본은 최근 순이다. 회기 순은 요청이 있을 때만 쓴다.
 *
 * @author CoreSolution
 * @since 2026-10-11
 */
public enum ConsultationLogTimelineSort {

    /** 상담일 내림차순. 같으면 회기 내림차순. */
    RECENT,
    /** 회기 오름차순. 같으면 상담일 오름차순. */
    SESSION;

    /**
     * @param raw 쿼리 값. 없거나 알 수 없으면 최근 순
     * @return 정렬
     */
    public static ConsultationLogTimelineSort from(String raw) {
        if (raw != null && "session".equalsIgnoreCase(raw.trim())) {
            return SESSION;
        }
        return RECENT;
    }
}
