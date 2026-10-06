package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.constant.MappingStatusConstants;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 가예약 상담일지 회차 부여(잔여 미차감) 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-09-14
 */
@DisplayName("ProvisionalConsultationLogSession")
class ProvisionalConsultationLogSessionTest {

    @Test
    @DisplayName("PENDING_PAYMENT + SAME_DAY_CARD 이면 가예약으로 판정")
    void sameDayCardPending_isProvisional() {
        ConsultantClientMapping mapping = mapping(MappingStatus.PENDING_PAYMENT,
                MappingStatusConstants.PAYMENT_TIMING_SAME_DAY_CARD, 0, 0, 1);

        assertThat(ProvisionalConsultationLogSession.isSameDayCardPendingPayment(mapping)).isTrue();
    }

    @Test
    @DisplayName("ACTIVE 매핑은 가예약이 아니다")
    void activeMapping_isNotProvisional() {
        ConsultantClientMapping mapping = mapping(MappingStatus.ACTIVE,
                MappingStatusConstants.PAYMENT_TIMING_SAME_DAY_CARD, 0, 1, 1);

        assertThat(ProvisionalConsultationLogSession.isSameDayCardPendingPayment(mapping)).isFalse();
        assertThat(ProvisionalConsultationLogSession.computeSequenceWithoutDeduction(mapping)).isNull();
    }

    @Test
    @DisplayName("가예약 rem=0 used=0 → 회차 1, remaining/used 불변")
    void provisionalRemZero_grantsFirstSequenceWithoutDeduction() {
        ConsultantClientMapping mapping = mapping(MappingStatus.PENDING_PAYMENT,
                MappingStatusConstants.PAYMENT_TIMING_SAME_DAY_CARD, 0, 0, 1);

        Integer sequence = ProvisionalConsultationLogSession.computeSequenceWithoutDeduction(mapping);

        assertThat(sequence).isEqualTo(1);
        assertThat(mapping.getRemainingSessions()).isZero();
        assertThat(mapping.getUsedSessions()).isZero();
    }

    @Test
    @DisplayName("가예약 remaining>0 이면 차감 직전 산식(total-remaining+1)")
    void provisionalRemPositive_usesBeforeDeductionFormula() {
        ConsultantClientMapping mapping = mapping(MappingStatus.PENDING_PAYMENT,
                "same_day_card", 3, 2, 10);

        assertThat(ProvisionalConsultationLogSession.computeSequenceWithoutDeduction(mapping)).isEqualTo(8);
        assertThat(mapping.getRemainingSessions()).isEqualTo(3);
        assertThat(mapping.getUsedSessions()).isEqualTo(2);
    }

    @Test
    @DisplayName("일반 ACTIVE rem=0 은 회차를 부여하지 않는다")
    void regularActiveRemZero_doesNotGrant() {
        ConsultantClientMapping mapping = mapping(MappingStatus.ACTIVE, "ADVANCE", 0, 10, 10);

        assertThat(ProvisionalConsultationLogSession.computeSequenceWithoutDeduction(mapping)).isNull();
        assertThat(mapping.getRemainingSessions()).isZero();
    }

    private static ConsultantClientMapping mapping(MappingStatus status, String paymentTiming,
            Integer remaining, Integer used, Integer total) {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setStatus(status);
        mapping.setPaymentTiming(paymentTiming);
        mapping.setRemainingSessions(remaining);
        mapping.setUsedSessions(used);
        mapping.setTotalSessions(total);
        return mapping;
    }
}
