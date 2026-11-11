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

    @Test
    @DisplayName("Given DEPOSIT_PENDING rem=1 → useSession으로 rem=0 유지 → approveByAdmin → SESSIONS_EXHAUSTED")
    void depositPending_useSessionThenApprove_exhausts() {
        // Given — 당일카드 입금 단계와 동일: DEPOSIT_PENDING 중 차감해도 소진 전이 없음
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setStatus(MappingStatus.DEPOSIT_PENDING);
        mapping.setPaymentStatus(PaymentStatus.APPROVED);
        mapping.setTotalSessions(1);
        mapping.setUsedSessions(0);
        mapping.setRemainingSessions(1);
        mapping.setEndDate(null);

        // When — 가예약 확정 차감
        mapping.useSession();

        // Then — rem=0 이어도 DEPOSIT_PENDING 유지 (MappingSessionsExhaustedRule)
        assertThat(mapping.getStatus()).isEqualTo(MappingStatus.DEPOSIT_PENDING);
        assertThat(mapping.getRemainingSessions()).isZero();
        assertThat(mapping.getUsedSessions()).isEqualTo(1);
        assertThat(mapping.getEndDate()).isNull();

        // When — 승인 (checkoutSameDayCard Step 3)
        mapping.approveByAdmin("SYSTEM_AUTO_OPTION_B");

        // Then — ACTIVE 직후 rem=0 → SESSIONS_EXHAUSTED (환불/heal 아님)
        assertThat(mapping.getStatus()).isEqualTo(MappingStatus.SESSIONS_EXHAUSTED);
        assertThat(mapping.getRemainingSessions()).isZero();
        assertThat(mapping.getEndDate()).isNotNull();
        assertThat(mapping.getApprovedBy()).isEqualTo("SYSTEM_AUTO_OPTION_B");
    }
}
