package com.coresolution.consultation.util;

import com.coresolution.consultation.constant.PaymentTimingConstants;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;

/**
 * 매핑 결제 상태·결제 시점으로 일정 확정·회기 차감·입금 전 가예약을 판정하는 공통 게이트.
 *
 * <p>선납(ADVANCE)은 입금 전 {@code remainingSessions=0} 이며 결제 대기에서 확정·차감하지 않는다.
 * 사후 카드({@code SAME_DAY_CARD})는 결제 대기 가예약 생성만 허용하고, 확정·회기 차감은 결제 후다.
 * 회기 표시({@code usedSessions} 와 {@code sessionSequence})는 이 게이트의 책임이 아니다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
public final class MappingPaymentScheduleGate {

    private MappingPaymentScheduleGate() {
    }

    /**
     * 결제 대기(미입금) 매핑인지.
     *
     * @param status 매핑 상태
     * @return {@link MappingStatus#PENDING_PAYMENT} 이면 true
     */
    public static boolean isUnpaidPendingPayment(MappingStatus status) {
        return status == MappingStatus.PENDING_PAYMENT;
    }

    /**
     * 사후 카드 결제 대기인지. 가예약 생성 대상이며 확정·차감 대상이 아니다.
     *
     * @param status 매핑 상태
     * @param paymentTiming 매핑 {@code payment_timing}
     * @return PENDING_PAYMENT + SAME_DAY_CARD 이면 true
     */
    public static boolean isSameDayCardPendingPayment(MappingStatus status, String paymentTiming) {
        return isUnpaidPendingPayment(status) && PaymentTimingConstants.isSameDayCard(paymentTiming);
    }

    /**
     * 입금 전 가예약 일정 생성 허용.
     *
     * <p>ACTIVE(기관연계 제외) 또는 PENDING_PAYMENT + SAME_DAY_CARD.
     * ADVANCE·null 결제 대기는 거절한다. 승인 대기(DEPOSIT_PENDING)는 거절한다.</p>
     *
     * @param status 매핑 상태
     * @param paymentTiming 매핑 {@code payment_timing}
     * @return 가예약을 허용하면 true
     */
    public static boolean allowsTentativeBeforeDeposit(MappingStatus status, String paymentTiming) {
        if (status == null || PaymentTimingConstants.isInstitutionLink(paymentTiming)) {
            return false;
        }
        if (status == MappingStatus.ACTIVE) {
            return true;
        }
        return isSameDayCardPendingPayment(status, paymentTiming);
    }

    /**
     * 일정 확정(CONFIRMED·가예약에서 점유 확정으로의 전이) 허용.
     *
     * <p>결제 대기는 결제 시점과 무관하게 거절한다. SAME_DAY_CARD 도 결제 전 확정 예외가 아니다.</p>
     *
     * @param status 매핑 상태
     * @param paymentTiming 매핑 {@code payment_timing}
     * @return 확정해도 되면 true
     */
    public static boolean allowsScheduleConfirm(MappingStatus status, String paymentTiming) {
        if (status == null) {
            return false;
        }
        if (isSameDayCardPendingPayment(status, paymentTiming) || isUnpaidPendingPayment(status)) {
            return false;
        }
        return true;
    }

    /**
     * 이 매핑에 묶인 일정의 회기를 다른 매핑으로 대체 차감하면 안 되는지.
     *
     * <p>결제 대기 매핑은 {@code usedSessions} 를 올리지 않고, 같은 상담사·내담자의
     * 다른 ACTIVE 매핑으로 차감을 넘기지 않는다.</p>
     *
     * @param status 일정에 묶인 매핑 상태
     * @param paymentTiming 매핑 {@code payment_timing}
     * @return 대체 차감을 막으면 true
     */
    public static boolean blocksSessionConsumeFallback(MappingStatus status, String paymentTiming) {
        return isUnpaidPendingPayment(status) && !allowsScheduleConfirm(status, paymentTiming);
    }

    /**
     * 회기 잔여를 이 매핑에서 차감할 수 있는지.
     *
     * <p>기관연계·바우처는 회기권 차감이 아니다(방문 회차 부여는 별도 경로).
     * 결제 대기는 시점과 무관하게 false.</p>
     *
     * @param status 매핑 상태
     * @param paymentTiming 매핑 {@code payment_timing}
     * @return 잔여 회기 차감 대상이면 true
     */
    public static boolean allowsSessionConsume(MappingStatus status, String paymentTiming) {
        if (status == null || blocksSessionConsumeFallback(status, paymentTiming)) {
            return false;
        }
        if (PaymentTimingConstants.isInstitutionLink(paymentTiming)
                || PaymentTimingConstants.isVoucher(paymentTiming)) {
            return false;
        }
        return status == MappingStatus.ACTIVE
                || status == MappingStatus.SESSIONS_EXHAUSTED
                || status == MappingStatus.DEPOSIT_PENDING;
    }
}
