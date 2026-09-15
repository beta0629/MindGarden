package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.constant.SessionSuccessionConstants;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.Schedule;
import java.util.concurrent.ThreadLocalRandom;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * leftover occupying 완료 소진 판정 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-09-12
 */
@DisplayName("LeftoverOccupyingCompleteExhaust")
class LeftoverOccupyingCompleteExhaustTest {

    @Test
    @DisplayName("승계 leftover rem=1 + occupying COMPLETED → rem=0 + SESSIONS_EXHAUSTED")
    void leftoverRemOne_occupyingComplete_exhausts() {
        long scheduleId = nextId();
        long targetMappingId = nextId();
        ConsultantClientMapping mapping = leftoverSource(1, targetMappingId);
        Schedule schedule = occupyingSchedule(scheduleId, 1);

        boolean changed = LeftoverOccupyingCompleteExhaust.exhaustIfLeftoverOccupying(mapping, schedule);

        assertThat(changed).isTrue();
        assertThat(mapping.getRemainingSessions()).isZero();
        assertThat(mapping.getUsedSessions()).isEqualTo(5);
        assertThat(mapping.getTotalSessions()).isEqualTo(5);
        assertSessionCountInvariant(mapping);
        assertThat(mapping.getStatus()).isEqualTo(MappingStatus.SESSIONS_EXHAUSTED);
        assertThat(mapping.getEndDate()).isNotNull();
        assertThat(LeftoverOccupyingCompleteExhaust.alreadyExhaustedForSchedule(mapping, scheduleId)).isTrue();
    }

    @Test
    @DisplayName("다중 occupying이면 rem만 1 줄이고 ACTIVE를 유지한다")
    void leftoverRemTwo_occupyingComplete_staysActive() {
        ConsultantClientMapping mapping = leftoverSource(2, nextId());
        Schedule schedule = occupyingSchedule(nextId(), 2);

        boolean changed = LeftoverOccupyingCompleteExhaust.exhaustIfLeftoverOccupying(mapping, schedule);

        assertThat(changed).isTrue();
        assertThat(mapping.getRemainingSessions()).isEqualTo(1);
        assertThat(mapping.getUsedSessions()).isEqualTo(5);
        assertThat(mapping.getTotalSessions()).isEqualTo(6);
        assertSessionCountInvariant(mapping);
        assertThat(mapping.getStatus()).isEqualTo(MappingStatus.ACTIVE);
        assertThat(mapping.getEndDate()).isNull();
    }

    @Test
    @DisplayName("승계 없는 일반 완료(sessionSequence 있음)는 rem 불변")
    void regularCompleteWithSessionSequence_remUnchanged() {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setStatus(MappingStatus.ACTIVE);
        mapping.setRemainingSessions(3);
        mapping.setUsedSessions(2);
        mapping.setNotes("일반 매칭");
        Schedule schedule = occupyingSchedule(nextId(), 2);

        boolean changed = LeftoverOccupyingCompleteExhaust.exhaustIfLeftoverOccupying(mapping, schedule);

        assertThat(changed).isFalse();
        assertThat(mapping.getRemainingSessions()).isEqualTo(3);
        assertThat(mapping.getStatus()).isEqualTo(MappingStatus.ACTIVE);
    }

    @Test
    @DisplayName("타깃 승계 notes만 있으면 leftover 소스가 아니다")
    void targetSuccessionNotes_notLeftoverSource() {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setStatus(MappingStatus.ACTIVE);
        mapping.setRemainingSessions(1);
        mapping.setNotes(SessionSuccessionConstants.SOURCE_NOTE_MARKER + " 소스매핑#" + nextId() + "에서 2회 수령");
        Schedule schedule = occupyingSchedule(nextId(), 1);

        assertThat(LeftoverOccupyingCompleteExhaust.isLeftoverSuccessionSource(mapping)).isFalse();
        assertThat(LeftoverOccupyingCompleteExhaust.exhaustIfLeftoverOccupying(mapping, schedule)).isFalse();
        assertThat(mapping.getRemainingSessions()).isEqualTo(1);
    }

    @Test
    @DisplayName("같은 일정에 대한 leftover 소진은 멱등이다")
    void leftoverExhaust_isIdempotentPerSchedule() {
        ConsultantClientMapping mapping = leftoverSource(2, nextId());
        Schedule schedule = occupyingSchedule(nextId(), 1);

        assertThat(LeftoverOccupyingCompleteExhaust.exhaustIfLeftoverOccupying(mapping, schedule)).isTrue();
        assertThat(LeftoverOccupyingCompleteExhaust.exhaustIfLeftoverOccupying(mapping, schedule)).isFalse();
        assertThat(mapping.getRemainingSessions()).isEqualTo(1);
        assertThat(mapping.getUsedSessions()).isEqualTo(5);
        assertSessionCountInvariant(mapping);
        assertThat(mapping.getStatus()).isEqualTo(MappingStatus.ACTIVE);
    }

    /**
     * total == used + remaining 불변식.
     *
     * @param mapping 검증 대상 매핑
     */
    private static void assertSessionCountInvariant(ConsultantClientMapping mapping) {
        int total = mapping.getTotalSessions() == null ? 0 : mapping.getTotalSessions();
        int used = mapping.getUsedSessions() == null ? 0 : mapping.getUsedSessions();
        int remaining = mapping.getRemainingSessions() == null ? 0 : mapping.getRemainingSessions();
        assertThat(total).isEqualTo(used + remaining);
    }

    @Test
    @DisplayName("sessionSequence 없으면 leftover rem을 바꾸지 않는다")
    void noSessionSequence_skipsExhaust() {
        ConsultantClientMapping mapping = leftoverSource(1, nextId());
        Schedule schedule = occupyingSchedule(nextId(), null);

        assertThat(LeftoverOccupyingCompleteExhaust.exhaustIfLeftoverOccupying(mapping, schedule)).isFalse();
        assertThat(mapping.getRemainingSessions()).isEqualTo(1);
        assertThat(mapping.getStatus()).isEqualTo(MappingStatus.ACTIVE);
    }

    private static ConsultantClientMapping leftoverSource(int remainingSessions, long targetMappingId) {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setStatus(MappingStatus.ACTIVE);
        mapping.setRemainingSessions(remainingSessions);
        mapping.setUsedSessions(4);
        mapping.setTotalSessions(4 + remainingSessions);
        mapping.setNotes(SessionSuccessionConstants.SOURCE_NOTE_MARKER
                + " 2회 "
                + SessionSuccessionConstants.SOURCE_NOTE_TARGET_MAPPING_ARROW
                + targetMappingId);
        return mapping;
    }

    private static Schedule occupyingSchedule(Long scheduleId, Integer sessionSequence) {
        Schedule schedule = new Schedule();
        schedule.setId(scheduleId);
        schedule.setSessionSequence(sessionSequence);
        return schedule;
    }

    private static long nextId() {
        return ThreadLocalRandom.current().nextLong(1_000L, 9_000_000L);
    }
}
