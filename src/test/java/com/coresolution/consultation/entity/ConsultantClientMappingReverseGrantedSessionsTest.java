package com.coresolution.consultation.entity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link ConsultantClientMapping#reverseGrantedSessions} 단위 검증.
 *
 * @author MindGarden
 * @since 2026-09-17
 */
@DisplayName("ConsultantClientMapping.reverseGrantedSessions")
class ConsultantClientMappingReverseGrantedSessionsTest {

    @Test
    @DisplayName("가산 대칭 원복 — total/remaining 감소, used 유지")
    void reverseGrantedSessions_mirrorsAddSessions() {
        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
                .status(MappingStatus.ACTIVE)
                .totalSessions(15)
                .remainingSessions(12)
                .usedSessions(3)
                .build();

        mapping.reverseGrantedSessions(10);

        assertThat(mapping.getTotalSessions()).isEqualTo(5);
        assertThat(mapping.getRemainingSessions()).isEqualTo(2);
        assertThat(mapping.getUsedSessions()).isEqualTo(3);
        assertThat(mapping.getStatus()).isEqualTo(MappingStatus.ACTIVE);
    }

    @Test
    @DisplayName("remaining 부족 시 0 클램프·ACTIVE→SESSIONS_EXHAUSTED")
    void reverseGrantedSessions_clampsRemainingAndExhausts() {
        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
                .status(MappingStatus.ACTIVE)
                .totalSessions(10)
                .remainingSessions(3)
                .usedSessions(7)
                .build();

        mapping.reverseGrantedSessions(10);

        assertThat(mapping.getRemainingSessions()).isEqualTo(0);
        assertThat(mapping.getTotalSessions()).isEqualTo(7);
        assertThat(mapping.getStatus()).isEqualTo(MappingStatus.SESSIONS_EXHAUSTED);
    }

    @Test
    @DisplayName("유효하지 않은 회기수 거부")
    void reverseGrantedSessions_rejectsInvalid() {
        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
                .status(MappingStatus.ACTIVE)
                .totalSessions(5)
                .remainingSessions(5)
                .usedSessions(0)
                .build();

        assertThatThrownBy(() -> mapping.reverseGrantedSessions(null))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> mapping.reverseGrantedSessions(0))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> mapping.reverseGrantedSessions(-1))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
