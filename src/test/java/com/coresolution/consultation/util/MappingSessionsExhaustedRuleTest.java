package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

/**
 * {@link MappingSessionsExhaustedRule} 과 이를 쓰는 매핑 엔티티 회기 메서드.
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@DisplayName("매핑 회기 소진 전이 규칙 — 활성 매핑만")
class MappingSessionsExhaustedRuleTest {

    @Test
    @DisplayName("활성 + 잔여 0 이하 → 소진, 잔여가 남거나 null 이면 아님")
    void active_marksOnlyWhenRemainingZeroOrLess() {
        assertThat(MappingSessionsExhaustedRule.shouldMarkExhausted(MappingStatus.ACTIVE, 0)).isTrue();
        assertThat(MappingSessionsExhaustedRule.shouldMarkExhausted(MappingStatus.ACTIVE, -1)).isTrue();
        assertThat(MappingSessionsExhaustedRule.shouldMarkExhausted(MappingStatus.ACTIVE, 1)).isFalse();
        assertThat(MappingSessionsExhaustedRule.shouldMarkExhausted(MappingStatus.ACTIVE, null)).isFalse();
        assertThat(MappingSessionsExhaustedRule.allowsTransitionFrom(MappingStatus.ACTIVE)).isTrue();
    }

    @ParameterizedTest(name = "{0} + 잔여 0 → 소진 아님")
    @EnumSource(value = MappingStatus.class, names = "ACTIVE", mode = EnumSource.Mode.EXCLUDE)
    @DisplayName("활성이 아닌 상태는 잔여 0 이어도 소진으로 바꾸지 않는다")
    void nonActive_neverMarked(MappingStatus status) {
        assertThat(MappingSessionsExhaustedRule.shouldMarkExhausted(status, 0)).isFalse();
        assertThat(MappingSessionsExhaustedRule.allowsTransitionFrom(status)).isFalse();
    }

    @Test
    @DisplayName("상태 null 은 소진으로 바꾸지 않는다")
    void nullStatus_neverMarked() {
        assertThat(MappingSessionsExhaustedRule.shouldMarkExhausted(null, 0)).isFalse();
    }

    @Test
    @DisplayName("엔티티 useSession — 활성 매핑 마지막 회기 사용 시 소진")
    void useSession_activeLastSession_marksExhausted() {
        ConsultantClientMapping mapping = mapping(MappingStatus.ACTIVE, 1, 0, 1);

        mapping.useSession();

        assertThat(mapping.getStatus()).isEqualTo(MappingStatus.SESSIONS_EXHAUSTED);
        assertThat(mapping.getRemainingSessions()).isZero();
    }

    @ParameterizedTest(name = "{0} 매핑 마지막 회기 사용 → 상태 유지")
    @EnumSource(value = MappingStatus.class, names = {"CANCELLED", "TERMINATED", "PENDING_PAYMENT", "PAYMENT_CONFIRMED"})
    @DisplayName("엔티티 useSession·승계 차감·leftover 소진 — 활성이 아니면 상태 유지")
    void entityMethods_nonActive_keepStatus(MappingStatus status) {
        ConsultantClientMapping used = mapping(status, 1, 0, 1);
        used.useSession();
        assertThat(used.getStatus()).isEqualTo(status);

        ConsultantClientMapping succession = mapping(status, 2, 0, 2);
        succession.deductSessionsForSuccession(2);
        assertThat(succession.getStatus()).isEqualTo(status);

        ConsultantClientMapping reversed = mapping(status, 2, 1, 1);
        reversed.reverseGrantedSessions(1);
        assertThat(reversed.getStatus()).isEqualTo(status);
    }

    private static ConsultantClientMapping mapping(MappingStatus status, int total, int used, int remaining) {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setStatus(status);
        mapping.setTotalSessions(total);
        mapping.setUsedSessions(used);
        mapping.setRemainingSessions(remaining);
        return mapping;
    }
}
