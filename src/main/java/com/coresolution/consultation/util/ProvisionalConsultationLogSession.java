package com.coresolution.consultation.util;

import com.coresolution.consultation.entity.ConsultantClientMapping;

/**
 * 결제 대기(PENDING_PAYMENT) 회기권 일정의 상담일지용 회차 부여.
 *
 * <p>결제 전 매핑은 remainingSessions=0 이어도 잔여를 차감하지 않고
 * 일정 {@code sessionSequence}를 부여할 수 있다. 대상 판정은
 * {@link MappingPaymentScheduleGate#allowsProvisionalSequenceWithoutDeduction} 이다.</p>
 *
 * @author MindGarden
 * @since 2026-09-14
 */
public final class ProvisionalConsultationLogSession {

    private ProvisionalConsultationLogSession() {
    }

    /**
     * 당일 카드 결제 대기(가예약) 매핑 여부.
     *
     * @param mapping 매칭
     * @return PENDING_PAYMENT + paymentTiming=SAME_DAY_CARD 이면 true
     */
    public static boolean isSameDayCardPendingPayment(ConsultantClientMapping mapping) {
        if (mapping == null) {
            return false;
        }
        return MappingPaymentScheduleGate.isSameDayCardPendingPayment(
                mapping.getStatus(), mapping.getPaymentTiming());
    }

    /**
     * 차감 없이 회차만 부여하는 결제 대기 회기권 매핑인지.
     *
     * @param mapping 매칭
     * @return 결제 대기 + 회기권 결제 시점(선납·null·사후 카드)이면 true
     */
    public static boolean isProvisionalWithoutDeduction(ConsultantClientMapping mapping) {
        if (mapping == null) {
            return false;
        }
        return MappingPaymentScheduleGate.allowsProvisionalSequenceWithoutDeduction(
                mapping.getStatus(), mapping.getPaymentTiming());
    }

    /**
     * remaining 차감 없이 부여할 1-based 회차.
     *
     * <p>remaining &gt; 0 이면 기존 차감 직전 산식 {@code total - remaining + 1}.
     * remaining &lt;= 0 이면 {@code usedSessions + 1} (결제 전).
     * 결제 대기 회기권이 아니면 null.</p>
     *
     * @param mapping 매칭
     * @return 부여할 회차, 일반 매핑이면 null
     */
    public static Integer computeSequenceWithoutDeduction(ConsultantClientMapping mapping) {
        if (!isProvisionalWithoutDeduction(mapping)) {
            return null;
        }
        Integer totalSessions = mapping.getTotalSessions();
        Integer remainingSessions = mapping.getRemainingSessions();
        if (totalSessions != null && totalSessions >= 1
                && remainingSessions != null && remainingSessions > 0) {
            return totalSessions - remainingSessions + 1;
        }
        int usedSessions = mapping.getUsedSessions() == null ? 0 : mapping.getUsedSessions();
        if (usedSessions < 0) {
            usedSessions = 0;
        }
        return usedSessions + 1;
    }
}
