package com.coresolution.consultation.dto.admin.wellness;

/**
 * 테넌트 단위 마음 정원 관측 요약(인메모리 백엔드 한계 안내 포함).
 *
 * @param usersWithSnapshot        스냅샷이 존재하는 내담자 수
 * @param sumTotalPoints           누적 성장점 합
 * @param maxTotalPoints           사용자별 누적 성장점 최댓값
 * @param averageTotalPoints       사용자당 평균 누적 성장점
 * @param maxStageIndex            관측된 최대 단계 인덱스
 * @param singleNodeInMemoryScope  단일 노드 인메모리 저장소 여부(운영 시 참고)
 * @author MindGarden
 * @since 2026-05-14
 */
public record MindGardenAdminSummaryResponse(
        long usersWithSnapshot,
        long sumTotalPoints,
        int maxTotalPoints,
        double averageTotalPoints,
        int maxStageIndex,
        boolean singleNodeInMemoryScope) {
}
