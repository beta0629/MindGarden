package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link MappingSessionConsumptionSsot} · {@link MappingRemainingAssignmentFilter} 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-09-23
 */
@DisplayName("MappingSessionConsumptionSsot / MappingRemainingAssignmentFilter")
class MappingSessionConsumptionSsotTest {

    @Test
    @DisplayName("total=1 + COMPLETED 1건 → fully consumed (stale rem=1 포함)")
    void totalOne_completedOne_fullyConsumed() {
        assertThat(MappingSessionConsumptionSsot.isFullyConsumedByCompletedSchedules(1, 1L)).isTrue();
        assertThat(MappingSessionConsumptionSsot.effectiveRemainingSessions(1, true)).isZero();
    }

    @Test
    @DisplayName("total=2 + COMPLETED 1건 → 미소비")
    void totalTwo_completedOne_notFullyConsumed() {
        assertThat(MappingSessionConsumptionSsot.isFullyConsumedByCompletedSchedules(2, 1L)).isFalse();
        assertThat(MappingSessionConsumptionSsot.effectiveRemainingSessions(1, false)).isEqualTo(1);
    }

    @Test
    @DisplayName("totalSessions null/0 → fully consumed 아님")
    void totalNullOrZero_notFullyConsumed() {
        assertThat(MappingSessionConsumptionSsot.isFullyConsumedByCompletedSchedules(null, 5L)).isFalse();
        assertThat(MappingSessionConsumptionSsot.isFullyConsumedByCompletedSchedules(0, 1L)).isFalse();
    }

    @Test
    @DisplayName("excludeFullyConsumed — ACTIVE rem=1 used=0 + COMPLETED>=total → 목록 미포함")
    void excludeFullyConsumed_staleActiveOneSession_excluded() {
        ConsultantClientMapping stale = mapping(276L, 1, 0, 1);
        ConsultantClientMapping open = mapping(277L, 5, 2, 3);

        List<ConsultantClientMapping> filtered = MappingRemainingAssignmentFilter.excludeFullyConsumed(
                List.of(stale, open),
                m -> m.getId().equals(276L) ? 1L : 0L);

        assertThat(filtered).containsExactly(open);
    }

    @Test
    @DisplayName("applyEffectiveRemaining — fully consumed 이면 rem=0 (DB heal 없음)")
    void applyEffectiveRemaining_zerosStaleRem() {
        ConsultantClientMapping stale = mapping(276L, 1, 0, 1);

        MappingRemainingAssignmentFilter.applyEffectiveRemainingWhenFullyConsumed(
                List.of(stale), m -> 1L);

        assertThat(stale.getRemainingSessions()).isZero();
        assertThat(stale.getStatus()).isEqualTo(MappingStatus.ACTIVE);
        assertThat(stale.getUsedSessions()).isZero();
    }

    private static ConsultantClientMapping mapping(Long id, int total, int used, int rem) {
        ConsultantClientMapping m = new ConsultantClientMapping();
        m.setId(id);
        m.setTotalSessions(total);
        m.setUsedSessions(used);
        m.setRemainingSessions(rem);
        m.setStatus(MappingStatus.ACTIVE);
        return m;
    }
}
