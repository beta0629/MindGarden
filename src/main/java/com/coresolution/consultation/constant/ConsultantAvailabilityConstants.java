package com.coresolution.consultation.constant;

/**
 * 상담사 상담 가능 시간(availability) 관련 상수.
 *
 * @author CoreSolution
 * @since 2026-09-08
 */
public final class ConsultantAvailabilityConstants {

    /**
     * 가능 시간 설정 최소 선행일수 (Asia/Seoul 기준 today + N일부터 허용).
     * D-0·D-1은 fail-closed 거부.
     */
    public static final int AVAILABILITY_MIN_LEAD_DAYS = 2;

    private ConsultantAvailabilityConstants() {
    }
}
