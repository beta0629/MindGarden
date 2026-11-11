package com.coresolution.consultation.util;

import java.time.LocalDateTime;

import com.coresolution.consultation.constant.PaymentConstants;
import com.coresolution.consultation.constant.PaymentTimingConstants;
import com.coresolution.consultation.entity.ConsultantClientMapping;

/**
 * 일반 회기 0원 배정 — 결제·PG·ERP 없이 회기 충전 후 ACTIVE 로 전환하는 공통 모듈.
 * 기관연계·당일카드는 대상이 아니다.
 *
 * @author CoreSolution
 * @since 2026-11-11
 */
public final class MappingZeroChargeActivation {

    private MappingZeroChargeActivation() {
        throw new UnsupportedOperationException("유틸리티 클래스입니다.");
    }

    /**
     * 관리자 일반 회기 배정을 결제 없이 활성화할 수 있는지.
     * 패키지·결제 금액이 0원(또는 결제 금액 없음)이고, 기관연계·당일카드·바우처가 아니어야 한다.
     *
     * @param mapping 대상 매핑
     * @return 해당하면 true
     */
    public static boolean isEligibleRegularAssignment(ConsultantClientMapping mapping) {
        if (mapping == null) {
            return false;
        }
        if (!PaymentConstants.isZeroCharge(mapping.getPackagePrice(), mapping.getPaymentAmount())) {
            return false;
        }
        String timing = mapping.getPaymentTiming();
        return !PaymentTimingConstants.isNonSessionPackEngagementTiming(timing)
                && !PaymentTimingConstants.isSameDayCard(timing);
    }

    /**
     * 입금 확인과 같은 규칙으로 사용 가능 회기를 채운다.
     * remaining 이 null/0 이고 totalSessions &gt; 0 이면 total-used 로 채운다.
     *
     * @param mapping 대상 매핑
     */
    public static void grantRemainingSessions(ConsultantClientMapping mapping) {
        if (mapping == null) {
            return;
        }
        Integer total = mapping.getTotalSessions();
        Integer remaining = mapping.getRemainingSessions();
        int remainingVal = remaining == null ? 0 : remaining;
        int used = mapping.getUsedSessions() != null ? mapping.getUsedSessions() : 0;
        if (total != null && total > 0 && remainingVal == 0) {
            mapping.setRemainingSessions(Math.max(0, total - used));
        }
    }

    /**
     * PG·ERP 없이 회기를 충전하고 ACTIVE(또는 잔여 0 이면 SESSIONS_EXHAUSTED)로 전환한다.
     * paymentStatus 는 결제대기 KPI에 남지 않도록 APPROVED, paymentAmount 는 0원으로 맞춘다.
     *
     * @param mapping 대상 매핑
     */
    public static void activateWithoutPayment(ConsultantClientMapping mapping) {
        if (mapping == null) {
            throw new IllegalArgumentException("mapping is required");
        }
        grantRemainingSessions(mapping);
        mapping.setPaymentAmount(PaymentConstants.ZERO_PAYMENT_AMOUNT);
        mapping.setPaymentStatus(ConsultantClientMapping.PaymentStatus.APPROVED);
        mapping.setStatus(ConsultantClientMapping.MappingStatus.ACTIVE);
        mapping.setAdminApprovalDate(LocalDateTime.now());
        if (MappingSessionsExhaustedRule.shouldMarkExhausted(
                mapping.getStatus(), mapping.getRemainingSessions())) {
            mapping.setStatus(ConsultantClientMapping.MappingStatus.SESSIONS_EXHAUSTED);
            mapping.setEndDate(LocalDateTime.now());
        }
    }
}
