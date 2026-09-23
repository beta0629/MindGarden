package com.coresolution.consultation.util;

/**
 * COMPLETED 상담 스케줄 수 기반 회기 완전 소비 SSOT.
 *
 * <p>산식: 매핑 {@code totalSessions > 0} 이고, 해당 mappingId(또는 legacy
 * {@code mappingId IS NULL} + 동일 consultant+client)의 상담 COMPLETED 스케줄 수
 * &gt;= {@code totalSessions} 이면 fully consumed.</p>
 *
 * <p>denormalized {@code remainingSessions}/{@code usedSessions} 가 stale 여도
 * assignment active·remaining 목록에서 제외해야 한다
 * (예: ACTIVE rem=1 used=0 total=1 + COMPLETED 1건).</p>
 *
 * @author CoreSolution
 * @since 2026-09-23
 */
public final class MappingSessionConsumptionSsot {

    private MappingSessionConsumptionSsot() {
    }

    /**
     * COMPLETED 상담 건수로 회기가 완전 소비되었는지 판정한다.
     *
     * @param totalSessions 매핑 총 회기 (null/&lt;=0 이면 false)
     * @param completedConsultationScheduleCount 해당 매핑 링크의 상담 COMPLETED 건수
     * @return fully consumed 이면 true
     */
    public static boolean isFullyConsumedByCompletedSchedules(
            Integer totalSessions,
            long completedConsultationScheduleCount) {
        if (totalSessions == null || totalSessions <= 0) {
            return false;
        }
        return completedConsultationScheduleCount >= totalSessions.longValue();
    }

    /**
     * 목록 응답용 effective remaining. fully consumed 이면 0 (DB heal 없음).
     *
     * @param remainingSessions denormalized 잔여
     * @param fullyConsumed {@link #isFullyConsumedByCompletedSchedules} 결과
     * @return FE rem&gt;0 필터와 정합하는 유효 잔여
     */
    public static int effectiveRemainingSessions(Integer remainingSessions, boolean fullyConsumed) {
        if (fullyConsumed) {
            return 0;
        }
        if (remainingSessions == null || remainingSessions < 0) {
            return 0;
        }
        return remainingSessions;
    }
}
