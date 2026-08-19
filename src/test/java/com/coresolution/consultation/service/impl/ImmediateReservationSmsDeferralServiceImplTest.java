package com.coresolution.consultation.service.impl;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.Optional;
import com.coresolution.consultation.config.ImmediateReservationSmsProperties;
import com.coresolution.consultation.constant.BatchNotificationTemplateCodes;
import com.coresolution.consultation.constant.ImmediateReservationSmsPendingStatus;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.ImmediateReservationSmsPending;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.repository.ImmediateReservationSmsPendingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.BatchNotificationDispatchService;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link ImmediateReservationSmsDeferralServiceImpl} 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-07-29
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ImmediateReservationSmsDeferralServiceImpl")
class ImmediateReservationSmsDeferralServiceImplTest {

    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");
    private static final String TENANT_ID = "tenant-irsp-test";

    @Mock
    private ImmediateReservationSmsPendingRepository pendingRepository;
    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private BatchNotificationDispatchService batchNotificationDispatchService;

    private ImmediateReservationSmsProperties properties;
    private ImmediateReservationSmsDeferralServiceImpl service;

    @BeforeEach
    void setUp() {
        properties = new ImmediateReservationSmsProperties();
        properties.setEnabled(true);
        Clock clock = Clock.fixed(
                LocalDateTime.of(2026, 7, 29, 23, 0).atZone(SEOUL).toInstant(), SEOUL);
        service = new ImmediateReservationSmsDeferralServiceImpl(
                pendingRepository,
                scheduleRepository,
                batchNotificationDispatchService,
                properties,
                clock);
        TenantContextHolder.setTenantId(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("23:00 → resolveDeferredFireAt 익일 09:00")
    void resolveDeferredFireAt_lateNight() {
        assertThat(service.resolveDeferredFireAt())
                .contains(LocalDateTime.of(2026, 7, 30, 9, 0));
    }

    @Test
    @DisplayName("enabled=false → resolveDeferredFireAt empty(즉시)")
    void resolveDeferredFireAt_whenDisabled_empty() {
        properties.setEnabled(false);
        assertThat(service.resolveDeferredFireAt()).isEmpty();
    }

    @Test
    @DisplayName("enqueue — PENDING 신규 저장")
    void enqueue_savesPending() {
        when(pendingRepository.existsByTenantIdAndScheduleIdAndTemplateCodeAndStatusAndIsDeletedFalse(
                TENANT_ID, 10L, BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_LATE,
                ImmediateReservationSmsPendingStatus.SENT))
                .thenReturn(false);
        when(pendingRepository.findFirstByTenantIdAndScheduleIdAndTemplateCodeAndStatusAndIsDeletedFalse(
                TENANT_ID, 10L, BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_LATE,
                ImmediateReservationSmsPendingStatus.PENDING))
                .thenReturn(Optional.empty());

        LocalDateTime fireAt = LocalDateTime.of(2026, 7, 30, 9, 0);
        service.enqueue(
                TENANT_ID, 10L, BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_LATE, fireAt);

        ArgumentCaptor<ImmediateReservationSmsPending> captor =
                ArgumentCaptor.forClass(ImmediateReservationSmsPending.class);
        verify(pendingRepository).save(captor.capture());
        ImmediateReservationSmsPending saved = captor.getValue();
        assertThat(saved.getTenantId()).isEqualTo(TENANT_ID);
        assertThat(saved.getScheduleId()).isEqualTo(10L);
        assertThat(saved.getTemplateCode())
                .isEqualTo(BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_LATE);
        assertThat(saved.getFireAt()).isEqualTo(fireAt);
        assertThat(saved.getStatus()).isEqualTo(ImmediateReservationSmsPendingStatus.PENDING);
    }

    @Test
    @DisplayName("processDuePending — LATE 템플릿 디스패치 후 SENT")
    void processDuePending_dispatchesLate() {
        ImmediateReservationSmsPending pending = ImmediateReservationSmsPending.builder()
                .tenantId(TENANT_ID)
                .scheduleId(10L)
                .templateCode(BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_LATE)
                .fireAt(LocalDateTime.of(2026, 7, 30, 9, 0))
                .status(ImmediateReservationSmsPendingStatus.PENDING)
                .build();
        pending.setId(1L);

        Clock dueClock = Clock.fixed(
                LocalDateTime.of(2026, 7, 30, 9, 1).atZone(SEOUL).toInstant(), SEOUL);
        service = new ImmediateReservationSmsDeferralServiceImpl(
                pendingRepository,
                scheduleRepository,
                batchNotificationDispatchService,
                properties,
                dueClock);

        when(pendingRepository.findDuePending(
                eq(ImmediateReservationSmsPendingStatus.PENDING), any(LocalDateTime.class)))
                .thenReturn(Collections.singletonList(pending));

        Schedule schedule = new Schedule();
        schedule.setId(10L);
        schedule.setStatus(ScheduleStatus.BOOKED);
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, 10L)).thenReturn(Optional.of(schedule));
        when(pendingRepository.existsByTenantIdAndScheduleIdAndTemplateCodeAndStatusAndIsDeletedFalse(
                TENANT_ID, 10L, BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_LATE,
                ImmediateReservationSmsPendingStatus.SENT))
                .thenReturn(false);
        when(batchNotificationDispatchService.dispatchReservationImmediateLate(10L))
                .thenReturn(new BatchNotificationDispatchService.DispatchOutcome(
                        BatchNotificationDispatchService.DispatchOutcome.Status.SMS_ONLY_SENT,
                        "SMS", false, null, null, 99L));

        int processed = service.processDuePending();

        assertThat(processed).isEqualTo(1);
        verify(batchNotificationDispatchService).dispatchReservationImmediateLate(10L);
        verify(pendingRepository).save(pending);
        assertThat(pending.getStatus()).isEqualTo(ImmediateReservationSmsPendingStatus.SENT);
    }

    @Test
    @DisplayName("processDuePending — 당일 교차 멱등 SKIPPED_DUPLICATE 시 pending도 SKIPPED_DUPLICATE")
    void processDuePending_dayCollisionMarksSkippedDuplicate() {
        ImmediateReservationSmsPending pending = ImmediateReservationSmsPending.builder()
                .tenantId(TENANT_ID)
                .scheduleId(10L)
                .templateCode(BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_SINGLE)
                .fireAt(LocalDateTime.of(2026, 7, 30, 9, 0))
                .status(ImmediateReservationSmsPendingStatus.PENDING)
                .build();
        pending.setId(3L);

        Clock dueClock = Clock.fixed(
                LocalDateTime.of(2026, 7, 30, 9, 1).atZone(SEOUL).toInstant(), SEOUL);
        service = new ImmediateReservationSmsDeferralServiceImpl(
                pendingRepository,
                scheduleRepository,
                batchNotificationDispatchService,
                properties,
                dueClock);

        when(pendingRepository.findDuePending(
                eq(ImmediateReservationSmsPendingStatus.PENDING), any(LocalDateTime.class)))
                .thenReturn(Collections.singletonList(pending));

        Schedule schedule = new Schedule();
        schedule.setId(10L);
        schedule.setStatus(ScheduleStatus.BOOKED);
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, 10L)).thenReturn(Optional.of(schedule));
        when(pendingRepository.existsByTenantIdAndScheduleIdAndTemplateCodeAndStatusAndIsDeletedFalse(
                TENANT_ID, 10L, BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_SINGLE,
                ImmediateReservationSmsPendingStatus.SENT))
                .thenReturn(false);
        when(batchNotificationDispatchService.dispatchReservationImmediateSingle(10L))
                .thenReturn(new BatchNotificationDispatchService.DispatchOutcome(
                        BatchNotificationDispatchService.DispatchOutcome.Status.SKIPPED_DUPLICATE,
                        null, false, null, null, null));

        int processed = service.processDuePending();

        assertThat(processed).isEqualTo(1);
        assertThat(pending.getStatus())
                .isEqualTo(ImmediateReservationSmsPendingStatus.SKIPPED_DUPLICATE);
    }

    @Test
    @DisplayName("processDuePending — CANCELLED 스케줄은 SKIPPED_CANCELLED")
    void processDuePending_cancelledSkipped() {
        ImmediateReservationSmsPending pending = ImmediateReservationSmsPending.builder()
                .tenantId(TENANT_ID)
                .scheduleId(10L)
                .templateCode(BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_SINGLE)
                .fireAt(LocalDateTime.of(2026, 7, 30, 9, 0))
                .status(ImmediateReservationSmsPendingStatus.PENDING)
                .build();
        pending.setId(2L);

        Clock dueClock = Clock.fixed(
                Instant.parse("2026-07-30T00:01:00Z"), SEOUL);
        service = new ImmediateReservationSmsDeferralServiceImpl(
                pendingRepository,
                scheduleRepository,
                batchNotificationDispatchService,
                properties,
                dueClock);

        when(pendingRepository.findDuePending(
                eq(ImmediateReservationSmsPendingStatus.PENDING), any(LocalDateTime.class)))
                .thenReturn(Collections.singletonList(pending));

        Schedule schedule = new Schedule();
        schedule.setId(10L);
        schedule.setStatus(ScheduleStatus.CANCELLED);
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, 10L)).thenReturn(Optional.of(schedule));

        int processed = service.processDuePending();

        assertThat(processed).isEqualTo(1);
        verify(batchNotificationDispatchService, never()).dispatchReservationImmediateSingle(any());
        assertThat(pending.getStatus()).isEqualTo(ImmediateReservationSmsPendingStatus.SKIPPED_CANCELLED);
    }

    @Test
    @DisplayName("processDuePending — COMPLETED 스케줄은 SKIPPED_CANCELLED (배지 미표시 패턴 유지)")
    void processDuePending_completedSkipped() {
        ImmediateReservationSmsPending pending = ImmediateReservationSmsPending.builder()
                .tenantId(TENANT_ID)
                .scheduleId(11L)
                .templateCode(BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_SINGLE)
                .fireAt(LocalDateTime.of(2026, 7, 30, 9, 0))
                .status(ImmediateReservationSmsPendingStatus.PENDING)
                .build();
        pending.setId(3L);

        Clock dueClock = Clock.fixed(
                Instant.parse("2026-07-30T00:01:00Z"), SEOUL);
        service = new ImmediateReservationSmsDeferralServiceImpl(
                pendingRepository,
                scheduleRepository,
                batchNotificationDispatchService,
                properties,
                dueClock);

        when(pendingRepository.findDuePending(
                eq(ImmediateReservationSmsPendingStatus.PENDING), any(LocalDateTime.class)))
                .thenReturn(Collections.singletonList(pending));

        Schedule schedule = new Schedule();
        schedule.setId(11L);
        schedule.setStatus(ScheduleStatus.COMPLETED);
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, 11L)).thenReturn(Optional.of(schedule));

        int processed = service.processDuePending();

        assertThat(processed).isEqualTo(1);
        verify(batchNotificationDispatchService, never()).dispatchReservationImmediateSingle(any());
        assertThat(pending.getStatus()).isEqualTo(ImmediateReservationSmsPendingStatus.SKIPPED_CANCELLED);
    }

    @Test
    @DisplayName("슬롯 변경 pending 취소 — D2/LATE PENDING 만 SKIPPED_CANCELLED, SINGLE 유지, 즉시 dispatch 없음")
    void cancelPendingReservationReminders_marksD2LatePending() {
        ImmediateReservationSmsPending d2 = ImmediateReservationSmsPending.builder()
                .tenantId(TENANT_ID)
                .scheduleId(10L)
                .templateCode(BatchNotificationTemplateCodes.RESERVATION_REMINDER_D2)
                .fireAt(LocalDateTime.of(2026, 7, 30, 9, 0))
                .status(ImmediateReservationSmsPendingStatus.PENDING)
                .build();
        d2.setId(21L);
        ImmediateReservationSmsPending late = ImmediateReservationSmsPending.builder()
                .tenantId(TENANT_ID)
                .scheduleId(10L)
                .templateCode(BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_LATE)
                .fireAt(LocalDateTime.of(2026, 7, 30, 9, 0))
                .status(ImmediateReservationSmsPendingStatus.PENDING)
                .build();
        late.setId(22L);
        ImmediateReservationSmsPending single = ImmediateReservationSmsPending.builder()
                .tenantId(TENANT_ID)
                .scheduleId(10L)
                .templateCode(BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_SINGLE)
                .fireAt(LocalDateTime.of(2026, 7, 30, 9, 0))
                .status(ImmediateReservationSmsPendingStatus.PENDING)
                .build();
        single.setId(23L);

        when(pendingRepository.findPendingByTenantScheduleAndTemplateCodes(
                eq(TENANT_ID),
                eq(10L),
                eq(ImmediateReservationSmsPendingStatus.PENDING),
                eq(BatchNotificationTemplateCodes.RESERVATION_REMINDER_DN_CODES)))
                .thenReturn(java.util.List.of(d2, late));

        int cancelled = service.cancelPendingReservationReminders(
                TENANT_ID, 10L, BatchNotificationTemplateCodes.RESERVATION_REMINDER_DN_CODES);

        assertThat(cancelled).isEqualTo(2);
        assertThat(d2.getStatus()).isEqualTo(ImmediateReservationSmsPendingStatus.SKIPPED_CANCELLED);
        assertThat(late.getStatus()).isEqualTo(ImmediateReservationSmsPendingStatus.SKIPPED_CANCELLED);
        assertThat(single.getStatus()).isEqualTo(ImmediateReservationSmsPendingStatus.PENDING);
        verify(batchNotificationDispatchService, never()).dispatchReservationReminderD2(any());
        verify(batchNotificationDispatchService, never()).dispatchReservationImmediateLate(any());
        verify(batchNotificationDispatchService, never()).dispatchReservationImmediateSingle(any());
        verify(pendingRepository, times(2)).save(any(ImmediateReservationSmsPending.class));
    }

    @Test
    @DisplayName("tenantId 없으면 pending 취소 0건")
    void cancelPendingReservationReminders_blankTenant_skips() {
        int cancelled = service.cancelPendingReservationReminders(
                " ", 10L, BatchNotificationTemplateCodes.RESERVATION_REMINDER_DN_CODES);
        assertThat(cancelled).isZero();
        verify(pendingRepository, never()).findPendingByTenantScheduleAndTemplateCodes(
                any(), any(), any(), any());
        verify(batchNotificationDispatchService, never()).dispatchReservationReminderD2(any());
    }

    @Test
    @DisplayName("scheduleId 없으면 pending 취소 0건")
    void cancelPendingReservationReminders_nullSchedule_skips() {
        int cancelled = service.cancelPendingReservationReminders(
                TENANT_ID, null, BatchNotificationTemplateCodes.RESERVATION_REMINDER_DN_CODES);
        assertThat(cancelled).isZero();
        verify(pendingRepository, never()).findPendingByTenantScheduleAndTemplateCodes(
                any(), any(), any(), any());
        verify(batchNotificationDispatchService, never()).dispatchReservationReminderD2(any());
        verify(batchNotificationDispatchService, never()).dispatchReservationImmediateLate(any());
    }

    @Test
    @DisplayName("templateCodes 비면 pending 취소 0건")
    void cancelPendingReservationReminders_emptyCodes_skips() {
        int cancelled = service.cancelPendingReservationReminders(
                TENANT_ID, 10L, java.util.List.of());
        assertThat(cancelled).isZero();
        verify(pendingRepository, never()).findPendingByTenantScheduleAndTemplateCodes(
                any(), any(), any(), any());
        verify(batchNotificationDispatchService, never()).dispatchReservationReminderD2(any());
        verify(batchNotificationDispatchService, never()).dispatchReservationImmediateLate(any());
    }
}
