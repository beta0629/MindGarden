package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.util.List;
import com.coresolution.consultation.constant.BatchNotificationTemplateCodes;
import com.coresolution.consultation.constant.ClientReminderSmsDisplayStatus;
import com.coresolution.consultation.constant.ImmediateReservationSmsPendingStatus;
import com.coresolution.consultation.dto.ClientReminderSmsStatusDto;
import com.coresolution.consultation.entity.ImmediateReservationSmsPending;
import com.coresolution.consultation.entity.NotificationBatchSendLog;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link ScheduleClientReminderSmsStatusServiceImpl#resolveOne} 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-08-01
 */
class ScheduleClientReminderSmsStatusServiceImplTest {

    @Test
    @DisplayName("PENDING pending 이 있으면 PENDING + fireAt")
    void pendingTakesPriority() {
        ImmediateReservationSmsPending pending = ImmediateReservationSmsPending.builder()
                .scheduleId(1L)
                .templateCode(BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_LATE)
                .fireAt(LocalDateTime.of(2026, 8, 2, 9, 0))
                .status(ImmediateReservationSmsPendingStatus.PENDING)
                .build();
        NotificationBatchSendLog sent = NotificationBatchSendLog.builder()
                .targetId(1L)
                .success(true)
                .channelUsed(BatchNotificationTemplateCodes.CHANNEL_SMS)
                .sentAt(LocalDateTime.of(2026, 8, 1, 10, 0))
                .build();

        ClientReminderSmsStatusDto dto = ScheduleClientReminderSmsStatusServiceImpl.resolveOne(
                List.of(pending), List.of(sent));

        assertThat(dto).isNotNull();
        assertThat(dto.getStatus()).isEqualTo(ClientReminderSmsDisplayStatus.PENDING);
        assertThat(dto.getFireAt()).isEqualTo(LocalDateTime.of(2026, 8, 2, 9, 0));
        assertThat(dto.getFailureReason()).isNull();
    }

    @Test
    @DisplayName("성공 send_log → SENT")
    void sentFromSendLog() {
        NotificationBatchSendLog sent = NotificationBatchSendLog.builder()
                .targetId(2L)
                .success(true)
                .channelUsed(BatchNotificationTemplateCodes.CHANNEL_SMS)
                .sentAt(LocalDateTime.of(2026, 8, 1, 14, 0))
                .build();

        ClientReminderSmsStatusDto dto = ScheduleClientReminderSmsStatusServiceImpl.resolveOne(
                List.of(), List.of(sent));

        assertThat(dto).isNotNull();
        assertThat(dto.getStatus()).isEqualTo(ClientReminderSmsDisplayStatus.SENT);
        assertThat(dto.getSentAt()).isEqualTo(LocalDateTime.of(2026, 8, 1, 14, 0));
    }

    @Test
    @DisplayName("실패 send_log → FAILED + 짧은 사유")
    void failedFromSendLog() {
        NotificationBatchSendLog failed = NotificationBatchSendLog.builder()
                .targetId(3L)
                .success(false)
                .channelUsed(BatchNotificationTemplateCodes.CHANNEL_SMS)
                .errorCode(BatchNotificationTemplateCodes.ERROR_CODE_RECIPIENT_PHONE_MISSING)
                .errorMessage("should-not-leak-phone-01012345678")
                .sentAt(LocalDateTime.of(2026, 8, 1, 11, 0))
                .build();

        ClientReminderSmsStatusDto dto = ScheduleClientReminderSmsStatusServiceImpl.resolveOne(
                List.of(), List.of(failed));

        assertThat(dto).isNotNull();
        assertThat(dto.getStatus()).isEqualTo(ClientReminderSmsDisplayStatus.FAILED);
        assertThat(dto.getFailureReason()).isEqualTo("번호 없음");
        assertThat(dto.getFailureReason()).doesNotContain("010");
    }

    @Test
    @DisplayName("SKIPPED only → null (숨김)")
    void skippedHidden() {
        ImmediateReservationSmsPending skipped = ImmediateReservationSmsPending.builder()
                .scheduleId(4L)
                .templateCode(BatchNotificationTemplateCodes.RESERVATION_REMINDER_D2)
                .fireAt(LocalDateTime.of(2026, 8, 1, 9, 0))
                .status(ImmediateReservationSmsPendingStatus.SKIPPED_CANCELLED)
                .build();

        ClientReminderSmsStatusDto dto = ScheduleClientReminderSmsStatusServiceImpl.resolveOne(
                List.of(skipped), List.of());

        assertThat(dto).isNull();
    }

    @Test
    @DisplayName("빈 입력 → null")
    void emptyHidden() {
        assertThat(ScheduleClientReminderSmsStatusServiceImpl.resolveOne(List.of(), List.of()))
                .isNull();
    }
}
