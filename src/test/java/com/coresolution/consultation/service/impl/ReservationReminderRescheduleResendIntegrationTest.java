package com.coresolution.consultation.service.impl;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import com.coresolution.consultation.config.BatchNotificationProperties;
import com.coresolution.consultation.constant.BatchNotificationTemplateCodes;
import com.coresolution.consultation.constant.BookingReminderPushConstants;
import com.coresolution.consultation.constant.NotificationSchedulerFlagKeys;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.NotificationBatchSendLog;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ImmediateReservationSmsPendingRepository;
import com.coresolution.consultation.repository.NotificationBatchSendLogRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserPrivacyConsentRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.scheduler.ReservationReminderScheduler;
import com.coresolution.consultation.service.BatchNotificationDispatchService.DispatchOutcome;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.SmsTemplateService;
import com.coresolution.consultation.service.SystemConfigService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.consultation.util.PhoneLogMasking;
import com.coresolution.consultation.util.ReservationSmsBusinessHours;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.service.SchedulerAlertService;
import com.coresolution.core.service.SchedulerExecutionLogService;
import com.coresolution.core.service.TenantService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 일정 일시 변경 시 D-2/D-1 예약 리마인드 SMS 재발송 — 실 {@code notification_batch_send_log}(H2) 통합 검증.
 *
 * <p>멱등 로그 저장소·로거는 실 빈, SMS 발송기({@link NotificationDispatchHelper})는 mock 이므로
 * 실제 문자는 발송되지 않는다. 일정·사용자 조회는 mock 으로 두고 테스트에서 일정 일시를 직접 바꿔
 * 드래그·수정 모달·상담 재예약 등 모든 변경 경로의 결과 상태를 재현한다.
 *
 * <p>일자별 배치 실행은 {@link #runReminderBatchOn(LocalDate)} 가 스케줄러의 대상일 규칙
 * (D-2 → {@code RESERVATION_REMINDER_D2}, D-1·D-0 → {@code RESERVATION_IMMEDIATE_LATE})을 따라 호출한다.
 * 시뮬레이션 일자는 실제 오늘과 겹치지 않는 미래로 두어 당일 1통 가드(실 발송 시각 기준)와 분리한다.
 *
 * @author MindGarden
 * @since 2026-09-30
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@ActiveProfiles("test")
@DisplayName("예약 리마인드 슬롯 멱등 — 일시 변경 시 재발송 (실 send_log)")
class ReservationReminderRescheduleResendIntegrationTest {

    private static final long SIMULATION_OFFSET_DAYS = 60L;
    private static final LocalTime BATCH_RUN_TIME = LocalTime.of(9, 0);
    private static final LocalTime SLOT_START = LocalTime.of(14, 30);
    private static final LocalTime SLOT_END = LocalTime.of(15, 30);
    private static final Long SCHEDULE_ID = 91001L;
    private static final Long CLIENT_ID = 92001L;
    private static final Long CONSULTANT_ID = 93001L;
    private static final String PHONE = "01012345678";

    @Autowired
    private NotificationBatchSendLogRepository sendLogRepository;
    @Autowired
    private NotificationBatchSendLogger sendLogger;

    private ScheduleRepository scheduleRepository;
    private UserRepository userRepository;
    private ConsultantClientMappingRepository mappingRepository;
    private NotificationDispatchHelper dispatchHelper;
    private SmsTemplateService smsTemplateService;
    private PersonalDataEncryptionUtil encryptionUtil;
    private BatchNotificationProperties properties;

    private String tenantId;
    private Schedule schedule;
    private LocalDate simulationBase;

    @BeforeEach
    void setUp() {
        scheduleRepository = mock(ScheduleRepository.class);
        userRepository = mock(UserRepository.class);
        mappingRepository = mock(ConsultantClientMappingRepository.class);
        dispatchHelper = mock(NotificationDispatchHelper.class);
        smsTemplateService = mock(SmsTemplateService.class);
        encryptionUtil = mock(PersonalDataEncryptionUtil.class);

        properties = new BatchNotificationProperties();
        properties.setAlimtalkEnabled(false);
        properties.setSmsStaticFallbackEnabled(true);

        when(smsTemplateService.isGlobalAutoDispatchEnabled()).thenReturn(true);
        when(smsTemplateService.isAutoDispatchEnabledFor(anyString(), anyString())).thenReturn(true);
        when(encryptionUtil.decrypt(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(dispatchHelper.dispatchSms(anyString(), anyString()))
            .thenReturn(new NotificationDispatchHelper.DispatchResult(true, null, null, null, null));

        tenantId = UUID.randomUUID().toString();
        simulationBase = LocalDate.now(ReservationSmsBusinessHours.ZONE_SEOUL)
            .plusDays(SIMULATION_OFFSET_DAYS);
        schedule = buildSchedule(tenantId, simulationBase.plusDays(10));
        givenScheduleLookup(tenantId, schedule);
        givenUsers(tenantId);
        givenActiveMapping(tenantId);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("D-1 발송 완료 후 다른 날로 이동 → 새 일자 D-1 에 정확히 1회 재발송, 기존 이력 보존")
    void movedAfterD1Sent_resendsOnceForNewSlot_keepsHistory() {
        LocalDate originalDate = schedule.getDate();
        runReminderBatchOn(originalDate.minusDays(1));
        assertThat(lateSendsFor(tenantId, originalDate)).isEqualTo(1);
        NotificationBatchSendLog originalLog = findLateLogs(tenantId, originalDate).get(0);

        LocalDate newDate = originalDate.plusDays(5);
        schedule.setDate(newDate);
        runDailyBatchesBetween(originalDate, newDate);

        assertThat(lateSendsFor(tenantId, newDate)).isEqualTo(1);
        assertThat(lateLogCount(tenantId)).isEqualTo(2);
        List<NotificationBatchSendLog> originalAfter = findLateLogs(tenantId, originalDate);
        assertThat(originalAfter).hasSize(1);
        assertThat(originalAfter.get(0).getId()).isEqualTo(originalLog.getId());
        assertThat(originalAfter.get(0).getSentAt()).isEqualTo(originalLog.getSentAt());
        assertThat(originalAfter.get(0).getSuccess()).isTrue();
    }

    @Test
    @DisplayName("같은 일정 2번 이동 → 최종 일자에만 D-1 1회 (중간 일자 미발송, 반복 실행에도 1회)")
    void movedTwice_sendsOnlyForFinalSlot() {
        LocalDate originalDate = schedule.getDate();
        runReminderBatchOn(originalDate.minusDays(1));

        LocalDate intermediateDate = originalDate.plusDays(7);
        schedule.setDate(intermediateDate);
        runDailyBatchesBetween(originalDate, originalDate.plusDays(2));

        LocalDate finalDate = originalDate.plusDays(4);
        schedule.setDate(finalDate);
        schedule.setStartTime(LocalTime.of(11, 0));
        schedule.setEndTime(LocalTime.of(12, 0));
        runDailyBatchesBetween(originalDate.plusDays(2), finalDate);
        runReminderBatchOn(finalDate.minusDays(1));
        runReminderBatchOn(finalDate);

        assertThat(lateSendsFor(tenantId, finalDate)).isEqualTo(1);
        assertThat(findLateLogs(tenantId, intermediateDate)).isEmpty();
        assertThat(lateLogCount(tenantId)).isEqualTo(2);
    }

    @Test
    @DisplayName("같은 날 시간만 변경 → 새 시각 슬롯으로 1회 재발송")
    void timeOnlyChange_resendsOnceForNewTime() {
        LocalDate date = schedule.getDate();
        runReminderBatchOn(date.minusDays(1));

        schedule.setStartTime(LocalTime.of(17, 0));
        schedule.setEndTime(LocalTime.of(18, 0));
        runReminderBatchOn(date);
        runReminderBatchOn(date);

        assertThat(lateLogCount(tenantId)).isEqualTo(2);
        assertThat(sendLogRepository.findSlotScopedReminderLogs(tenantId,
            BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_LATE,
            BatchNotificationTemplateCodes.TARGET_TYPE_SCHEDULE, SCHEDULE_ID, CLIENT_ID,
            BatchNotificationTemplateCodes.buildReminderSlotKey(date, LocalTime.of(17, 0)),
            BatchNotificationTemplateCodes.TARGET_SLOT_KEY_NONE,
            date.atStartOfDay(), date.atStartOfDay())).hasSize(1);
    }

    @Test
    @DisplayName("일시 변경 없는 수정(상담사·메모) → 재발송 없음")
    void editWithoutSlotChange_doesNotResend() {
        LocalDate date = schedule.getDate();
        runReminderBatchOn(date.minusDays(1));
        verify(dispatchHelper, times(1)).dispatchSms(anyString(), anyString());

        schedule.setDescription("memo changed");
        schedule.setTitle("title changed");
        runReminderBatchOn(date.minusDays(1));
        runReminderBatchOn(date);

        verify(dispatchHelper, times(1)).dispatchSms(anyString(), anyString());
        assertThat(lateLogCount(tenantId)).isEqualTo(1);
    }

    @Test
    @DisplayName("취소된 일정 → 이동 후에도 발송 없음")
    void cancelledSchedule_noSend() {
        LocalDate newDate = schedule.getDate().plusDays(3);
        schedule.setDate(newDate);
        schedule.setStatus(ScheduleStatus.CANCELLED);

        DispatchOutcome outcome = dispatchLateAt(newDate.minusDays(1).atTime(BATCH_RUN_TIME));

        assertThat(outcome.status()).isEqualTo(DispatchOutcome.Status.SKIPPED_VALIDATION);
        verify(dispatchHelper, never()).dispatchSms(anyString(), anyString());
        assertThat(lateLogCount(tenantId)).isZero();
    }

    @Test
    @DisplayName("과거(이미 시작한 시각)로 이동된 일정 → SCHEDULE_SLOT_PAST, 발송 없음")
    void movedToPastSlot_noSend() {
        LocalDate day = schedule.getDate();
        schedule.setStartTime(LocalTime.of(10, 0));
        schedule.setEndTime(LocalTime.of(11, 0));

        DispatchOutcome late = dispatchLateAt(day.atTime(LocalTime.of(15, 0)));
        DispatchOutcome d2 = dispatchD2At(day.atTime(LocalTime.of(15, 0)));

        assertThat(late.status()).isEqualTo(DispatchOutcome.Status.SKIPPED_VALIDATION);
        assertThat(late.errorCode()).isEqualTo(BatchNotificationTemplateCodes.ERROR_CODE_SCHEDULE_SLOT_PAST);
        assertThat(d2.status()).isEqualTo(DispatchOutcome.Status.SKIPPED_VALIDATION);
        assertThat(d2.errorCode()).isEqualTo(BatchNotificationTemplateCodes.ERROR_CODE_SCHEDULE_SLOT_PAST);
        verify(dispatchHelper, never()).dispatchSms(anyString(), anyString());
        assertThat(lateLogCount(tenantId)).isZero();
    }

    @Test
    @DisplayName("당일 09:00 배치 이후 내일로 이동 → 다음 09:00(D-0) 배치에서 새 슬롯 1회 발송 (누락 없음)")
    void movedToTomorrowAfterBatch_sentOnNextRun() {
        LocalDate moveDay = simulationBase;
        runReminderBatchOn(moveDay);
        assertThat(lateLogCount(tenantId)).isZero();

        LocalDate tomorrow = moveDay.plusDays(1);
        schedule.setDate(tomorrow);
        runReminderBatchOn(tomorrow);
        runReminderBatchOn(tomorrow);

        assertThat(lateSendsFor(tenantId, tomorrow)).isEqualTo(1);
    }

    @Test
    @DisplayName("테넌트 격리 — 다른 테넌트의 동일 스케줄·수신자·슬롯 이력은 발송을 막지 않고, 서로 영향 없음")
    void tenantIsolation() {
        LocalDate date = schedule.getDate();
        String otherTenant = UUID.randomUUID().toString();
        Schedule otherSchedule = buildSchedule(otherTenant, date);
        givenScheduleLookup(otherTenant, otherSchedule);
        givenUsers(otherTenant);
        givenActiveMapping(otherTenant);
        sendLogRepository.save(sentLateLog(otherTenant,
            BatchNotificationTemplateCodes.buildReminderSlotKey(date, SLOT_START),
            date.minusDays(1).atTime(BATCH_RUN_TIME)));

        DispatchOutcome mine = dispatchLateAt(date.minusDays(1).atTime(BATCH_RUN_TIME));
        TenantContextHolder.clear();
        DispatchOutcome others = dispatchLateAt(otherTenant, date.minusDays(1).atTime(BATCH_RUN_TIME));

        assertThat(mine.status()).isEqualTo(DispatchOutcome.Status.SMS_ONLY_SENT);
        assertThat(others.status()).isEqualTo(DispatchOutcome.Status.SKIPPED_DUPLICATE);
        assertThat(lateLogCount(tenantId)).isEqualTo(1);
        assertThat(lateLogCount(otherTenant)).isEqualTo(1);
        verify(dispatchHelper, times(1)).dispatchSms(anyString(), anyString());
    }

    @Test
    @DisplayName("슬롯 미기록(기존) 행 — 현재 슬롯 D-N~D-0 구간 발송분이면 skip, 이동 후 구간 밖이면 재발송")
    void legacyRowWithoutSlotKey_matchesOnlyInsideCurrentSlotWindow() {
        LocalDate date = schedule.getDate();
        sendLogRepository.save(sentLateLog(tenantId,
            BatchNotificationTemplateCodes.TARGET_SLOT_KEY_NONE,
            date.minusDays(1).atTime(BATCH_RUN_TIME)));

        DispatchOutcome sameSlot = dispatchLateAt(date.atTime(BATCH_RUN_TIME));
        assertThat(sameSlot.status()).isEqualTo(DispatchOutcome.Status.SKIPPED_DUPLICATE);
        verify(dispatchHelper, never()).dispatchSms(anyString(), anyString());

        LocalDate newDate = date.plusDays(6);
        schedule.setDate(newDate);
        DispatchOutcome moved = dispatchLateAt(newDate.minusDays(1).atTime(BATCH_RUN_TIME));

        assertThat(moved.status()).isEqualTo(DispatchOutcome.Status.SMS_ONLY_SENT);
        assertThat(lateSendsFor(tenantId, newDate)).isEqualTo(1);
        assertThat(lateLogCount(tenantId)).isEqualTo(2);
    }

    @Test
    @DisplayName("스케줄러 E2E — 오늘 일정이 내일로 이동 → 오늘 09:00 D-1 배치 1회 발송, 재실행 시 추가 발송 없음")
    void scheduler_movedFromTodayToTomorrow_sendsExactlyOnce() {
        LocalDate today = LocalDate.now();
        LocalDate tomorrow = today.plusDays(BookingReminderPushConstants.REMINDER_D1_DAYS_AHEAD);
        sendLogRepository.save(sentLateLog(tenantId,
            BatchNotificationTemplateCodes.buildReminderSlotKey(today, SLOT_START),
            LocalDateTime.now().minusDays(1)));
        schedule.setDate(tomorrow);
        when(scheduleRepository.findByTenantIdAndDateAndStatusIn(eq(tenantId), any(LocalDate.class), anyList()))
            .thenAnswer(inv -> schedule.getDate().equals(inv.getArgument(1))
                ? List.of(schedule) : List.of());
        ReservationReminderScheduler scheduler = newScheduler(
            newDispatchService(Clock.system(ReservationSmsBusinessHours.ZONE_SEOUL)));

        scheduler.runDailyReminder();
        scheduler.runDailyReminder();

        verify(dispatchHelper, times(1)).dispatchSms(eq(PHONE), anyString());
        assertThat(lateSendsFor(tenantId, tomorrow)).isEqualTo(1);
        assertThat(lateLogCount(tenantId)).isEqualTo(2);
    }

    // ------------------------------------------------------------------ helpers

    /**
     * 스케줄러 대상일 규칙대로 해당 일자 09:00 배치를 1회 실행한다.
     */
    private void runReminderBatchOn(LocalDate day) {
        LocalDate slotDate = schedule.getDate();
        LocalDateTime runAt = day.atTime(BATCH_RUN_TIME);
        if (slotDate.equals(day.plusDays(properties.getReservationReminderDaysAhead()))) {
            dispatchD2At(runAt);
        } else if (slotDate.equals(day.plusDays(BookingReminderPushConstants.REMINDER_D1_DAYS_AHEAD))
                || slotDate.equals(day)) {
            dispatchLateAt(runAt);
        }
    }

    /** {@code fromExclusive} 다음 날부터 {@code toInclusive} 까지 매일 배치 실행. */
    private void runDailyBatchesBetween(LocalDate fromExclusive, LocalDate toInclusive) {
        for (LocalDate day = fromExclusive.plusDays(1); !day.isAfter(toInclusive); day = day.plusDays(1)) {
            runReminderBatchOn(day);
        }
    }

    private DispatchOutcome dispatchLateAt(LocalDateTime at) {
        return dispatchLateAt(tenantId, at);
    }

    private DispatchOutcome dispatchLateAt(String tenant, LocalDateTime at) {
        TenantContextHolder.setTenantId(tenant);
        try {
            return newDispatchService(clockAt(at)).dispatchReservationImmediateLate(SCHEDULE_ID);
        } finally {
            TenantContextHolder.clear();
        }
    }

    private DispatchOutcome dispatchD2At(LocalDateTime at) {
        TenantContextHolder.setTenantId(tenantId);
        try {
            return newDispatchService(clockAt(at)).dispatchReservationReminderD2(SCHEDULE_ID);
        } finally {
            TenantContextHolder.clear();
        }
    }

    private Clock clockAt(LocalDateTime at) {
        return Clock.fixed(at.atZone(ReservationSmsBusinessHours.ZONE_SEOUL).toInstant(),
            ReservationSmsBusinessHours.ZONE_SEOUL);
    }

    private BatchNotificationDispatchServiceImpl newDispatchService(Clock clock) {
        return new BatchNotificationDispatchServiceImpl(
            scheduleRepository, mappingRepository, userRepository,
            mock(UserPrivacyConsentRepository.class), sendLogRepository, sendLogger,
            dispatchHelper, mock(AlimtalkTemplateMappingResolver.class), encryptionUtil,
            properties, smsTemplateService, clock);
    }

    private ReservationReminderScheduler newScheduler(BatchNotificationDispatchServiceImpl dispatchService) {
        TenantService tenantService = mock(TenantService.class);
        when(tenantService.getAllActiveTenantIds()).thenReturn(List.of(tenantId));
        SystemConfigService systemConfigService = mock(SystemConfigService.class);
        when(systemConfigService.getGlobalBoolean(
                eq(NotificationSchedulerFlagKeys.RESERVATION_REMINDER_ENABLED), anyBoolean()))
            .thenReturn(true);
        ImmediateReservationSmsPendingRepository pendingRepository =
            mock(ImmediateReservationSmsPendingRepository.class);
        when(pendingRepository.existsPendingForScheduleAndFireAtRange(any(), any(), any(), any(), any()))
            .thenReturn(false);
        return new ReservationReminderScheduler(tenantService, scheduleRepository,
            mappingRepository, pendingRepository, dispatchService,
            mock(MobilePushDispatchService.class), properties,
            mock(SchedulerExecutionLogService.class), mock(SchedulerAlertService.class),
            systemConfigService);
    }

    private long lateSendsFor(String tenant, LocalDate slotDate) {
        return findLateLogs(tenant, slotDate).stream()
            .filter(l -> Boolean.TRUE.equals(l.getSuccess()))
            .count();
    }

    private List<NotificationBatchSendLog> findLateLogs(String tenant, LocalDate slotDate) {
        return sendLogRepository.findAll().stream()
            .filter(l -> tenant.equals(l.getTenantId()))
            .filter(l -> BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_LATE.equals(l.getTemplateCode()))
            .filter(l -> l.getTargetSlotKey().startsWith(slotDate.toString()))
            .toList();
    }

    private long lateLogCount(String tenant) {
        return sendLogRepository.findAll().stream()
            .filter(l -> tenant.equals(l.getTenantId()))
            .filter(l -> BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_LATE.equals(l.getTemplateCode()))
            .count();
    }

    private NotificationBatchSendLog sentLateLog(String tenant, String slotKey, LocalDateTime sentAt) {
        NotificationBatchSendLog log = NotificationBatchSendLog.builder()
            .templateCode(BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_LATE)
            .targetType(BatchNotificationTemplateCodes.TARGET_TYPE_SCHEDULE)
            .targetId(SCHEDULE_ID)
            .recipientUserId(CLIENT_ID)
            .targetSlotKey(slotKey)
            .recipientPhoneMasked(PhoneLogMasking.maskForLog(PHONE))
            .channelUsed(BatchNotificationTemplateCodes.CHANNEL_SMS)
            .success(true)
            .fallbackToSms(false)
            .sentAt(sentAt)
            .build();
        log.setTenantId(tenant);
        log.setIsDeleted(Boolean.FALSE);
        return log;
    }

    private Schedule buildSchedule(String tenant, LocalDate date) {
        Schedule s = new Schedule();
        s.setId(SCHEDULE_ID);
        s.setTenantId(tenant);
        s.setConsultantId(CONSULTANT_ID);
        s.setClientId(CLIENT_ID);
        s.setDate(date);
        s.setStartTime(SLOT_START);
        s.setEndTime(SLOT_END);
        s.setStatus(ScheduleStatus.BOOKED);
        s.setIsDeleted(false);
        return s;
    }

    private void givenScheduleLookup(String tenant, Schedule target) {
        when(scheduleRepository.findByTenantIdAndId(tenant, SCHEDULE_ID))
            .thenAnswer(inv -> Optional.of(target));
    }

    private void givenUsers(String tenant) {
        User client = new User();
        client.setId(CLIENT_ID);
        client.setPhone(PHONE);
        User consultant = new User();
        consultant.setId(CONSULTANT_ID);
        when(userRepository.findByTenantIdAndIdIgnoringDeleted(eq(tenant), anyLong()))
            .thenAnswer(inv -> CLIENT_ID.equals(inv.getArgument(1))
                ? Optional.of(client) : Optional.of(consultant));
    }

    private void givenActiveMapping(String tenant) {
        User consultant = new User();
        consultant.setId(CONSULTANT_ID);
        User client = new User();
        client.setId(CLIENT_ID);
        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
            .consultant(consultant)
            .client(client)
            .totalSessions(10)
            .remainingSessions(5)
            .usedSessions(5)
            .status(MappingStatus.ACTIVE)
            .build();
        mapping.setTenantId(tenant);
        when(mappingRepository.findActiveExhaustedOrPendingPaymentListByTenantIdAndConsultantIdAndClientId(
                eq(tenant), anyLong(), anyLong()))
            .thenReturn(List.of(mapping));
    }
}
