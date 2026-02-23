package com.coresolution.consultation.entity;

import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * ConsultantClientMapping.restoreSession() 단위 테스트
 * (예약 취소 시 회기 1회 복원 로직)
 *
 * @author MindGarden
 */
@DisplayName("ConsultantClientMapping 회기 복원 단위 테스트")
class ConsultantClientMappingRestoreSessionTest {

    @Nested
    @DisplayName("restoreSession()")
    class RestoreSession {

        @Test
        @DisplayName("usedSessions 1 이상이면 remaining +1, used -1")
        void restoresOneSession() {
            ConsultantClientMapping mapping = new ConsultantClientMapping();
            mapping.setTotalSessions(10);
            mapping.setRemainingSessions(9);
            mapping.setUsedSessions(1);
            mapping.setStatus(MappingStatus.ACTIVE);

            mapping.restoreSession();

            assertThat(mapping.getRemainingSessions()).isEqualTo(10);
            assertThat(mapping.getUsedSessions()).isEqualTo(0);
            assertThat(mapping.getStatus()).isEqualTo(MappingStatus.ACTIVE);
        }

        @Test
        @DisplayName("usedSessions 0이면 변경 없음")
        void noChangeWhenUsedSessionsZero() {
            ConsultantClientMapping mapping = new ConsultantClientMapping();
            mapping.setTotalSessions(10);
            mapping.setRemainingSessions(10);
            mapping.setUsedSessions(0);
            mapping.setStatus(MappingStatus.ACTIVE);

            mapping.restoreSession();

            assertThat(mapping.getRemainingSessions()).isEqualTo(10);
            assertThat(mapping.getUsedSessions()).isEqualTo(0);
        }

        @Test
        @DisplayName("SESSIONS_EXHAUSTED 상태에서 복원 시 ACTIVE로 변경")
        void statusBecomesActiveWhenRestoredFromExhausted() {
            ConsultantClientMapping mapping = new ConsultantClientMapping();
            mapping.setTotalSessions(2);
            mapping.setRemainingSessions(0);
            mapping.setUsedSessions(2);
            mapping.setStatus(MappingStatus.SESSIONS_EXHAUSTED);

            mapping.restoreSession();

            assertThat(mapping.getRemainingSessions()).isEqualTo(1);
            assertThat(mapping.getUsedSessions()).isEqualTo(1);
            assertThat(mapping.getStatus()).isEqualTo(MappingStatus.ACTIVE);
        }
    }
}
