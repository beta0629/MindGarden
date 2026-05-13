package com.coresolution.consultation.dto;

/**
 * 이벤트 적용 결과 — Expo {@code GardenGrowthApplyResult} 및 갱신된 서버 상태.
 *
 * @param earned                   이번 호출에서 실제 반영된 점수
 * @param duplicate                멱등 키로 이미 처리된 요청이면 true
 * @param weeklyCapReached         주간 상한으로 일부 또는 전부 미반영이면 true
 * @param remainingWeeklyBudget    적용 후 남은 주간 한도
 * @param state                    적용 직후 서버 권위 상태
 * @author MindGarden
 * @since 2026-05-13
 */
public record MindGardenEventApplyResponse(
        int earned,
        boolean duplicate,
        boolean weeklyCapReached,
        int remainingWeeklyBudget,
        MindGardenServerStateResponse state) {
}
