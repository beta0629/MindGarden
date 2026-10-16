package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import com.coresolution.consultation.constant.BatchNotificationTemplateCodes;
import com.coresolution.consultation.constant.ClientReminderSmsDisplayStatus;
import com.coresolution.consultation.constant.ImmediateReservationSmsPendingStatus;
import com.coresolution.consultation.dto.ClientReminderSmsStatusDto;
import com.coresolution.consultation.entity.ImmediateReservationSmsPending;
import com.coresolution.consultation.entity.NotificationBatchSendLog;
import com.coresolution.consultation.repository.ImmediateReservationSmsPendingRepository;
import com.coresolution.consultation.repository.NotificationBatchSendLogRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.SmsTemplateService;
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

    @Test
    @DisplayName("플래그 ON(빈 집합) + TEMPLATE_NOT_MAPPED + SMS 폴백 skip 문구 → FAILED")
    void smsFallbackSkipMessageOnEnabledTemplateStaysFailed() {
        NotificationBatchSendLog skip = smsFallbackSkipLog(
                5L,
                BatchNotificationTemplateCodes.RESERVATION_REMINDER_D2,
                LocalDateTime.of(2026, 8, 3, 9, 0));

        ClientReminderSmsStatusDto dto = ScheduleClientReminderSmsStatusServiceImpl.resolveOne(
                List.of(), List.of(skip));

        assertThat(dto).isNotNull();
        assertThat(dto.getStatus()).isEqualTo(ClientReminderSmsDisplayStatus.FAILED);
        assertThat(dto.getFailureReason()).isEqualTo("템플릿 없음");
    }

    @Test
    @DisplayName("같은 SMS 폴백 skip 로그라도 templateCode 가 OFF 집합이면 null")
    void smsFallbackSkipMessageOnDisabledTemplateHidden() {
        NotificationBatchSendLog skip = smsFallbackSkipLog(
                5L,
                BatchNotificationTemplateCodes.RESERVATION_REMINDER_D2,
                LocalDateTime.of(2026, 8, 3, 9, 0));

        ClientReminderSmsStatusDto dto = ScheduleClientReminderSmsStatusServiceImpl.resolveOne(
                List.of(),
                List.of(skip),
                Set.of(BatchNotificationTemplateCodes.RESERVATION_REMINDER_D2));

        assertThat(dto).isNull();
    }

    @Test
    @DisplayName("OFF 종목 로그가 더 최신이어도 ON 종목의 이전 SENT 유지")
    void earlierSentKeptWhenLaterDisabledTemplateLog() {
        LocalDateTime sentAt = LocalDateTime.of(2026, 8, 1, 10, 0);
        NotificationBatchSendLog sent = NotificationBatchSendLog.builder()
                .targetId(6L)
                .templateCode(BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_LATE)
                .success(true)
                .channelUsed(BatchNotificationTemplateCodes.CHANNEL_SMS)
                .sentAt(sentAt)
                .build();
        NotificationBatchSendLog skip = smsFallbackSkipLog(
                6L,
                BatchNotificationTemplateCodes.RESERVATION_REMINDER_D2,
                LocalDateTime.of(2026, 8, 3, 9, 0));

        ClientReminderSmsStatusDto dto = ScheduleClientReminderSmsStatusServiceImpl.resolveOne(
                List.of(),
                List.of(skip, sent),
                Set.of(BatchNotificationTemplateCodes.RESERVATION_REMINDER_D2));

        assertThat(dto).isNotNull();
        assertThat(dto.getStatus()).isEqualTo(ClientReminderSmsDisplayStatus.SENT);
        assertThat(dto.getSentAt()).isEqualTo(sentAt);
        assertThat(dto.getFailureReason()).isNull();
    }

    @Test
    @DisplayName("OFF 종목 실패 로그만 → null")
    void disabledTemplateFailureHidden() {
        NotificationBatchSendLog failed = NotificationBatchSendLog.builder()
                .targetId(9L)
                .templateCode(BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_SINGLE)
                .success(false)
                .channelUsed(BatchNotificationTemplateCodes.CHANNEL_SMS)
                .errorCode(BatchNotificationTemplateCodes.ERROR_CODE_SEND_FAILED)
                .errorMessage("carrier down")
                .sentAt(LocalDateTime.of(2026, 8, 3, 9, 0))
                .build();

        ClientReminderSmsStatusDto dto = ScheduleClientReminderSmsStatusServiceImpl.resolveOne(
                List.of(),
                List.of(failed),
                Set.of(BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_SINGLE));

        assertThat(dto).isNull();
    }

    @Test
    @DisplayName("ON 종목 실제 실패(SEND_FAILED) → FAILED")
    void enabledTemplateFailureStaysFailed() {
        LocalDateTime sentAt = LocalDateTime.of(2026, 8, 2, 11, 0);
        NotificationBatchSendLog failed = NotificationBatchSendLog.builder()
                .targetId(10L)
                .templateCode(BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_LATE)
                .success(false)
                .channelUsed(BatchNotificationTemplateCodes.CHANNEL_SMS)
                .errorCode(BatchNotificationTemplateCodes.ERROR_CODE_SEND_FAILED)
                .errorMessage("carrier down")
                .sentAt(sentAt)
                .build();

        ClientReminderSmsStatusDto dto = ScheduleClientReminderSmsStatusServiceImpl.resolveOne(
                List.of(),
                List.of(failed),
                Set.of(BatchNotificationTemplateCodes.RESERVATION_REMINDER_D2));

        assertThat(dto).isNotNull();
        assertThat(dto.getStatus()).isEqualTo(ClientReminderSmsDisplayStatus.FAILED);
        assertThat(dto.getSentAt()).isEqualTo(sentAt);
        assertThat(dto.getFailureReason()).isEqualTo("발송 실패");
    }

    @Test
    @DisplayName("ON 종목 성공 → SENT")
    void enabledTemplateSuccessStaysSent() {
        LocalDateTime sentAt = LocalDateTime.of(2026, 8, 2, 15, 0);
        NotificationBatchSendLog sent = NotificationBatchSendLog.builder()
                .targetId(12L)
                .templateCode(BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_SINGLE)
                .success(true)
                .channelUsed(BatchNotificationTemplateCodes.CHANNEL_SMS)
                .sentAt(sentAt)
                .build();

        ClientReminderSmsStatusDto dto = ScheduleClientReminderSmsStatusServiceImpl.resolveOne(
                List.of(),
                List.of(sent),
                Set.of(BatchNotificationTemplateCodes.RESERVATION_REMINDER_D2));

        assertThat(dto).isNotNull();
        assertThat(dto.getStatus()).isEqualTo(ClientReminderSmsDisplayStatus.SENT);
        assertThat(dto.getSentAt()).isEqualTo(sentAt);
        assertThat(dto.getFailureReason()).isNull();
    }

    @Test
    @DisplayName("D2 OFF + 더 이전 LATE 실패 → FAILED")
    void earlierLateFailureKeptWhenLaterD2Disabled() {
        LocalDateTime lateAt = LocalDateTime.of(2026, 8, 1, 9, 0);
        NotificationBatchSendLog lateFailed = NotificationBatchSendLog.builder()
                .targetId(11L)
                .templateCode(BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_LATE)
                .success(false)
                .channelUsed(BatchNotificationTemplateCodes.CHANNEL_SMS)
                .errorCode(BatchNotificationTemplateCodes.ERROR_CODE_SEND_FAILED)
                .errorMessage("carrier down")
                .sentAt(lateAt)
                .build();
        NotificationBatchSendLog d2Later = smsFallbackSkipLog(
                11L,
                BatchNotificationTemplateCodes.RESERVATION_REMINDER_D2,
                LocalDateTime.of(2026, 8, 3, 9, 0));

        ClientReminderSmsStatusDto dto = ScheduleClientReminderSmsStatusServiceImpl.resolveOne(
                List.of(),
                List.of(d2Later, lateFailed),
                Set.of(BatchNotificationTemplateCodes.RESERVATION_REMINDER_D2));

        assertThat(dto).isNotNull();
        assertThat(dto.getStatus()).isEqualTo(ClientReminderSmsDisplayStatus.FAILED);
        assertThat(dto.getSentAt()).isEqualTo(lateAt);
        assertThat(dto.getFailureReason()).isEqualTo("발송 실패");
    }

    @Test
    @DisplayName("OFF 종목 PENDING 은 우선하지 않고 ON 종목 실패가 FAILED")
    void disabledPendingDoesNotOverrideEnabledFailure() {
        ImmediateReservationSmsPending pending = ImmediateReservationSmsPending.builder()
                .scheduleId(13L)
                .templateCode(BatchNotificationTemplateCodes.RESERVATION_REMINDER_D2)
                .fireAt(LocalDateTime.of(2026, 8, 4, 9, 0))
                .status(ImmediateReservationSmsPendingStatus.PENDING)
                .build();
        NotificationBatchSendLog failed = NotificationBatchSendLog.builder()
                .targetId(13L)
                .templateCode(BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_LATE)
                .success(false)
                .channelUsed(BatchNotificationTemplateCodes.CHANNEL_SMS)
                .errorCode(BatchNotificationTemplateCodes.ERROR_CODE_TEMPLATE_NOT_MAPPED)
                .sentAt(LocalDateTime.of(2026, 8, 1, 9, 0))
                .build();

        ClientReminderSmsStatusDto dto = ScheduleClientReminderSmsStatusServiceImpl.resolveOne(
                List.of(pending),
                List.of(failed),
                Set.of(BatchNotificationTemplateCodes.RESERVATION_REMINDER_D2));

        assertThat(dto).isNotNull();
        assertThat(dto.getStatus()).isEqualTo(ClientReminderSmsDisplayStatus.FAILED);
        assertThat(dto.getFailureReason()).isEqualTo("템플릿 없음");
    }

    @Test
    @DisplayName("OFF 종목 CHANNEL_PENDING 은 ON 성공을 가리지 않음")
    void disabledChannelPendingDoesNotOverrideEnabledSent() {
        LocalDateTime sentAt = LocalDateTime.of(2026, 8, 1, 10, 0);
        NotificationBatchSendLog channelPending = NotificationBatchSendLog.builder()
                .targetId(14L)
                .templateCode(BatchNotificationTemplateCodes.RESERVATION_REMINDER_D2)
                .success(false)
                .channelUsed(ClientReminderSmsDisplayStatus.CHANNEL_PENDING)
                .sentAt(LocalDateTime.of(2026, 8, 4, 9, 0))
                .build();
        NotificationBatchSendLog sent = NotificationBatchSendLog.builder()
                .targetId(14L)
                .templateCode(BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_LATE)
                .success(true)
                .channelUsed(BatchNotificationTemplateCodes.CHANNEL_SMS)
                .sentAt(sentAt)
                .build();

        ClientReminderSmsStatusDto dto = ScheduleClientReminderSmsStatusServiceImpl.resolveOne(
                List.of(),
                List.of(channelPending, sent),
                Set.of(BatchNotificationTemplateCodes.RESERVATION_REMINDER_D2));

        assertThat(dto).isNotNull();
        assertThat(dto.getStatus()).isEqualTo(ClientReminderSmsDisplayStatus.SENT);
        assertThat(dto.getSentAt()).isEqualTo(sentAt);
    }

    @Test
    @DisplayName("resolveByScheduleIds — D2 OFF 이면 더 이전 LATE 실패가 FAILED")
    void resolveByScheduleIds_disabledD2KeepsEarlierLateFailure() {
        String tenantId = "tenant-badge";
        Long scheduleId = 11L;
        ImmediateReservationSmsPendingRepository pendingRepository =
                mock(ImmediateReservationSmsPendingRepository.class);
        NotificationBatchSendLogRepository sendLogRepository =
                mock(NotificationBatchSendLogRepository.class);
        SmsTemplateService smsTemplateService = mock(SmsTemplateService.class);
        when(pendingRepository.findByTenantIdAndScheduleIdInAndIsDeletedFalse(eq(tenantId), any()))
                .thenReturn(List.of());
        LocalDateTime lateAt = LocalDateTime.of(2026, 8, 1, 9, 0);
        NotificationBatchSendLog lateFailed = NotificationBatchSendLog.builder()
                .targetId(scheduleId)
                .templateCode(BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_LATE)
                .success(false)
                .channelUsed(BatchNotificationTemplateCodes.CHANNEL_SMS)
                .errorCode(BatchNotificationTemplateCodes.ERROR_CODE_SEND_FAILED)
                .sentAt(lateAt)
                .build();
        NotificationBatchSendLog d2Later = smsFallbackSkipLog(
                scheduleId,
                BatchNotificationTemplateCodes.RESERVATION_REMINDER_D2,
                LocalDateTime.of(2026, 8, 3, 9, 0));
        when(sendLogRepository.findByTenantIdAndTargetTypeAndTargetIdInAndTemplateCodeIn(
                eq(tenantId),
                eq(BatchNotificationTemplateCodes.TARGET_TYPE_SCHEDULE),
                any(),
                eq(BatchNotificationTemplateCodes.RESERVATION_SCHEDULE_SMS_CODES)))
                .thenReturn(List.of(d2Later, lateFailed));
        when(smsTemplateService.isAutoDispatchEnabledFor(
                eq(BatchNotificationTemplateCodes.RESERVATION_REMINDER_D2), eq(tenantId)))
                .thenReturn(false);
        when(smsTemplateService.isAutoDispatchEnabledFor(
                eq(BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_SINGLE), eq(tenantId)))
                .thenReturn(true);
        when(smsTemplateService.isAutoDispatchEnabledFor(
                eq(BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_LATE), eq(tenantId)))
                .thenReturn(true);

        ScheduleClientReminderSmsStatusServiceImpl service =
                new ScheduleClientReminderSmsStatusServiceImpl(
                        pendingRepository,
                        sendLogRepository,
                        mock(ScheduleRepository.class),
                        smsTemplateService);
        Map<Long, ClientReminderSmsStatusDto> result =
                service.resolveByScheduleIds(tenantId, List.of(scheduleId));

        assertThat(result).containsKey(scheduleId);
        assertThat(result.get(scheduleId).getStatus()).isEqualTo(ClientReminderSmsDisplayStatus.FAILED);
        assertThat(result.get(scheduleId).getSentAt()).isEqualTo(lateAt);
        assertThat(result.get(scheduleId).getFailureReason()).isEqualTo("발송 실패");
        verify(smsTemplateService).isAutoDispatchEnabledFor(
                BatchNotificationTemplateCodes.RESERVATION_REMINDER_D2, tenantId);
        verify(smsTemplateService).isAutoDispatchEnabledFor(
                BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_SINGLE, tenantId);
        verify(smsTemplateService).isAutoDispatchEnabledFor(
                BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_LATE, tenantId);
    }

    @Test
    @DisplayName("TEMPLATE_NOT_MAPPED + 실제 SMS 실패 메시지 → FAILED")
    void templateNotMappedRealSmsFailureStaysFailed() {
        NotificationBatchSendLog failed = NotificationBatchSendLog.builder()
                .targetId(7L)
                .success(false)
                .channelUsed(BatchNotificationTemplateCodes.CHANNEL_ALIMTALK)
                .errorCode(BatchNotificationTemplateCodes.ERROR_CODE_TEMPLATE_NOT_MAPPED)
                .errorMessage("alimtalk: mapping not found (skipped) | sms: carrier down")
                .sentAt(LocalDateTime.of(2026, 8, 3, 11, 0))
                .build();

        ClientReminderSmsStatusDto dto = ScheduleClientReminderSmsStatusServiceImpl.resolveOne(
                List.of(), List.of(failed));

        assertThat(dto).isNotNull();
        assertThat(dto.getStatus()).isEqualTo(ClientReminderSmsDisplayStatus.FAILED);
        assertThat(dto.getFailureReason()).isEqualTo("템플릿 없음");
    }

    @Test
    @DisplayName("success=true + TEMPLATE_NOT_MAPPED → SENT (표식이 있어도 숨기지 않음)")
    void successWithTemplateNotMappedIsSent() {
        LocalDateTime sentAt = LocalDateTime.of(2026, 8, 2, 15, 0);
        NotificationBatchSendLog sent = NotificationBatchSendLog.builder()
                .targetId(8L)
                .success(true)
                .channelUsed(BatchNotificationTemplateCodes.CHANNEL_SMS)
                .errorCode(BatchNotificationTemplateCodes.ERROR_CODE_TEMPLATE_NOT_MAPPED)
                .errorMessage(smsFallbackSkipMessage())
                .sentAt(sentAt)
                .build();

        ClientReminderSmsStatusDto dto = ScheduleClientReminderSmsStatusServiceImpl.resolveOne(
                List.of(), List.of(sent));

        assertThat(dto).isNotNull();
        assertThat(dto.getStatus()).isEqualTo(ClientReminderSmsDisplayStatus.SENT);
        assertThat(dto.getSentAt()).isEqualTo(sentAt);
        assertThat(dto.getFailureReason()).isNull();
    }

    private static NotificationBatchSendLog smsFallbackSkipLog(
            Long targetId, String templateCode, LocalDateTime sentAt) {
        return NotificationBatchSendLog.builder()
                .targetId(targetId)
                .templateCode(templateCode)
                .success(false)
                .channelUsed(BatchNotificationTemplateCodes.CHANNEL_ALIMTALK)
                .errorCode(BatchNotificationTemplateCodes.ERROR_CODE_TEMPLATE_NOT_MAPPED)
                .errorMessage(smsFallbackSkipMessage())
                .sentAt(sentAt)
                .build();
    }

    /**
     * 운영에 저장된 skipNote 와 같은 문장. 표식만 상수로 결합한다.
     */
    private static String smsFallbackSkipMessage() {
        return "SMS_TEMPLATE 시드 비활성/미발견 → "
                + BatchNotificationTemplateCodes.SMS_FALLBACK_SKIP_NOTE_MARKER
                + " | alimtalk=alimtalk mapping not found";
    }
}
