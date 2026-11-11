package com.coresolution.consultation.entity;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping.PaymentStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link ConsultantClientMapping#approveByAdmin(String)} — ACTIVE 직후 rem=0 이면
 * {@link com.coresolution.consultation.util.MappingSessionsExhaustedRule} 로 SESSIONS_EXHAUSTED 전이.
 *
 * <p>상태 전이만 검증한다. 이 경로에서 ERP 환불·partialRefund·미래일정 취소는 호출되지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-11-11
 */
@DisplayName("ConsultantClientMapping.approveByAdmin — 잔여 0 소진 전이")
class ConsultantClientMappingApproveByAdminExhaustTest {

    @Test
    @DisplayName("Given DEPOSIT_PENDING + APPROVED + rem=0 → When approveByAdmin → Then SESSIONS_EXHAUSTED + endDate 설정")
    void approveByAdmin_remainingZero_marksSessionsExhausted() {
        // Given
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setStatus(MappingStatus.DEPOSIT_PENDING);
        mapping.setPaymentStatus(PaymentStatus.APPROVED);
        mapping.setTotalSessions(1);
        mapping.setUsedSessions(1);
        mapping.setRemainingSessions(0);
        mapping.setEndDate(null);

        // When
        mapping.approveByAdmin("SYSTEM_AUTO_OPTION_B");

        // Then
        assertThat(mapping.getStatus()).isEqualTo(MappingStatus.SESSIONS_EXHAUSTED);
        assertThat(mapping.getRemainingSessions()).isZero();
        assertThat(mapping.getUsedSessions()).isEqualTo(1);
        assertThat(mapping.getEndDate()).isNotNull();
        assertThat(mapping.getApprovedBy()).isEqualTo("SYSTEM_AUTO_OPTION_B");
        assertThat(mapping.getAdminApprovalDate()).isNotNull();
        assertThat(mapping.getStartDate()).isNotNull();
    }

    @Test
    @DisplayName("Given DEPOSIT_PENDING + APPROVED + rem>0 → When approveByAdmin → Then ACTIVE + endDate null")
    void approveByAdmin_remainingPositive_staysActive() {
        // Given
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setStatus(MappingStatus.DEPOSIT_PENDING);
        mapping.setPaymentStatus(PaymentStatus.APPROVED);
        mapping.setTotalSessions(10);
        mapping.setUsedSessions(1);
        mapping.setRemainingSessions(9);
        mapping.setEndDate(null);

        // When
        mapping.approveByAdmin("admin");

        // Then
        assertThat(mapping.getStatus()).isEqualTo(MappingStatus.ACTIVE);
        assertThat(mapping.getRemainingSessions()).isEqualTo(9);
        assertThat(mapping.getEndDate()).isNull();
        assertThat(mapping.getApprovedBy()).isEqualTo("admin");
        assertThat(mapping.getAdminApprovalDate()).isNotNull();
        assertThat(mapping.getStartDate()).isNotNull();
    }
}
