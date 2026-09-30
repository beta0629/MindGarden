package com.coresolution.consultation.service.impl;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Consumer;
import com.coresolution.consultation.config.BatchNotificationProperties;
import com.coresolution.consultation.constant.BatchNotificationTemplateCodes;
import com.coresolution.consultation.constant.ScheduleChangeNotificationPendingStatus;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.NotificationBatchSendLog;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.ScheduleChangeNotificationPending;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.NotificationBatchSendLogRepository;
import com.coresolution.consultation.repository.ScheduleChangeNotificationPendingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserPrivacyConsentRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.BatchNotificationDispatchService.DispatchOutcome;
import com.coresolution.consultation.service.SmsTemplateService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.consultation.util.PhoneLogMasking;
import com.coresolution.consultation.util.ReservationSmsBusinessHours;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * #1324 후속 — 슬롯 미기록(기존) 발송 이력: 일시가 실제로 바뀐 경우에만 재발송 (실 JPA 일정·send_log, H2).
 *
 * <p>일정은 실제 {@link ScheduleRepository} 로 저장·수정해 {@code slot_changed_at} 추적(@PreUpdate)까지 검증한다.
 * SMS 발송기({@link NotificationDispatchHelper})는 mock 이므로 실제 문자는 발송되지 않는다.
 * 기존 발송 이력 행은 테스트 픽스처로만 넣고 코드가 수정하지 않는지 확인한다.
 *
 * @author MindGarden
 * @since 2026-09-30
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@ActiveProfiles("test")
@DisplayName("예약 리마인드 — 슬롯 미기록 이력: 일시 변경만 재발송 (메모·상태 수정·되돌리기 제외)")
class ReservationReminderLegacySlotEvidenceIntegrationTest {

    private static final LocalTime BATCH_RUN_TIME = LocalTime.of(9, 0);
    private static final LocalTime SLOT_START = LocalTime.of(14, 30);
    private static final LocalTime SLOT_END = LocalTime.of(15, 30);
    private static final LocalTime OTHER_START = LocalTime.of(17, 0);
    private static final LocalTime OTHER_END = LocalTime.of(18, 0);
    private static final LocalTime FIXTURE_TIME = LocalTime.of(12, 0);
    private static final long SCHEDULE_CREATED_DAYS_BEFORE_SLOT = 4L;
    private static final long LEGACY_SENT_DAYS_BEFORE_SLOT = 2L;
    private static final Long CLIENT_ID = 95101L;
    private static final Long CONSULTANT_ID = 96101L;
    private static final String PHONE = "01012345678";
    private static final String BACKDATE_SCHEDULE_SQL =
        "UPDATE schedules SET created_at = ?, updated_at = ? WHERE id = ?";
    private static final String UPDATE_CHANGE_CREATED_AT_SQL =
        "UPDATE schedule_change_notification_pending SET created_at = ? WHERE id = ?";

    @Autowired
    private ScheduleRepository scheduleRepository;
    @Autowired
    private NotificationBatchSendLogRepository sendLogRepository;
    @Autowired
    private NotificationBatchSendLogger sendLogger;
    @Autowired
    private ScheduleChangeNotificationPendingRepository scheduleChangeHistoryRepository;
    @Autowired
    private JdbcTemplate jdbcTemplate;
    @Autowired
    private PlatformTransactionManager transactionManager;

    private UserRepository userRepository;
    private ConsultantClientMappingRepository mappingRepository;
    private NotificationDispatchHelper dispatchHelper;
    private SmsTemplateService smsTemplateService;
    private PersonalDataEncryptionUtil encryptionUtil;
    private BatchNotificationProperties properties;
    private TransactionTemplate transactionTemplate;

    private String tenantId;
    private Long scheduleId;
    private LocalDate slotDate;
    private LocalDateTime scheduleLastUpdatedAt;
    private LocalDateTime legacySentAt;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        mappingRepository = mock(ConsultantClientMappingRepository.class);
        dispatchHelper = mock(NotificationDispatchHelper.class);
        smsTemplateService = mock(SmsTemplateService.class);
        encryptionUtil = mock(PersonalDataEncryptionUtil.class);
        transactionTemplate = new TransactionTemplate(transactionManager);

        properties = new BatchNotificationProperties();
        properties.setAlimtalkEnabled(false);
        properties.setSmsStaticFallbackEnabled(true);

        when(smsTemplateService.isGlobalAutoDispatchEnabled()).thenReturn(true);
        when(smsTemplateService.isAutoDispatchEnabledFor(anyString(), anyString())).thenReturn(true);
        when(encryptionUtil.decrypt(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(dispatchHelper.dispatchSms(anyString(), anyString()))
            .thenReturn(new NotificationDispatchHelper.DispatchResult(true, null, null, null, null));

        tenantId = UUID.randomUUID().toString();
        slotDate = LocalDate.now(ReservationSmsBusinessHours.ZONE_SEOUL).plusDays(1);
        scheduleLastUpdatedAt = slotDate.minusDays(SCHEDULE_CREATED_DAYS_BEFORE_SLOT).atTime(FIXTURE_TIME);
        legacySentAt = slotDate.minusDays(LEGACY_SENT_DAYS_BEFORE_SLOT).atTime(BATCH_RUN_TIME);
        scheduleId = persistBackdatedSchedule();
        givenUsers();
        givenActiveMapping();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    // ------------------------------------------------------------ 일시 외 수정 → 재발송 없음

    @Test
    @DisplayName("기존 행 + 변경 이력 없음 + 메모만 수정 → 같은 일시이므로 재발송 없음, 기존 행 무수정")
    void legacyRow_memoOnlyEdit_noResend() {
        NotificationBatchSendLog legacy = saveLegacyLateLog();

        editSchedule(s -> s.setDescription("메모만 수정"));

        Schedule edited = loadSchedule();
        assertThat(edited.getUpdatedAt()).isAfter(legacySentAt);
        assertThat(edited.getSlotChangedAt()).isEqualTo(scheduleLastUpdatedAt);
        DispatchOutcome outcome = dispatchLateAtSlotDay();

        assertThat(outcome.status()).isEqualTo(DispatchOutcome.Status.SKIPPED_DUPLICATE);
        assertThat(outcome.logId()).isEqualTo(legacy.getId());
        verify(dispatchHelper, never()).dispatchSms(anyString(), anyString());
        assertThat(lateLogCount()).isEqualTo(1);
        assertLegacyRowUnchanged(legacy);
    }

    @Test
    @DisplayName("기존 행 + 변경 이력 없음 + 상태만 변경(확정) → 재발송 없음")
    void legacyRow_statusOnlyEdit_noResend() {
        saveLegacyLateLog();

        editSchedule(s -> s.setStatus(ScheduleStatus.CONFIRMED));

        DispatchOutcome outcome = dispatchLateAtSlotDay();

        assertThat(outcome.status()).isEqualTo(DispatchOutcome.Status.SKIPPED_DUPLICATE);
        verify(dispatchHelper, never()).dispatchSms(anyString(), anyString());
    }

    // ------------------------------------------------------------ 옮겼다가 되돌리기 → 재발송 없음

    @Test
    @DisplayName("기존 행 후 다른 시각으로 옮겼다가 원래 시각으로 되돌림(디바운스 이력 1행) → 재발송 없음")
    void legacyRow_movedAwayAndBack_coalescedHistory_noResend() {
        NotificationBatchSendLog legacy = saveLegacyLateLog();

        moveSchedule(OTHER_START, OTHER_END, true);
        moveSchedule(SLOT_START, SLOT_END, false);

        DispatchOutcome outcome = dispatchLateAtSlotDay();

        assertThat(outcome.status()).isEqualTo(DispatchOutcome.Status.SKIPPED_DUPLICATE);
        assertThat(outcome.logId()).isEqualTo(legacy.getId());
        verify(dispatchHelper, never()).dispatchSms(anyString(), anyString());
        assertLegacyRowUnchanged(legacy);
    }

    @Test
    @DisplayName("기존 행 후 옮겼다가 되돌림(변경 이력 2행) → 발송 당시 슬롯 = 현재 슬롯, 재발송 없음")
    void legacyRow_movedAwayAndBack_twoHistoryRows_noResend() {
        saveLegacyLateLog();

        moveSchedule(OTHER_START, OTHER_END, true);
        moveSchedule(SLOT_START, SLOT_END, true);

        DispatchOutcome outcome = dispatchLateAtSlotDay();

        assertThat(outcome.status()).isEqualTo(DispatchOutcome.Status.SKIPPED_DUPLICATE);
        verify(dispatchHelper, never()).dispatchSms(anyString(), anyString());
    }

    // ------------------------------------------------------------ 실제 일시 변경 → 1회 재발송

    @Test
    @DisplayName("기존 행 후 실제 시각 변경(변경 이력 있음) → 새 슬롯 1회 재발송, 반복 실행에도 1회")
    void legacyRow_realTimeChange_resendsOnce() {
        NotificationBatchSendLog legacy = saveLegacyLateLog();

        moveSchedule(OTHER_START, OTHER_END, true);

        DispatchOutcome first = dispatchLateAtSlotDay();
        DispatchOutcome again = dispatchLateAtSlotDay();

        assertThat(first.status()).isEqualTo(DispatchOutcome.Status.SMS_ONLY_SENT);
        assertThat(again.status()).isEqualTo(DispatchOutcome.Status.SKIPPED_DUPLICATE);
        verify(dispatchHelper, times(1)).dispatchSms(eq(PHONE), anyString());
        assertThat(successCountForSlot(OTHER_START)).isEqualTo(1);
        assertLegacyRowUnchanged(legacy);
    }

    @Test
    @DisplayName("기존 행 후 실제 시각 변경(변경 이력 미기록) → slot_changed_at 근거로 1회 재발송")
    void legacyRow_realTimeChange_withoutHistory_resendsOnce() {
        saveLegacyLateLog();

        moveSchedule(OTHER_START, OTHER_END, false);

        assertThat(loadSchedule().getSlotChangedAt()).isAfter(legacySentAt);
        DispatchOutcome first = dispatchLateAtSlotDay();
        DispatchOutcome again = dispatchLateAtSlotDay();

        assertThat(first.status()).isEqualTo(DispatchOutcome.Status.SMS_ONLY_SENT);
        assertThat(again.status()).isEqualTo(DispatchOutcome.Status.SKIPPED_DUPLICATE);
        verify(dispatchHelper, times(1)).dispatchSms(eq(PHONE), anyString());
        assertThat(successCountForSlot(OTHER_START)).isEqualTo(1);
    }

    // ------------------------------------------------------------ slot_changed_at 추적

    @Test
    @DisplayName("slot_changed_at — 추적 전 null, 메모 수정 시 직전 수정 시각, 시각 변경 시 갱신, 이후 메모 수정은 유지")
    void slotChangedAt_tracksOnlyDateTimeChanges() {
        assertThat(loadSchedule().getSlotChangedAt()).isNull();

        editSchedule(s -> s.setDescription("메모1"));
        assertThat(loadSchedule().getSlotChangedAt()).isEqualTo(scheduleLastUpdatedAt);

        LocalDateTime beforeMove = LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS);
        editSchedule(s -> s.setStartTime(OTHER_START));
        LocalDateTime movedAt = loadSchedule().getSlotChangedAt();
        assertThat(movedAt).isAfterOrEqualTo(beforeMove);

        editSchedule(s -> s.setDescription("메모2"));
        assertThat(loadSchedule().getSlotChangedAt()).isEqualTo(movedAt);

        editSchedule(s -> s.setEndTime(OTHER_END));
        assertThat(loadSchedule().getSlotChangedAt()).isEqualTo(movedAt);
    }

    // ------------------------------------------------------------------ helpers

    private Long persistBackdatedSchedule() {
        Schedule schedule = new Schedule();
        schedule.setTenantId(tenantId);
        schedule.setConsultantId(CONSULTANT_ID);
        schedule.setClientId(CLIENT_ID);
        schedule.setDate(slotDate);
        schedule.setStartTime(SLOT_START);
        schedule.setEndTime(SLOT_END);
        schedule.setStatus(ScheduleStatus.BOOKED);
        schedule.setIsDeleted(false);
        Long id = inTenant(() -> transactionTemplate.execute(tx -> scheduleRepository.save(schedule).getId()));
        jdbcTemplate.update(BACKDATE_SCHEDULE_SQL, scheduleLastUpdatedAt, scheduleLastUpdatedAt, id);
        return id;
    }

    private void editSchedule(Consumer<Schedule> edit) {
        inTenant(() -> transactionTemplate.execute(tx -> {
            Schedule schedule = scheduleRepository.findByTenantIdAndId(tenantId, scheduleId).orElseThrow();
            edit.accept(schedule);
            return scheduleRepository.save(schedule);
        }));
    }

    /** 드래그·수정 모달과 같이 JPA 로 일시 변경. {@code recordHistory} 면 디바운스 변경 이력(변경 전 일시) 1행 추가. */
    private void moveSchedule(LocalTime newStart, LocalTime newEnd, boolean recordHistory) {
        Schedule before = loadSchedule();
        if (recordHistory) {
            saveChangeHistory(before.getDate(), before.getStartTime());
        }
        editSchedule(s -> {
            s.setStartTime(newStart);
            s.setEndTime(newEnd);
        });
    }

    private void saveChangeHistory(LocalDate previousDate, LocalTime previousStart) {
        LocalDateTime createdAt = LocalDateTime.now();
        ScheduleChangeNotificationPending change = ScheduleChangeNotificationPending.builder()
            .tenantId(tenantId)
            .scheduleId(scheduleId)
            .fireAt(createdAt)
            .previousDate(previousDate)
            .previousStartTime(previousStart)
            .slotVersion(previousDate + "|" + previousStart)
            .status(ScheduleChangeNotificationPendingStatus.SENT)
            .build();
        ScheduleChangeNotificationPending saved = scheduleChangeHistoryRepository.save(change);
        jdbcTemplate.update(UPDATE_CHANGE_CREATED_AT_SQL, createdAt, saved.getId());
    }

    private Schedule loadSchedule() {
        return inTenant(() -> scheduleRepository.findByTenantIdAndId(tenantId, scheduleId).orElseThrow());
    }

    private <T> T inTenant(java.util.function.Supplier<T> action) {
        TenantContextHolder.setTenantId(tenantId);
        try {
            return action.get();
        } finally {
            TenantContextHolder.clear();
        }
    }

    private DispatchOutcome dispatchLateAtSlotDay() {
        Clock clock = Clock.fixed(slotDate.atTime(BATCH_RUN_TIME)
            .atZone(ReservationSmsBusinessHours.ZONE_SEOUL).toInstant(), ReservationSmsBusinessHours.ZONE_SEOUL);
        return inTenant(() -> new BatchNotificationDispatchServiceImpl(
            scheduleRepository, mappingRepository, userRepository,
            mock(UserPrivacyConsentRepository.class), sendLogRepository, sendLogger,
            dispatchHelper, mock(AlimtalkTemplateMappingResolver.class), encryptionUtil,
            properties, smsTemplateService, clock, scheduleChangeHistoryRepository)
            .dispatchReservationImmediateLate(scheduleId));
    }

    private NotificationBatchSendLog saveLegacyLateLog() {
        NotificationBatchSendLog log = NotificationBatchSendLog.builder()
            .templateCode(BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_LATE)
            .targetType(BatchNotificationTemplateCodes.TARGET_TYPE_SCHEDULE)
            .targetId(scheduleId)
            .recipientUserId(CLIENT_ID)
            .targetSlotKey(BatchNotificationTemplateCodes.TARGET_SLOT_KEY_NONE)
            .recipientPhoneMasked(PhoneLogMasking.maskForLog(PHONE))
            .channelUsed(BatchNotificationTemplateCodes.CHANNEL_SMS)
            .success(true)
            .fallbackToSms(true)
            .sentAt(legacySentAt)
            .build();
        log.setTenantId(tenantId);
        log.setIsDeleted(Boolean.FALSE);
        return sendLogRepository.save(log);
    }

    private void assertLegacyRowUnchanged(NotificationBatchSendLog legacy) {
        NotificationBatchSendLog after = sendLogRepository.findById(legacy.getId()).orElseThrow();
        assertThat(after.getTargetSlotKey()).isEqualTo(BatchNotificationTemplateCodes.TARGET_SLOT_KEY_NONE);
        assertThat(after.getSentAt()).isEqualTo(legacy.getSentAt());
        assertThat(after.getSuccess()).isEqualTo(legacy.getSuccess());
    }

    private long successCountForSlot(LocalTime start) {
        String slotKey = BatchNotificationTemplateCodes.buildReminderSlotKey(slotDate, start);
        return findLateLogs().stream()
            .filter(l -> l.getTargetSlotKey().equals(slotKey)
                || l.getTargetSlotKey().startsWith(slotKey + BatchNotificationTemplateCodes.TARGET_SLOT_KEY_RETRY_SEPARATOR))
            .filter(l -> Boolean.TRUE.equals(l.getSuccess()))
            .count();
    }

    private List<NotificationBatchSendLog> findLateLogs() {
        return sendLogRepository.findAll().stream()
            .filter(l -> tenantId.equals(l.getTenantId()))
            .filter(l -> BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_LATE.equals(l.getTemplateCode()))
            .toList();
    }

    private long lateLogCount() {
        return findLateLogs().size();
    }

    private void givenUsers() {
        User client = new User();
        client.setId(CLIENT_ID);
        client.setPhone(PHONE);
        User consultant = new User();
        consultant.setId(CONSULTANT_ID);
        when(userRepository.findByTenantIdAndIdIgnoringDeleted(eq(tenantId), anyLong()))
            .thenAnswer(inv -> CLIENT_ID.equals(inv.getArgument(1))
                ? Optional.of(client) : Optional.of(consultant));
    }

    private void givenActiveMapping() {
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
        mapping.setTenantId(tenantId);
        when(mappingRepository.findActiveExhaustedOrPendingPaymentListByTenantIdAndConsultantIdAndClientId(
                eq(tenantId), anyLong(), anyLong()))
            .thenReturn(List.of(mapping));
    }
}
