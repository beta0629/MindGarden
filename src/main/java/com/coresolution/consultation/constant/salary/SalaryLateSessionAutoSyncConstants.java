package com.coresolution.consultation.constant.salary;

/**
 * 스케줄 COMPLETED 전이 시 늦은 회기 급여 자동 동기화 상수.
 *
 * @author CoreSolution
 * @since 2026-08-29
 */
public final class SalaryLateSessionAutoSyncConstants {

    /**
     * Recalc/Adjustment SP {@code triggered_by} — 자동 write-path 훅 식별자.
     */
    public static final String TRIGGERED_BY = "SALARY_LATE_SESSION_AUTO_SYNC";

    private SalaryLateSessionAutoSyncConstants() {
    }
}
