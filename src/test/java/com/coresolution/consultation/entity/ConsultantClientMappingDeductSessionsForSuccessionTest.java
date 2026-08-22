package com.coresolution.consultation.entity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * ConsultantClientMapping.deductSessionsForSuccession 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-08-22
 */
@DisplayName("ConsultantClientMapping.deductSessionsForSuccession — 회기 승계 소스 차감")
class ConsultantClientMappingDeductSessionsForSuccessionTest {

    @Test
    void deductSessions_decrementsRemainingAndTotal_keepsUsed() {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setTotalSessions(10);
        mapping.setRemainingSessions(7);
        mapping.setUsedSessions(3);
        mapping.setStatus(ConsultantClientMapping.MappingStatus.ACTIVE);

        mapping.deductSessionsForSuccession(4);

        assertThat(mapping.getRemainingSessions()).isEqualTo(3);
        assertThat(mapping.getTotalSessions()).isEqualTo(6);
        assertThat(mapping.getUsedSessions()).isEqualTo(3);
        assertThat(mapping.getStatus()).isEqualTo(ConsultantClientMapping.MappingStatus.ACTIVE);
    }

    @Test
    void deductSessions_toZero_transitionsToExhausted() {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setTotalSessions(5);
        mapping.setRemainingSessions(2);
        mapping.setUsedSessions(3);
        mapping.setStatus(ConsultantClientMapping.MappingStatus.ACTIVE);

        mapping.deductSessionsForSuccession(2);

        assertThat(mapping.getRemainingSessions()).isEqualTo(0);
        assertThat(mapping.getTotalSessions()).isEqualTo(3);
        assertThat(mapping.getStatus()).isEqualTo(ConsultantClientMapping.MappingStatus.SESSIONS_EXHAUSTED);
        assertThat(mapping.getEndDate()).isNotNull();
    }

    @Test
    void deductSessions_rejectsInvalidOrOverRemaining() {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setTotalSessions(5);
        mapping.setRemainingSessions(2);
        mapping.setUsedSessions(3);
        mapping.setStatus(ConsultantClientMapping.MappingStatus.ACTIVE);

        assertThatThrownBy(() -> mapping.deductSessionsForSuccession(null))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> mapping.deductSessionsForSuccession(0))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> mapping.deductSessionsForSuccession(3))
                .isInstanceOf(IllegalArgumentException.class);
        assertThat(mapping.getRemainingSessions()).isEqualTo(2);
    }
}
