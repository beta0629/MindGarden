package com.coresolution.consultation.constant;

import java.util.Locale;

/**
 * 완료 회기 통계 버킷 단위(쿼리 파라미터 {@code granularity}).
 *
 * @author CoreSolution
 * @since 2026-05-16
 */
public enum SessionStatisticsGranularity {

    DAY,
    WEEK,
    MONTH;

    /**
     * API 쿼리 값(대문자)을 enum으로 변환한다.
     *
     * @param raw 쿼리 문자열
     * @return 대응 enum
     * @throws IllegalArgumentException null·공백·지원하지 않는 값
     */
    public static SessionStatisticsGranularity fromApiParam(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("granularity는 필수입니다.");
        }
        try {
            return SessionStatisticsGranularity.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "granularity는 DAY, WEEK, MONTH 중 하나여야 합니다. 입력값: " + raw.trim());
        }
    }
}
