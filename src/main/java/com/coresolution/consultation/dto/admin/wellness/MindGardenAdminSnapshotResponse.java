package com.coresolution.consultation.dto.admin.wellness;

/**
 * 인메모리 「마음 정원」상태 스냅샷(사용자 PK·점수·주간 집계).
 *
 * @param clientUserId           내담자 사용자 PK
 * @param revision                 서버 리비전
 * @param stageIndex               단계 인덱스
 * @param totalPoints              누적 성장점
 * @param weeklyPointsCredited     이번 주 반영 성장점
 * @param weekKey                  주간 키
 * @param unlockedElementCount     해금 요소 수
 * @param lastSyncedAt             마지막 동기화(ISO-8601, 없으면 null)
 * @author MindGarden
 * @since 2026-05-14
 */
public record MindGardenAdminSnapshotResponse(
        long clientUserId,
        long revision,
        int stageIndex,
        int totalPoints,
        int weeklyPointsCredited,
        String weekKey,
        int unlockedElementCount,
        String lastSyncedAt) {
}
