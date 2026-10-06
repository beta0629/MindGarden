package com.coresolution.consultation.util;

import com.coresolution.consultation.constant.PaymentTimingConstants;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 결제 상태 게이트 판정. 결제 대기도 일정 확정은 허용하고, 회기 차감·대체 차감은 결제 후에만 한다.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@DisplayName("MappingPaymentScheduleGate")
class MappingPaymentScheduleGateTest {

    @Test
    @DisplayName("선납 결제 대기는 가예약 생성 거절, 확정 허용, 차감·대체 차감 거절, 차감 없는 회차 부여")
    void advancePendingPayment_confirmAllowedWithoutConsume() {
        MappingStatus status = MappingStatus.PENDING_PAYMENT;
        String timing = PaymentTimingConstants.ADVANCE;

        assertThat(MappingPaymentScheduleGate.allowsTentativeBeforeDeposit(status, timing)).isFalse();
        assertThat(MappingPaymentScheduleGate.allowsScheduleConfirm(status, timing)).isTrue();
        assertThat(MappingPaymentScheduleGate.allowsSessionConsume(status, timing)).isFalse();
        assertThat(MappingPaymentScheduleGate.blocksSessionConsumeFallback(status, timing)).isTrue();
        assertThat(MappingPaymentScheduleGate.allowsProvisionalSequenceWithoutDeduction(status, timing)).isTrue();
    }

    @Test
    @DisplayName("결제 시점 null(레거시 선납) 결제 대기도 확정 허용, 차감·대체 차감 거절")
    void nullTimingPendingPayment_confirmAllowedWithoutConsume() {
        MappingStatus status = MappingStatus.PENDING_PAYMENT;

        assertThat(MappingPaymentScheduleGate.allowsTentativeBeforeDeposit(status, null)).isFalse();
        assertThat(MappingPaymentScheduleGate.allowsScheduleConfirm(status, null)).isTrue();
        assertThat(MappingPaymentScheduleGate.allowsSessionConsume(status, null)).isFalse();
        assertThat(MappingPaymentScheduleGate.blocksSessionConsumeFallback(status, null)).isTrue();
        assertThat(MappingPaymentScheduleGate.allowsProvisionalSequenceWithoutDeduction(status, null)).isTrue();
    }

    @Test
    @DisplayName("사후 카드 결제 대기는 가예약·확정 허용, 차감·대체 차감 거절")
    void sameDayCardPending_allowsTentativeAndConfirmWithoutConsume() {
        MappingStatus status = MappingStatus.PENDING_PAYMENT;
        String timing = "same_day_card";

        assertThat(MappingPaymentScheduleGate.isSameDayCardPendingPayment(status, timing)).isTrue();
        assertThat(MappingPaymentScheduleGate.allowsTentativeBeforeDeposit(status, timing)).isTrue();
        assertThat(MappingPaymentScheduleGate.allowsScheduleConfirm(status, timing)).isTrue();
        assertThat(MappingPaymentScheduleGate.allowsSessionConsume(status, timing)).isFalse();
        assertThat(MappingPaymentScheduleGate.blocksSessionConsumeFallback(status, timing)).isTrue();
        assertThat(MappingPaymentScheduleGate.allowsProvisionalSequenceWithoutDeduction(status, timing)).isTrue();
    }

    @Test
    @DisplayName("ACTIVE 회기권은 가예약·확정·차감 허용, 차감 없는 회차 부여 대상 아님")
    void activeAdvance_allowsConfirmAndConsume() {
        MappingStatus status = MappingStatus.ACTIVE;
        String timing = PaymentTimingConstants.ADVANCE;

        assertThat(MappingPaymentScheduleGate.allowsTentativeBeforeDeposit(status, timing)).isTrue();
        assertThat(MappingPaymentScheduleGate.allowsScheduleConfirm(status, timing)).isTrue();
        assertThat(MappingPaymentScheduleGate.allowsSessionConsume(status, timing)).isTrue();
        assertThat(MappingPaymentScheduleGate.blocksSessionConsumeFallback(status, timing)).isFalse();
        assertThat(MappingPaymentScheduleGate.allowsProvisionalSequenceWithoutDeduction(status, timing)).isFalse();
    }

    @Test
    @DisplayName("기관연계 ACTIVE 는 가예약·회기 차감 거절, 확정 판정은 통과")
    void institutionLinkActive_skipsSessionPackConsume() {
        MappingStatus status = MappingStatus.ACTIVE;
        String timing = PaymentTimingConstants.INSTITUTION_LINK;

        assertThat(MappingPaymentScheduleGate.allowsTentativeBeforeDeposit(status, timing)).isFalse();
        assertThat(MappingPaymentScheduleGate.allowsScheduleConfirm(status, timing)).isTrue();
        assertThat(MappingPaymentScheduleGate.allowsSessionConsume(status, timing)).isFalse();
        assertThat(MappingPaymentScheduleGate.blocksSessionConsumeFallback(status, timing)).isFalse();
    }

    @Test
    @DisplayName("기관연계·바우처 결제 대기는 대체 차감을 막고, 회기권 회차 부여 대상이 아니다")
    void institutionLinkAndVoucherPending_noProvisionalSessionPackSequence() {
        MappingStatus status = MappingStatus.PENDING_PAYMENT;

        for (String timing : new String[] {PaymentTimingConstants.INSTITUTION_LINK, PaymentTimingConstants.VOUCHER}) {
            assertThat(MappingPaymentScheduleGate.blocksSessionConsumeFallback(status, timing)).isTrue();
            assertThat(MappingPaymentScheduleGate.allowsSessionConsume(status, timing)).isFalse();
            assertThat(MappingPaymentScheduleGate.allowsProvisionalSequenceWithoutDeduction(status, timing))
                    .isFalse();
        }
    }

    @Test
    @DisplayName("승인 대기·결제 확인은 가예약 거절, 확정 판정 통과, 차감 없는 회차 부여 대상 아님")
    void depositPendingAndPaymentConfirmed_areNotUnpaidPending() {
        assertThat(MappingPaymentScheduleGate.allowsTentativeBeforeDeposit(
                MappingStatus.DEPOSIT_PENDING, PaymentTimingConstants.ADVANCE)).isFalse();
        assertThat(MappingPaymentScheduleGate.allowsTentativeBeforeDeposit(
                MappingStatus.PAYMENT_CONFIRMED, PaymentTimingConstants.ADVANCE)).isFalse();
        assertThat(MappingPaymentScheduleGate.allowsScheduleConfirm(
                MappingStatus.DEPOSIT_PENDING, PaymentTimingConstants.ADVANCE)).isTrue();
        assertThat(MappingPaymentScheduleGate.blocksSessionConsumeFallback(
                MappingStatus.PAYMENT_CONFIRMED, PaymentTimingConstants.SAME_DAY_CARD)).isFalse();
        assertThat(MappingPaymentScheduleGate.allowsProvisionalSequenceWithoutDeduction(
                MappingStatus.DEPOSIT_PENDING, PaymentTimingConstants.SAME_DAY_CARD)).isFalse();
    }

    @Test
    @DisplayName("상태 없는 매핑은 확정 거절")
    void nullStatus_deniesConfirm() {
        assertThat(MappingPaymentScheduleGate.allowsScheduleConfirm(null, PaymentTimingConstants.ADVANCE)).isFalse();
        assertThat(MappingPaymentScheduleGate.blocksSessionConsumeFallback(null, null)).isFalse();
        assertThat(MappingPaymentScheduleGate.allowsProvisionalSequenceWithoutDeduction(null, null)).isFalse();
    }
}
