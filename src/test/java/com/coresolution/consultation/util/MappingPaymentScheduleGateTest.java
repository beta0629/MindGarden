package com.coresolution.consultation.util;

import com.coresolution.consultation.constant.PaymentTimingConstants;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 결제 상태 게이트 판정. 결제 대기는 입금 전 확정·일지를 허용하고 차감은 거절한다.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@DisplayName("MappingPaymentScheduleGate")
class MappingPaymentScheduleGateTest {

    @Test
    @DisplayName("선납 결제 대기는 가예약·차감은 거절하고 확정·일지는 허용")
    void advancePendingPayment_allowsConfirmAndLogWithoutConsume() {
        MappingStatus status = MappingStatus.PENDING_PAYMENT;
        String timing = PaymentTimingConstants.ADVANCE;

        assertThat(MappingPaymentScheduleGate.allowsTentativeBeforeDeposit(status, timing)).isFalse();
        assertThat(MappingPaymentScheduleGate.allowsScheduleConfirm(status, timing)).isTrue();
        assertThat(MappingPaymentScheduleGate.allowsSessionConsume(status, timing)).isFalse();
        assertThat(MappingPaymentScheduleGate.blocksSessionConsumeFallback(status, timing)).isTrue();
        assertThat(MappingPaymentScheduleGate.allowsUnpaidSessionLabelWithoutConsume(status, timing)).isTrue();
        assertThat(MappingPaymentScheduleGate.allowsConsultationLog(
                status, timing, ScheduleStatus.CONFIRMED)).isTrue();
    }

    @Test
    @DisplayName("결제 시점 null(레거시 선납) 결제 대기는 확정 허용·차감 거절")
    void nullTimingPendingPayment_allowsConfirmDeniesConsume() {
        MappingStatus status = MappingStatus.PENDING_PAYMENT;

        assertThat(MappingPaymentScheduleGate.allowsTentativeBeforeDeposit(status, null)).isFalse();
        assertThat(MappingPaymentScheduleGate.allowsScheduleConfirm(status, null)).isTrue();
        assertThat(MappingPaymentScheduleGate.allowsSessionConsume(status, null)).isFalse();
        assertThat(MappingPaymentScheduleGate.blocksSessionConsumeFallback(status, null)).isTrue();
        assertThat(MappingPaymentScheduleGate.allowsConsultationLog(
                status, null, ScheduleStatus.CONFIRMED)).isTrue();
    }

    @Test
    @DisplayName("사후 카드 결제 대기는 가예약·확정·일지를 허용하고 차감은 거절")
    void sameDayCardPending_allowsTentativeConfirmAndLogWithoutConsume() {
        MappingStatus status = MappingStatus.PENDING_PAYMENT;
        String timing = "same_day_card";

        assertThat(MappingPaymentScheduleGate.isSameDayCardPendingPayment(status, timing)).isTrue();
        assertThat(MappingPaymentScheduleGate.allowsTentativeBeforeDeposit(status, timing)).isTrue();
        assertThat(MappingPaymentScheduleGate.allowsScheduleConfirm(status, timing)).isTrue();
        assertThat(MappingPaymentScheduleGate.allowsSessionConsume(status, timing)).isFalse();
        assertThat(MappingPaymentScheduleGate.blocksSessionConsumeFallback(status, timing)).isTrue();
        assertThat(MappingPaymentScheduleGate.allowsConsultationLog(
                status, timing, ScheduleStatus.TENTATIVE_PENDING_PAYMENT)).isTrue();
        assertThat(MappingPaymentScheduleGate.allowsConsultationLog(
                status, timing, ScheduleStatus.CANCELLED)).isFalse();
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
