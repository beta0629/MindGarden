package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.SessionSuccessionConstants;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.util.LeftoverOccupyingCompleteExhaustBackfill.Decision;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * leftover occupying 완료 rem 백필 판정 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-09-12
 */
@DisplayName("LeftoverOccupyingCompleteExhaustBackfill")
class LeftoverOccupyingCompleteExhaustBackfillTest {

    @Test
    @DisplayName("동형 leftover: rem 소진 시 usedSessions 증가 + total == used + remaining + SESSIONS_EXHAUSTED")
    void leftoverCompleted_matchingRem_appliesExhaust() {
        long scheduleId = nextId();
        ConsultantClientMapping mapping = leftoverSource(1);
        int usedBefore = mapping.getUsedSessions();
        int totalBefore = mapping.getTotalSessions();
        Schedule completed = completedOccupying(scheduleId, 1, LocalDateTime.now());

        Decision decision = LeftoverOccupyingCompleteExhaustBackfill.decide(mapping, 0, 1, false);
        boolean applied = LeftoverOccupyingCompleteExhaustBackfill.applyIfEligible(
                mapping, List.of(completed), 0, 1, false);

        assertThat(decision).isEqualTo(Decision.APPLY);
        assertThat(applied).isTrue();
        assertThat(mapping.getRemainingSessions()).isZero();
        assertThat(mapping.getUsedSessions()).isEqualTo(usedBefore + 1);
        assertThat(mapping.getTotalSessions()).isEqualTo(totalBefore);
        assertThat(mapping.getTotalSessions())
                .isEqualTo(mapping.getUsedSessions() + mapping.getRemainingSessions());
        assertThat(mapping.getStatus()).isEqualTo(MappingStatus.SESSIONS_EXHAUSTED);
        assertThat(mapping.getEndDate()).isNotNull();
        assertThat(LeftoverOccupyingCompleteExhaust.alreadyExhaustedForSchedule(mapping, scheduleId)).isTrue();
    }

    @Test
    @DisplayName("동형 leftover rem>1: rem 감소분만큼 used 증가, total 유지, 불변식 유지")
    void leftoverCompleted_matchingRemGreaterThanOne_bumpsUsedByRemDecrease() {
        long scheduleId1 = nextId();
        long scheduleId2 = nextId();
        ConsultantClientMapping mapping = leftoverSource(2);
        int usedBefore = mapping.getUsedSessions();
        int totalBefore = mapping.getTotalSessions();
        Schedule completed1 = completedOccupying(scheduleId1, 1, LocalDateTime.now());
        Schedule completed2 = completedOccupying(scheduleId2, 2, LocalDateTime.now());

        Decision decision = LeftoverOccupyingCompleteExhaustBackfill.decide(mapping, 0, 2, false);
        boolean applied = LeftoverOccupyingCompleteExhaustBackfill.applyIfEligible(
                mapping, List.of(completed1, completed2), 0, 2, false);

        assertThat(decision).isEqualTo(Decision.APPLY);
        assertThat(applied).isTrue();
        assertThat(mapping.getRemainingSessions()).isZero();
        assertThat(mapping.getUsedSessions()).isEqualTo(usedBefore + 2);
        assertThat(mapping.getTotalSessions()).isEqualTo(totalBefore);
        assertThat(mapping.getTotalSessions())
                .isEqualTo(mapping.getUsedSessions() + mapping.getRemainingSessions());
        assertThat(mapping.getStatus()).isEqualTo(MappingStatus.SESSIONS_EXHAUSTED);
        assertThat(LeftoverOccupyingCompleteExhaust.alreadyExhaustedForSchedule(mapping, scheduleId1)).isTrue();
        assertThat(LeftoverOccupyingCompleteExhaust.alreadyExhaustedForSchedule(mapping, scheduleId2)).isTrue();
    }

    @Test
    @DisplayName("occupying 진행 중이면 백필하지 않는다")
    void occupyingInProgress_skips() {
        ConsultantClientMapping mapping = leftoverSource(1);

        Decision decision = LeftoverOccupyingCompleteExhaustBackfill.decide(mapping, 1, 0, false);
        boolean applied = LeftoverOccupyingCompleteExhaustBackfill.applyIfEligible(
                mapping, List.of(), 1, 0, false);

        assertThat(decision).isEqualTo(Decision.SKIP_OCCUPYING_IN_PROGRESS);
        assertThat(applied).isFalse();
        assertThat(mapping.getRemainingSessions()).isEqualTo(1);
        assertThat(mapping.getStatus()).isEqualTo(MappingStatus.ACTIVE);
    }

    @Test
    @DisplayName("CANCELLED leftover rem>0은 백필하지 않는다")
    void cancelledLeftover_skips() {
        ConsultantClientMapping mapping = leftoverSource(1);
        mapping.setStatus(MappingStatus.CANCELLED);

        Decision decision = LeftoverOccupyingCompleteExhaustBackfill.decide(mapping, 0, 1, true);
        boolean applied = LeftoverOccupyingCompleteExhaustBackfill.applyIfEligible(
                mapping, List.of(completedOccupying(nextId(), 1, LocalDateTime.now())), 0, 1, true);

        assertThat(decision).isEqualTo(Decision.SKIP_CANCELLED);
        assertThat(applied).isFalse();
        assertThat(mapping.getRemainingSessions()).isEqualTo(1);
        assertThat(mapping.getStatus()).isEqualTo(MappingStatus.CANCELLED);
    }

    @Test
    @DisplayName("넘기지 않은 진짜 잔여(rem이 leftover occupying 차감분과 다름)는 스킵")
    void trueRemaining_skips() {
        ConsultantClientMapping mapping = leftoverSource(10);

        Decision decision = LeftoverOccupyingCompleteExhaustBackfill.decide(mapping, 0, 0, false);
        boolean applied = LeftoverOccupyingCompleteExhaustBackfill.applyIfEligible(
                mapping, List.of(), 0, 0, false);

        assertThat(decision).isEqualTo(Decision.SKIP_TRUE_REMAINING);
        assertThat(applied).isFalse();
        assertThat(mapping.getRemainingSessions()).isEqualTo(10);
        assertThat(mapping.getStatus()).isEqualTo(MappingStatus.ACTIVE);
    }

    @Test
    @DisplayName("승계 이후 COMPLETED + sessionSequence만 leftover occupying 차감분으로 센다")
    void leftoverDeductedCount_usesCompletedAfterSuccession() {
        LocalDateTime successionAt = LocalDateTime.now().minusDays(1);
        Schedule historical = completedOccupying(nextId(), 2, successionAt.minusDays(2));
        Schedule leftover = completedOccupying(nextId(), 3, successionAt.plusHours(2));
        Schedule booked = occupying(nextId(), 4, ScheduleStatus.BOOKED, successionAt.plusHours(1));

        int counted = LeftoverOccupyingCompleteExhaustBackfill.countLeftoverOccupyingDeducted(
                List.of(historical, leftover, booked), successionAt);

        assertThat(counted).isEqualTo(1);
    }

    private static ConsultantClientMapping leftoverSource(int remainingSessions) {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(nextId());
        mapping.setTenantId("tenant-backfill-" + UUID.randomUUID());
        mapping.setStatus(MappingStatus.ACTIVE);
        mapping.setRemainingSessions(remainingSessions);
        mapping.setUsedSessions(4);
        mapping.setTotalSessions(4 + remainingSessions);
        mapping.setNotes(SessionSuccessionConstants.SOURCE_NOTE_MARKER
                + " 2회 "
                + SessionSuccessionConstants.SOURCE_NOTE_TARGET_MAPPING_ARROW
                + nextId());
        return mapping;
    }

    private static Schedule completedOccupying(long scheduleId, int sessionSequence, LocalDateTime updatedAt) {
        return occupying(scheduleId, sessionSequence, ScheduleStatus.COMPLETED, updatedAt);
    }

    private static Schedule occupying(
            long scheduleId,
            int sessionSequence,
            ScheduleStatus status,
            LocalDateTime updatedAt) {
        Schedule schedule = new Schedule();
        schedule.setId(scheduleId);
        schedule.setStatus(status);
        schedule.setSessionSequence(sessionSequence);
        schedule.setUpdatedAt(updatedAt);
        schedule.setCreatedAt(updatedAt.minusHours(1));
        schedule.setDate(LocalDate.now());
        schedule.setStartTime(LocalTime.of(10, 0));
        return schedule;
    }

    private static long nextId() {
        return ThreadLocalRandom.current().nextLong(1_000L, 9_000_000L);
    }
}
