package com.coresolution.consultation.constant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 내담자 연계 유형 정규화.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@DisplayName("ClientEngagementTypeConstants")
class ClientEngagementTypeConstantsTest {

    @Test
    @DisplayName("빈 값은 일반 회기")
    void blank_isSessionTicket() {
        assertThat(ClientEngagementTypeConstants.normalizeOrThrow(null))
                .isEqualTo(ClientEngagementTypeConstants.SESSION_TICKET);
        assertThat(ClientEngagementTypeConstants.normalizeOrThrow("  "))
                .isEqualTo(ClientEngagementTypeConstants.SESSION_TICKET);
    }

    @Test
    @DisplayName("INSTITUTION_LINK 대소문자 안전")
    void institutionLink_caseInsensitive() {
        assertThat(ClientEngagementTypeConstants.normalizeOrThrow("institution_link"))
                .isEqualTo(ClientEngagementTypeConstants.INSTITUTION_LINK);
        assertThat(ClientEngagementTypeConstants.isInstitutionLink("INSTITUTION_LINK")).isTrue();
    }

    @Test
    @DisplayName("바우처 값은 거부")
    void voucher_rejected() {
        assertThatThrownBy(() -> ClientEngagementTypeConstants.normalizeOrThrow("VOUCHER"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(ClientEngagementTypeConstants.MSG_INVALID_ENGAGEMENT_TYPE);
    }
}
