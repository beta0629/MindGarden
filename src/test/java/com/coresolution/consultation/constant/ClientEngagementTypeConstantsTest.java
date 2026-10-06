package com.coresolution.consultation.constant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 내담자 연계 유형 정규화·배정 교차 금지.
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

    @Test
    @DisplayName("타기관 내담자는 기관연계만, 가예약·회기 교차 거부")
    void institutionClient_onlyInstitutionAssignment() {
        assertThat(ClientEngagementTypeConstants.resolveAssignmentPaymentTiming(
                ClientEngagementTypeConstants.INSTITUTION_LINK, null))
                .isEqualTo(PaymentTimingConstants.INSTITUTION_LINK);
        assertThatThrownBy(() -> ClientEngagementTypeConstants.resolveAssignmentPaymentTiming(
                ClientEngagementTypeConstants.INSTITUTION_LINK, PaymentTimingConstants.SAME_DAY_CARD))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(ClientEngagementTypeConstants.MSG_INSTITUTION_CLIENT_ONLY_INSTITUTION_ASSIGNMENT);
        assertThatThrownBy(() -> ClientEngagementTypeConstants.resolveAssignmentPaymentTiming(
                ClientEngagementTypeConstants.INSTITUTION_LINK, PaymentTimingConstants.ADVANCE))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(ClientEngagementTypeConstants.MSG_INSTITUTION_CLIENT_ONLY_INSTITUTION_ASSIGNMENT);
    }

    @Test
    @DisplayName("일반 내담자는 기관연계 배정 거부")
    void sessionClient_rejectsInstitutionAssignment() {
        assertThat(ClientEngagementTypeConstants.resolveAssignmentPaymentTiming(
                ClientEngagementTypeConstants.SESSION_TICKET, PaymentTimingConstants.SAME_DAY_CARD))
                .isEqualTo(PaymentTimingConstants.SAME_DAY_CARD);
        assertThatThrownBy(() -> ClientEngagementTypeConstants.resolveAssignmentPaymentTiming(
                ClientEngagementTypeConstants.SESSION_TICKET, PaymentTimingConstants.INSTITUTION_LINK))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(ClientEngagementTypeConstants.MSG_SESSION_CLIENT_NOT_INSTITUTION_ASSIGNMENT);
    }
}
