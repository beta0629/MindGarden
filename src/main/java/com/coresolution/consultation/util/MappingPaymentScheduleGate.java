package com.coresolution.consultation.util;

import com.coresolution.consultation.constant.PaymentTimingConstants;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;

/**
 * 매핑 결제 상태·결제 시점으로 일정 확정·회기 차감·입금 전 가예약을 판정하는 공통 게이트.
 *
 * <p>선납(ADVANCE)은 입금 전 {@code remainingSessions=0} 이며 결제 대기에서 회기를 차감하지 않는다.
 * 사후 카드({@code SAME_DAY_CARD})는 결제 대기 가예약 생성을 허용한다.
 * 결제 대기·결제 확인(입금 전) 일정 확정은 입금 전에도 허용하고, 회기 차감·ERP 수입은 입금 확인 시 한 번만이다.
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
     * 입금 확인 전 매핑인지. 결제 대기와 결제 확인(입금 전)을 포함한다.
     *
     * <p>두 상태 모두 {@code remainingSessions} 가 아직 채워지지 않았다(입금 확인 시 채움).
     * 그래서 이 매핑의 회기를 차감할 수 없고, 다른 매핑으로 차감·복원을 넘기면 안 된다.</p>
     *
     * @param status 매핑 상태
     * @return {@link MappingStatus#PENDING_PAYMENT} 또는 {@link MappingStatus#PAYMENT_CONFIRMED} 이면 true
     */
    public static boolean isAwaitingDeposit(MappingStatus status) {
        return isUnpaidPendingPayment(status) || status == MappingStatus.PAYMENT_CONFIRMED;
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
     * <p>결제 대기(선납·사후 카드 포함)도 결제 전에 확정할 수 있다. 확정은 회기·금액을 움직이지 않는다.
     * 회기 차감은 {@link #allowsSessionConsume} 이 막고, 입금·카드 결제 확정 경로에서 한 번만 일어난다.</p>
     *
     * @param status 매핑 상태
     * @param paymentTiming 매핑 {@code payment_timing}
     * @return 확정해도 되면 true
     */
    public static boolean allowsScheduleConfirm(MappingStatus status, String paymentTiming) {
        return status != null;
    }

    /**
     * 이 매핑에 묶인 일정의 회기를 다른 매핑으로 대체 차감하면 안 되는지.
     *
     * <p>입금 확인 전 매핑(결제 대기·결제 확인)은 일정이 확정돼도 {@code usedSessions} 를 올리지 않고,
     * 같은 상담사·내담자의 다른 ACTIVE 매핑으로 차감·복원을 넘기지 않는다. 확정 허용 여부와 독립이다.</p>
     *
     * @param status 일정에 묶인 매핑 상태
     * @param paymentTiming 매핑 {@code payment_timing}
     * @return 대체 차감을 막으면 true
     */
    public static boolean blocksSessionConsumeFallback(MappingStatus status, String paymentTiming) {
        return isAwaitingDeposit(status);
    }

    /**
     * 결제 전 일정에 회기 차감 없이 회차({@code sessionSequence})만 부여하는 대상인지.
     *
     * <p>입금 확인 전 회기권(선납·레거시 null·사후 카드, 결제 대기·결제 확인)이면 확정·일지 작성을 위해
     * 회차만 부여한다.
     * 이 회차는 차감이 아니므로 취소 시 잔여를 복원하지 않고, 결제 확정 시 라벨 차감 경로에서 한 번만 차감한다.
     * 기관연계·바우처는 방문 회차 경로가 따로 있어 제외한다.</p>
     *
     * @param status 매핑 상태
     * @param paymentTiming 매핑 {@code payment_timing}
     * @return 차감 없는 회차 부여 대상이면 true
     */
    public static boolean allowsProvisionalSequenceWithoutDeduction(MappingStatus status, String paymentTiming) {
        return isAwaitingDeposit(status) && PaymentTimingConstants.usesSessionPackRemainingGate(paymentTiming);
    }

    /**
     * 회기 잔여를 이 매핑에서 차감할 수 있는지.
     *
     * <p>기관연계·바우처는 회기권 차감이 아니다(방문 회차 부여는 별도 경로).
     * 입금 확인 전(결제 대기·결제 확인)은 시점과 무관하게 false.</p>
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
