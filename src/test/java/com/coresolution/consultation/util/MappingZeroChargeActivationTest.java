package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.constant.PaymentConstants;
import com.coresolution.consultation.constant.PaymentTimingConstants;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping.PaymentStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 일반 회기 0원 배정 활성화 공통 모듈.
 *
 * @author CoreSolution
 * @since 2026-11-11
 */
@DisplayName("MappingZeroChargeActivation")
class MappingZeroChargeActivationTest {

    @Test
    @DisplayName("선납 0원 일반 배정만 대상 — 기관·당일카드·유료는 제외")
    void isEligibleRegularAssignment_excludesInstitutionSameDayAndPaid() {
        assertThat(MappingZeroChargeActivation.isEligibleRegularAssignment(
                mapping(PaymentConstants.ZERO_PAYMENT_AMOUNT, PaymentTimingConstants.ADVANCE))).isTrue();
        assertThat(MappingZeroChargeActivation.isEligibleRegularAssignment(
                mapping(PaymentConstants.ZERO_PAYMENT_AMOUNT, null))).isTrue();
        assertThat(MappingZeroChargeActivation.isEligibleRegularAssignment(
                mapping(PaymentConstants.ZERO_PAYMENT_AMOUNT, PaymentTimingConstants.INSTITUTION_LINK)))
                .isFalse();
        assertThat(MappingZeroChargeActivation.isEligibleRegularAssignment(
                mapping(PaymentConstants.ZERO_PAYMENT_AMOUNT, PaymentTimingConstants.SAME_DAY_CARD)))
                .isFalse();
        assertThat(MappingZeroChargeActivation.isEligibleRegularAssignment(
                mapping(PaymentConstants.MIN_PAYMENT_AMOUNT, PaymentTimingConstants.ADVANCE))).isFalse();
        assertThat(MappingZeroChargeActivation.isEligibleRegularAssignment(null)).isFalse();
    }

    @Test
    @DisplayName("activateWithoutPayment: 회기 충전 + ACTIVE + APPROVED, 결제금액 0")
    void activateWithoutPayment_grantsSessionsAndActivates() {
        ConsultantClientMapping mapping = mapping(PaymentConstants.ZERO_PAYMENT_AMOUNT, PaymentTimingConstants.ADVANCE);
        mapping.setStatus(MappingStatus.PENDING_PAYMENT);
        mapping.setPaymentStatus(PaymentStatus.PENDING);
        mapping.setTotalSessions(5);
        mapping.setRemainingSessions(0);
        mapping.setUsedSessions(0);

        MappingZeroChargeActivation.activateWithoutPayment(mapping);

        assertThat(mapping.getRemainingSessions()).isEqualTo(5);
        assertThat(mapping.getStatus()).isEqualTo(MappingStatus.ACTIVE);
        assertThat(mapping.getPaymentStatus()).isEqualTo(PaymentStatus.APPROVED);
        assertThat(mapping.getPaymentAmount()).isEqualTo(PaymentConstants.ZERO_PAYMENT_AMOUNT);
        assertThat(mapping.getAdminApprovalDate()).isNotNull();
    }

    private static ConsultantClientMapping mapping(Long packagePrice, String paymentTiming) {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setPackagePrice(packagePrice);
        mapping.setPaymentAmount(packagePrice);
        mapping.setPaymentTiming(paymentTiming);
        mapping.setTotalSessions(5);
        mapping.setRemainingSessions(0);
        mapping.setUsedSessions(0);
        return mapping;
    }
}
