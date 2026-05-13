package com.coresolution.consultation.dto;

import java.util.List;

/**
 * Expo {@code MindGardenServerState} 와 필드명·의미를 맞춘 응답 DTO.
 *
 * @param revision               낙관적 동기화용 단조 증가 리비전
 * @param stageIndex             누적 점수 기준 단계 인덱스
 * @param totalPoints            누적 성장점
 * @param weeklyPointsCredited   이번 주에 반영된 성장점 합
 * @param weekKey                주간 집계 키 (월요일 YYYY-MM-DD)
 * @param unlockedElementIds     해금된 시각 요소 ID 목록
 * @param lastSyncedAt           서버 기준 마지막 갱신 시각(ISO-8601), 없으면 null
 * @author MindGarden
 * @since 2026-05-13
 */
public record MindGardenServerStateResponse(
        long revision,
        int stageIndex,
        int totalPoints,
        int weeklyPointsCredited,
        String weekKey,
        List<String> unlockedElementIds,
        String lastSyncedAt) {
}
