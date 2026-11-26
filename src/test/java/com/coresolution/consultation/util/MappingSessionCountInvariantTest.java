package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link MappingSessionCountInvariant} 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-11-26
 */
@DisplayName("매핑 회기 수 불변식 util")
class MappingSessionCountInvariantTest {

    @Test
    @DisplayName("nullToZero — null → 0, 값 유지")
    void nullToZero_handlesNullAndValue() {
        assertThat(MappingSessionCountInvariant.nullToZero(null)).isZero();
        assertThat(MappingSessionCountInvariant.nullToZero(5)).isEqualTo(5);
    }

    @Test
    @DisplayName("assertInvariant — total == used + remaining 통과")
    void assertInvariant_holds() {
        MappingSessionCountInvariant.assertInvariant(10, 2, 8);
        MappingSessionCountInvariant.assertInvariant(null, null, null);
        MappingSessionCountInvariant.assertInvariant(0, 0, 0);
    }

    @Test
    @DisplayName("assertInvariant — 불일치 시 IllegalArgumentException + 한국어 메시지")
    void assertInvariant_mismatch_throwsWithKoreanMessage() {
        assertThatThrownBy(() -> MappingSessionCountInvariant.assertInvariant(10L, 10, 2, 5))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("회기 수 불일치")
                .hasMessageContaining("mappingId=10")
                .hasMessageContaining("total=10")
                .hasMessageContaining("used=2")
                .hasMessageContaining("remaining=5");
    }

    @Test
    @DisplayName("assertInvariant — 음수 시 IllegalArgumentException")
    void assertInvariant_negative_throws() {
        assertThatThrownBy(() -> MappingSessionCountInvariant.assertInvariant(5, 6, -1))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("0 이상");
    }

    @Test
    @DisplayName("assertInvariant(mapping) — 엔티티 위임")
    void assertInvariant_mapping_delegates() {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(44L);
        mapping.setTotalSessions(10);
        mapping.setUsedSessions(3);
        mapping.setRemainingSessions(7);

        MappingSessionCountInvariant.assertInvariant(mapping);

        mapping.setRemainingSessions(5);
        assertThatThrownBy(() -> MappingSessionCountInvariant.assertInvariant(mapping))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("mappingId=44");
    }

    @Test
    @DisplayName("deriveUsedFromTotalAndRemaining — remaining SSOT")
    void deriveUsed_fromTotalAndRemaining() {
        assertThat(MappingSessionCountInvariant.deriveUsedFromTotalAndRemaining(10, 5)).isEqualTo(5);
        assertThat(MappingSessionCountInvariant.deriveUsedFromTotalAndRemaining(10, 0)).isEqualTo(10);
        assertThat(MappingSessionCountInvariant.deriveUsedFromTotalAndRemaining(null, null)).isZero();
    }

    @Test
    @DisplayName("deriveUsedFromTotalAndRemaining — rem > total / rem < 0 거부")
    void deriveUsed_invalidRemaining_throws() {
        assertThatThrownBy(() -> MappingSessionCountInvariant.deriveUsedFromTotalAndRemaining(10, 11))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(String.format(
                        AdminServiceUserFacingMessages.MSG_MAPPING_REMAINING_SESSIONS_EXCEEDS_TOTAL_FMT, 11, 10));

        assertThatThrownBy(() -> MappingSessionCountInvariant.deriveUsedFromTotalAndRemaining(10, -1))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(AdminServiceUserFacingMessages.MSG_MAPPING_REMAINING_SESSIONS_NEGATIVE);
    }

    @Test
    @DisplayName("deriveRemainingFromTotalAndUsed — total-only 경로")
    void deriveRemaining_fromTotalAndUsed() {
        assertThat(MappingSessionCountInvariant.deriveRemainingFromTotalAndUsed(15, 2)).isEqualTo(13);
        assertThat(MappingSessionCountInvariant.deriveRemainingFromTotalAndUsed(2, 2)).isZero();
    }

    @Test
    @DisplayName("deriveRemainingFromTotalAndUsed — total < used / total < 0 거부")
    void deriveRemaining_invalidTotal_throws() {
        assertThatThrownBy(() -> MappingSessionCountInvariant.deriveRemainingFromTotalAndUsed(1, 2))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(String.format(
                        AdminServiceUserFacingMessages.MSG_MAPPING_TOTAL_SESSIONS_LESS_THAN_USED_FMT, 1, 2));

        assertThatThrownBy(() -> MappingSessionCountInvariant.deriveRemainingFromTotalAndUsed(-1, 0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(AdminServiceUserFacingMessages.MSG_MAPPING_TOTAL_SESSIONS_NEGATIVE);
    }
}
