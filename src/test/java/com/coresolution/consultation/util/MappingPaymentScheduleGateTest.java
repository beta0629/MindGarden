package com.coresolution.consultation.util;

import com.coresolution.consultation.constant.PaymentTimingConstants;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 결제 상태 게이트 판정. 선납 입금 전 확정 금지, 사후 카드 가예약만 허용.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@DisplayName("MappingPaymentScheduleGate")
class MappingPaymentScheduleGateTest {

    @Test
    @DisplayName("선납 결제 대기는 가예약·확정·차감 모두 거절")
    void advancePendingPayment_deniesTentativeConfirmAndConsume() {
        MappingStatus status = MappingStatus.PENDING_PAYMENT;
        String timing = PaymentTimingConstants.ADVANCE;

        assertThat(MappingPaymentScheduleGate.allowsTentativeBeforeDeposit(status, timing)).isFalse();
        assertThat(MappingPaymentScheduleGate.allowsScheduleConfirm(status, timing)).isFalse();
        assertThat(MappingPaymentScheduleGate.allowsSessionConsume(status, timing)).isFalse();
        assertThat(MappingPaymentScheduleGate.blocksSessionConsumeFallback(status, timing)).isTrue();
    }

    @Test
    @DisplayName("결제 시점 null(레거시 선납) 결제 대기도 확정·차감 거절")
    void nullTimingPendingPayment_deniesConfirmAndConsume() {
        MappingStatus status = MappingStatus.PENDING_PAYMENT;

        assertThat(MappingPaymentScheduleGate.allowsTentativeBeforeDeposit(status, null)).isFalse();
        assertThat(MappingPaymentScheduleGate.allowsScheduleConfirm(status, null)).isFalse();
        assertThat(MappingPaymentScheduleGate.blocksSessionConsumeFallback(status, null)).isTrue();
    }

    @Test
    @DisplayName("사후 카드 결제 대기는 가예약만 허용하고 확정·차감은 거절")
    void sameDayCardPending_allowsTentativeOnly() {
        MappingStatus status = MappingStatus.PENDING_PAYMENT;
        String timing = "same_day_card";

        assertThat(MappingPaymentScheduleGate.isSameDayCardPendingPayment(status, timing)).isTrue();
        assertThat(MappingPaymentScheduleGate.allowsTentativeBeforeDeposit(status, timing)).isTrue();
        assertThat(MappingPaymentScheduleGate.allowsScheduleConfirm(status, timing)).isFalse();
        assertThat(MappingPaymentScheduleGate.allowsSessionConsume(status, timing)).isFalse();
        assertThat(MappingPaymentScheduleGate.blocksSessionConsumeFallback(status, timing)).isTrue();
    }

    @Test
    @DisplayName("ACTIVE 회기권은 가예약·확정·차감 허용")
    void activeAdvance_allowsConfirmAndConsume() {
        MappingStatus status = MappingStatus.ACTIVE;
        String timing = PaymentTimingConstants.ADVANCE;

        assertThat(MappingPaymentScheduleGate.allowsTentativeBeforeDeposit(status, timing)).isTrue();
        assertThat(MappingPaymentScheduleGate.allowsScheduleConfirm(status, timing)).isTrue();
        assertThat(MappingPaymentScheduleGate.allowsSessionConsume(status, timing)).isTrue();
        assertThat(MappingPaymentScheduleGate.blocksSessionConsumeFallback(status, timing)).isFalse();
    }

    @Test
    @DisplayName("기관연계 ACTIVE 는 가예약·회기 차감 거절, 확정 판정은 결제 대기가 아니면 통과")
    void institutionLinkActive_skipsSessionPackConsume() {
        MappingStatus status = MappingStatus.ACTIVE;
        String timing = PaymentTimingConstants.INSTITUTION_LINK;

        assertThat(MappingPaymentScheduleGate.allowsTentativeBeforeDeposit(status, timing)).isFalse();
        assertThat(MappingPaymentScheduleGate.allowsScheduleConfirm(status, timing)).isTrue();
        assertThat(MappingPaymentScheduleGate.allowsSessionConsume(status, timing)).isFalse();
        assertThat(MappingPaymentScheduleGate.blocksSessionConsumeFallback(status, timing)).isFalse();
    }

    @Test
    @DisplayName("승인 대기·결제 확인은 가예약 거절. 결제 대기가 아니면 확정 판정은 통과")
    void depositPendingAndPaymentConfirmed_areNotUnpaidPending() {
        assertThat(MappingPaymentScheduleGate.allowsTentativeBeforeDeposit(
                MappingStatus.DEPOSIT_PENDING, PaymentTimingConstants.ADVANCE)).isFalse();
        assertThat(MappingPaymentScheduleGate.allowsTentativeBeforeDeposit(
                MappingStatus.PAYMENT_CONFIRMED, PaymentTimingConstants.ADVANCE)).isFalse();
        assertThat(MappingPaymentScheduleGate.allowsScheduleConfirm(
                MappingStatus.DEPOSIT_PENDING, PaymentTimingConstants.ADVANCE)).isTrue();
        assertThat(MappingPaymentScheduleGate.blocksSessionConsumeFallback(
                MappingStatus.PAYMENT_CONFIRMED, PaymentTimingConstants.SAME_DAY_CARD)).isFalse();
    }
}
