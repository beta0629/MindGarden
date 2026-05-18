package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.coresolution.consultation.constant.AdminMessageInboxFilterConstants;

/**
 * {@link AdminMessageInboxFilter} 단위 테스트.
 * SSOT: docs/project-management/ADMIN_MESSAGE_INBOX_FILTER_ORCHESTRATION.md §3
 */
@DisplayName("AdminMessageInboxFilter")
class AdminMessageInboxFilterTest {

    @Test
    @DisplayName("REMINDER + SYSTEM → 숨김")
    void reminder_system_hidden() {
        assertThat(AdminMessageInboxFilter.isVisibleInAdminOps(
                        "REMINDER", "SYSTEM", "상담 30분 전", "곧 상담이 시작됩니다"))
                .isFalse();
    }

    @Test
    @DisplayName("PAYMENT_COMPLETION + SYSTEM → 노출")
    void paymentCompletion_system_visible() {
        assertThat(AdminMessageInboxFilter.isVisibleInAdminOps(
                        "PAYMENT_COMPLETION", "SYSTEM", "결제 완료", "결제가 완료되었습니다"))
                .isTrue();
    }

    @Test
    @DisplayName("GENERAL + 결제 키워드 → 노출")
    void general_paymentKeyword_visible() {
        assertThat(AdminMessageInboxFilter.isVisibleInAdminOps(
                        "GENERAL", "SYSTEM", "입금 확인 필요", "매칭 결제를 확인해 주세요"))
                .isTrue();
    }

    @Test
    @DisplayName("COMPLETION + 상담일지 누락 → 숨김")
    void completion_consultationLogMissing_hidden() {
        assertThat(AdminMessageInboxFilter.isVisibleInAdminOps(
                        "COMPLETION", "SYSTEM", "상담일지 누락", "일지를 작성해 주세요"))
                .isFalse();
    }

    @Test
    @DisplayName("NEW_APPOINTMENT + SYSTEM → 노출")
    void newAppointment_system_visible() {
        assertThat(AdminMessageInboxFilter.isVisibleInAdminOps(
                        "NEW_APPOINTMENT", "SYSTEM", "새 예약", "새 예약이 등록되었습니다"))
                .isTrue();
    }

    @Test
    @DisplayName("GENERAL + CONSULTANT (키워드 없음) → 숨김")
    void general_consultant_noKeyword_hidden() {
        assertThat(AdminMessageInboxFilter.isVisibleInAdminOps(
                        "GENERAL", "CONSULTANT", "안녕하세요", "내일 뵙겠습니다"))
                .isFalse();
    }

    @Test
    @DisplayName("COMPLETION + 일정 키워드 → 노출")
    void completion_scheduleKeyword_visible() {
        assertThat(AdminMessageInboxFilter.isVisibleInAdminOps(
                        "COMPLETION", "SYSTEM", "일정 변경", "예약 일정이 변경되었습니다"))
                .isTrue();
    }

    @Test
    @DisplayName("shouldApplyAdminOpsFilter: full 은 false, 기본·admin_ops 는 true")
    void shouldApplyAdminOpsFilter_viewParam() {
        assertThat(AdminMessageInboxFilter.shouldApplyAdminOpsFilter(AdminMessageInboxFilterConstants.VIEW_FULL))
                .isFalse();
        assertThat(AdminMessageInboxFilter.shouldApplyAdminOpsFilter(AdminMessageInboxFilterConstants.VIEW_ADMIN_OPS))
                .isTrue();
        assertThat(AdminMessageInboxFilter.shouldApplyAdminOpsFilter(null)).isTrue();
    }
}
