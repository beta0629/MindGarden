package com.coresolution.consultation.constant;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 타기관·바우처 paymentTiming 은 회기권 ADVANCE 전용 필터와 분리한다.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@DisplayName("PaymentTimingConstants — 타기관·바우처 분리")
class PaymentTimingConstantsTest {

    @Test
    @DisplayName("INSTITUTION_LINK 만 isInstitutionLink, 회기 잔여 게이트 제외")
    void institutionLink_isDistinctFromSessionPack() {
        assertThat(PaymentTimingConstants.isInstitutionLink(PaymentTimingConstants.INSTITUTION_LINK)).isTrue();
        assertThat(PaymentTimingConstants.isInstitutionLink("institution_link")).isTrue();
        assertThat(PaymentTimingConstants.isInstitutionLink(PaymentTimingConstants.ADVANCE)).isFalse();
        assertThat(PaymentTimingConstants.isInstitutionLink(PaymentTimingConstants.SAME_DAY_CARD)).isFalse();
        assertThat(PaymentTimingConstants.isInstitutionLink(null)).isFalse();
        assertThat(PaymentTimingConstants.isInstitutionLink(PaymentTimingConstants.VOUCHER)).isFalse();

        assertThat(PaymentTimingConstants.usesSessionPackRemainingGate(PaymentTimingConstants.INSTITUTION_LINK))
                .isFalse();
        assertThat(PaymentTimingConstants.usesSessionPackRemainingGate(PaymentTimingConstants.ADVANCE)).isTrue();
        assertThat(PaymentTimingConstants.usesSessionPackRemainingGate(PaymentTimingConstants.SAME_DAY_CARD)).isTrue();
        assertThat(PaymentTimingConstants.usesSessionPackRemainingGate(null)).isTrue();
    }

    @Test
    @DisplayName("VOUCHER 훅: isVoucher·잔여 게이트 제외·비회기권 timing")
    void voucher_hookExcludesAdvanceOnlyGate() {
        assertThat(PaymentTimingConstants.isVoucher(PaymentTimingConstants.VOUCHER)).isTrue();
        assertThat(PaymentTimingConstants.isVoucher("voucher")).isTrue();
        assertThat(PaymentTimingConstants.isVoucher(PaymentTimingConstants.ADVANCE)).isFalse();
        assertThat(PaymentTimingConstants.usesSessionPackRemainingGate(PaymentTimingConstants.VOUCHER)).isFalse();
        assertThat(PaymentTimingConstants.isNonSessionPackEngagementTiming(PaymentTimingConstants.VOUCHER)).isTrue();
        assertThat(PaymentTimingConstants.isNonSessionPackEngagementTiming(
                PaymentTimingConstants.INSTITUTION_LINK)).isTrue();
        assertThat(PaymentTimingConstants.isNonSessionPackEngagementTiming(PaymentTimingConstants.ADVANCE))
                .isFalse();
    }

    @Test
    @DisplayName("SAME_DAY_CARD 와 ADVANCE 는 기존 의미 유지")
    void sameDayCardAndAdvance_unchanged() {
        assertThat(PaymentTimingConstants.isSameDayCard(PaymentTimingConstants.SAME_DAY_CARD)).isTrue();
        assertThat(PaymentTimingConstants.isSameDayCard(PaymentTimingConstants.INSTITUTION_LINK)).isFalse();
        assertThat(PaymentTimingConstants.isSameDayCard(PaymentTimingConstants.ADVANCE)).isFalse();
    }
}
