package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

/**
 * 일정 취소는 매핑 상태를 바꾸지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@DisplayName("일정 취소 → 매핑 상태 변경 판정")
class ScheduleCancelMappingStatusRuleTest {

    @ParameterizedTest(name = "{0} — 일정 취소로 매핑 상태 변경 불가")
    @EnumSource(MappingStatus.class)
    void neverAllowsMappingStatusChange(MappingStatus status) {
        assertThat(ScheduleCancelMappingStatusRule.allowsMappingStatusChangeFromScheduleCancel(status))
                .isFalse();
    }

    @Test
    @DisplayName("상태 null 도 변경 불가")
    void nullStatus_notAllowed() {
        assertThat(ScheduleCancelMappingStatusRule.allowsMappingStatusChangeFromScheduleCancel(null))
                .isFalse();
    }

    @Test
    @DisplayName("받은 돈·약정 상태는 ACTIVE·PAYMENT_CONFIRMED·DEPOSIT_PENDING")
    void moneyReceivedOrCommitted_paidStatuses() {
        assertThat(ScheduleCancelMappingStatusRule.isMoneyReceivedOrCommitted(MappingStatus.ACTIVE)).isTrue();
        assertThat(ScheduleCancelMappingStatusRule.isMoneyReceivedOrCommitted(MappingStatus.PAYMENT_CONFIRMED))
                .isTrue();
        assertThat(ScheduleCancelMappingStatusRule.isMoneyReceivedOrCommitted(MappingStatus.DEPOSIT_PENDING))
                .isTrue();
        assertThat(ScheduleCancelMappingStatusRule.isMoneyReceivedOrCommitted(MappingStatus.PENDING_PAYMENT))
                .isFalse();
        assertThat(ScheduleCancelMappingStatusRule.isMoneyReceivedOrCommitted(MappingStatus.CANCELLED)).isFalse();
    }
}
