package com.coresolution.consultation.util;

import com.coresolution.consultation.constant.MappingStatusConstants;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;

/**
 * 가예약(SAME_DAY_CARD / PENDING_PAYMENT) 상담일지용 회차 부여.
 *
 * <p>월결제 예정 매핑은 remainingSessions=0 이어도 잔여를 차감하지 않고
 * 일정 {@code sessionSequence}를 부여할 수 있다. 일반 매핑은 대상이 아니다.</p>
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
        if (mapping == null || mapping.getStatus() == null) {
            return false;
        }
        if (mapping.getStatus() != MappingStatus.PENDING_PAYMENT) {
            return false;
        }
        String paymentTiming = mapping.getPaymentTiming();
        return paymentTiming != null
                && MappingStatusConstants.PAYMENT_TIMING_SAME_DAY_CARD.equalsIgnoreCase(paymentTiming);
    }

    /**
     * remaining 차감 없이 부여할 1-based 회차.
     *
     * <p>remaining &gt; 0 이면 기존 차감 직전 산식 {@code total - remaining + 1}.
     * remaining &lt;= 0 이면 {@code usedSessions + 1} (월결제 전 가예약).
     * 가예약이 아니면 null.</p>
     *
     * @param mapping 매칭
     * @return 부여할 회차, 일반 매핑이면 null
     */
    public static Integer computeSequenceWithoutDeduction(ConsultantClientMapping mapping) {
        if (!isSameDayCardPendingPayment(mapping)) {
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
