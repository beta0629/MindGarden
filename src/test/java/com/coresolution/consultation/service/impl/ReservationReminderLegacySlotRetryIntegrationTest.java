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
 * #1322 후속 — 슬롯 미기록(기존) 발송 이력 판정·실패 행 재시도 한도 통합 검증 (실 send_log·일정 변경 이력, H2).
 *
 * <p>SMS 발송기({@link NotificationDispatchHelper})는 mock 이므로 실제 문자는 발송되지 않는다.
 * 기존 발송 이력 행은 테스트 픽스처로만 넣고, 코드가 수정·삭제하지 않는지 함께 확인한다.
 *
 * @author MindGarden
 * @since 2026-09-30
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@ActiveProfiles("test")
@DisplayName("예약 리마인드 — 슬롯 미기록 이력 판정 + 실패 재시도 한도 (실 send_log)")
class ReservationReminderLegacySlotRetryIntegrationTest {

    private static final long SIMULATION_OFFSET_DAYS = 90L;
    private static final LocalTime BATCH_RUN_TIME = LocalTime.of(9, 0);
    private static final LocalTime SLOT_START = LocalTime.of(14, 30);
    private static final LocalTime SLOT_END = LocalTime.of(15, 30);
    private static final LocalTime CHANGE_TIME = LocalTime.of(12, 0);
    private static final Long SCHEDULE_ID = 94001L;
    private static final Long CLIENT_ID = 95001L;
    private static final Long CONSULTANT_ID = 96001L;
    private static final String PHONE = "01012345678";
    private static final String UPDATE_CHANGE_CREATED_AT_SQL =
        "UPDATE schedule_change_notification_pending SET created_at = ? WHERE id = ?";

    @Autowired
    private NotificationBatchSendLogRepository sendLogRepository;
    @Autowired
    private NotificationBatchSendLogger sendLogger;
    @Autowired
    private ScheduleChangeNotificationPendingRepository scheduleChangeHistoryRepository;
    @Autowired
    private JdbcTemplate jdbcTemplate;

    private ScheduleRepository scheduleRepository;
    private UserRepository userRepository;
    private ConsultantClientMappingRepository mappingRepository;
    private NotificationDispatchHelper dispatchHelper;
    private SmsTemplateService smsTemplateService;
    private PersonalDataEncryptionUtil encryptionUtil;
    private BatchNotificationProperties properties;

    private String tenantId;
    private Schedule schedule;
    private LocalDate slotDate;

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
        givenSmsResult(true);

        tenantId = UUID.randomUUID().toString();
        slotDate = LocalDate.now(ReservationSmsBusinessHours.ZONE_SEOUL).plusDays(SIMULATION_OFFSET_DAYS);
        schedule = buildSchedule(slotDate);
        when(scheduleRepository.findByTenantIdAndId(tenantId, SCHEDULE_ID))
            .thenAnswer(inv -> Optional.of(schedule));
        givenUsers();
        givenActiveMapping();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    // ------------------------------------------------------------ 1. 슬롯 미기록 행

    @Test
    @DisplayName("기존 행(D-1 발송) 후 +1일 이동 → 새 슬롯 1회 발송, 재실행 시 추가 발송 없음, 기존 행 무수정")
    void legacyRow_movedPlusOneDay_resendsOnceForNewSlot() {
        NotificationBatchSendLog legacy = saveLegacyLateLog(slotDate.minusDays(1).atTime(BATCH_RUN_TIME), true);
        LocalDate newDate = slotDate.plusDays(1);
        moveSchedule(slotDate.minusDays(1).atTime(CHANGE_TIME), newDate, SLOT_START);

        DispatchOutcome first = dispatchLateAt(slotDate.atTime(BATCH_RUN_TIME));
        DispatchOutcome again = dispatchLateAt(newDate.atTime(BATCH_RUN_TIME));

        assertThat(first.status()).isEqualTo(DispatchOutcome.Status.SMS_ONLY_SENT);
        assertThat(again.status()).isEqualTo(DispatchOutcome.Status.SKIPPED_DUPLICATE);
        verify(dispatchHelper, times(1)).dispatchSms(eq(PHONE), anyString());
        assertThat(successCountForSlot(newDate, SLOT_START)).isEqualTo(1);
        assertLegacyRowUnchanged(legacy);
    }

    @Test
    @DisplayName("기존 행(등록 즉시 발송) 후 -1일 이동 → 새 슬롯 D-0 에 1회 발송")
    void legacyRow_movedMinusOneDay_resendsOnceForNewSlot() {
        NotificationBatchSendLog legacy = saveLegacyLateLog(slotDate.minusDays(2).atTime(LocalTime.of(15, 0)), true);
        LocalDate newDate = slotDate.minusDays(1);
        moveSchedule(slotDate.minusDays(2).atTime(LocalTime.of(16, 0)), newDate, SLOT_START);

        DispatchOutcome outcome = dispatchLateAt(newDate.atTime(BATCH_RUN_TIME));

        assertThat(outcome.status()).isEqualTo(DispatchOutcome.Status.SMS_ONLY_SENT);
        verify(dispatchHelper, times(1)).dispatchSms(eq(PHONE), anyString());
        assertThat(successCountForSlot(newDate, SLOT_START)).isEqualTo(1);
        assertLegacyRowUnchanged(legacy);
    }

    @Test
    @DisplayName("기존 행 후 같은 날 시간만 변경 → 새 시각 슬롯 1회 발송 (반복 실행에도 1회)")
    void legacyRow_sameDayTimeChange_resendsOnceForNewTime() {
        NotificationBatchSendLog legacy = saveLegacyLateLog(slotDate.minusDays(1).atTime(BATCH_RUN_TIME), true);
        LocalTime newStart = LocalTime.of(17, 0);
        moveSchedule(slotDate.minusDays(1).atTime(CHANGE_TIME), slotDate, newStart);

        DispatchOutcome first = dispatchLateAt(slotDate.atTime(BATCH_RUN_TIME));
        DispatchOutcome again = dispatchLateAt(slotDate.atTime(BATCH_RUN_TIME));

        assertThat(first.status()).isEqualTo(DispatchOutcome.Status.SMS_ONLY_SENT);
        assertThat(again.status()).isEqualTo(DispatchOutcome.Status.SKIPPED_DUPLICATE);
        verify(dispatchHelper, times(1)).dispatchSms(eq(PHONE), anyString());
        assertThat(successCountForSlot(slotDate, newStart)).isEqualTo(1);
        assertLegacyRowUnchanged(legacy);
    }

    @Test
    @DisplayName("기존 행 + 일정 미변경(발송 전 변경 이력만 존재) → 배포 직후 중복 발송 없음")
    void legacyRow_unchangedSchedule_noDoubleSend() {
        LocalDateTime sentAt = slotDate.minusDays(1).atTime(BATCH_RUN_TIME);
        saveChangeHistory(slotDate.minusDays(5).atTime(CHANGE_TIME), slotDate.minusDays(3), SLOT_START);
        schedule.setUpdatedAt(slotDate.minusDays(5).atTime(CHANGE_TIME));
        NotificationBatchSendLog legacy = saveLegacyLateLog(sentAt, true);

        DispatchOutcome outcome = dispatchLateAt(slotDate.atTime(BATCH_RUN_TIME));

        assertThat(outcome.status()).isEqualTo(DispatchOutcome.Status.SKIPPED_DUPLICATE);
        assertThat(outcome.logId()).isEqualTo(legacy.getId());
        verify(dispatchHelper, never()).dispatchSms(anyString(), anyString());
        assertThat(lateLogCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("기존 행 + 변경 이력 없음 + 발송 이후 일정 수정·시각 변경 → 발송 당시 슬롯 불명이므로 차단하지 않음")
    void legacyRow_noHistory_scheduleUpdatedAfterSend_resends() {
        LocalDateTime sentAt = slotDate.minusDays(1).atTime(BATCH_RUN_TIME);
        saveLegacyLateLog(sentAt, true);
        schedule.setStartTime(LocalTime.of(18, 0));
        schedule.setEndTime(LocalTime.of(19, 0));
        schedule.setUpdatedAt(sentAt.plusHours(3));

        DispatchOutcome outcome = dispatchLateAt(slotDate.atTime(BATCH_RUN_TIME));

        assertThat(outcome.status()).isEqualTo(DispatchOutcome.Status.SMS_ONLY_SENT);
        assertThat(successCountForSlot(slotDate, LocalTime.of(18, 0))).isEqualTo(1);
    }

    @Test
    @DisplayName("기존 실패 행(슬롯 미기록)은 차단하지 않음 → 현재 슬롯 1회 발송")
    void legacyFailedRow_doesNotBlock() {
        saveLegacyLateLog(slotDate.minusDays(1).atTime(BATCH_RUN_TIME), false);

        DispatchOutcome outcome = dispatchLateAt(slotDate.atTime(BATCH_RUN_TIME));

        assertThat(outcome.status()).isEqualTo(DispatchOutcome.Status.SMS_ONLY_SENT);
        assertThat(successCountForSlot(slotDate, SLOT_START)).isEqualTo(1);
    }

    // ------------------------------------------------------------ 3. 실패 행 재시도 한도

    @Test
    @DisplayName("실패 행(템플릿 누락)은 슬롯을 막지 않음 → 다음 배치에서 1회 재시도, 성공 후 추가 발송 없음")
    void failedSlotRow_retriedOnceAtNextBatch() {
        NotificationBatchSendLog failed = sendLogRepository.save(slotLog(
            BatchNotificationTemplateCodes.buildReminderSlotKey(slotDate, SLOT_START),
            slotDate.minusDays(1).atTime(BATCH_RUN_TIME), false,
            BatchNotificationTemplateCodes.ERROR_CODE_TEMPLATE_NOT_MAPPED));

        DispatchOutcome retry = dispatchLateAt(slotDate.atTime(BATCH_RUN_TIME));
        DispatchOutcome again = dispatchLateAt(slotDate.atTime(BATCH_RUN_TIME));

        assertThat(retry.status()).isEqualTo(DispatchOutcome.Status.SMS_ONLY_SENT);
        assertThat(again.status()).isEqualTo(DispatchOutcome.Status.SKIPPED_DUPLICATE);
        verify(dispatchHelper, times(1)).dispatchSms(eq(PHONE), anyString());
        String slotKey = BatchNotificationTemplateCodes.buildReminderSlotKey(slotDate, SLOT_START);
        assertThat(findLateLogs()).extracting(NotificationBatchSendLog::getTargetSlotKey)
            .containsExactlyInAnyOrder(slotKey, BatchNotificationTemplateCodes.buildReminderSlotRetryKey(slotKey, 2));
        NotificationBatchSendLog failedAfter = sendLogRepository.findById(failed.getId()).orElseThrow();
        assertThat(failedAfter.getSuccess()).isFalse();
        assertThat(failedAfter.getErrorCode()).isEqualTo(BatchNotificationTemplateCodes.ERROR_CODE_TEMPLATE_NOT_MAPPED);
    }

    @Test
    @DisplayName("계속 실패 → D-1·D-0 배치에서 최대 시도 횟수만큼만 시도, 이후 무한 재시도 없음")
    void failingSlot_isNotRetriedInfinitely() {
        givenSmsResult(false);

        DispatchOutcome d1 = dispatchLateAt(slotDate.minusDays(1).atTime(BATCH_RUN_TIME));
        DispatchOutcome d0 = dispatchLateAt(slotDate.atTime(BATCH_RUN_TIME));
        DispatchOutcome afterCap = dispatchLateAt(slotDate.atTime(LocalTime.of(11, 0)));

        assertThat(d1.status()).isEqualTo(DispatchOutcome.Status.FAILED);
        assertThat(d0.status()).isEqualTo(DispatchOutcome.Status.FAILED);
        assertThat(afterCap.status()).isEqualTo(DispatchOutcome.Status.SKIPPED_DUPLICATE);
        verify(dispatchHelper, times(properties.getReservationReminderMaxAttemptsPerSlot()))
            .dispatchSms(eq(PHONE), anyString());
        assertThat(lateLogCount()).isEqualTo(properties.getReservationReminderMaxAttemptsPerSlot());
    }

    @Test
    @DisplayName("결과 미반영(PENDING) 행은 발송 여부 불명 → 중복 방지를 위해 차단")
    void pendingSlotRow_blocks() {
        NotificationBatchSendLog pending = slotLog(
            BatchNotificationTemplateCodes.buildReminderSlotKey(slotDate, SLOT_START),
            slotDate.minusDays(1).atTime(BATCH_RUN_TIME), false, null);
        pending.setChannelUsed(BatchNotificationTemplateCodes.CHANNEL_PENDING);
        sendLogRepository.save(pending);

        DispatchOutcome outcome = dispatchLateAt(slotDate.atTime(BATCH_RUN_TIME));

        assertThat(outcome.status()).isEqualTo(DispatchOutcome.Status.SKIPPED_DUPLICATE);
        verify(dispatchHelper, never()).dispatchSms(anyString(), anyString());
    }

    // ------------------------------------------------------------------ helpers

    /**
     * 시뮬레이션 시각에 LATE 1회 디스패치. 디스패치가 남기는 행의 {@code sent_at} 은 실제 현재 시각이므로
     * 미래 시뮬레이션 일자의 당일 1통 가드와 겹치지 않는다(재시도 한도만 검증).
     */
    private DispatchOutcome dispatchLateAt(LocalDateTime at) {
        TenantContextHolder.setTenantId(tenantId);
        try {
            return newDispatchService(clockAt(at)).dispatchReservationImmediateLate(SCHEDULE_ID);
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
            properties, smsTemplateService, clock, scheduleChangeHistoryRepository);
    }

    private void givenSmsResult(boolean success) {
        when(dispatchHelper.dispatchSms(anyString(), anyString()))
            .thenReturn(new NotificationDispatchHelper.DispatchResult(success,
                success ? null : BatchNotificationTemplateCodes.ERROR_CODE_SEND_FAILED,
                success ? null : "mock sms failure", null, null));
    }

    /** 드래그·수정 모달·상담 재예약과 동일하게 일정 일시 변경 + 변경 이력(변경 전 일시) 기록. */
    private void moveSchedule(LocalDateTime changedAt, LocalDate newDate, LocalTime newStart) {
        saveChangeHistory(changedAt, schedule.getDate(), schedule.getStartTime());
        schedule.setDate(newDate);
        schedule.setStartTime(newStart);
        schedule.setEndTime(newStart.plusHours(1));
        schedule.setUpdatedAt(changedAt);
    }

    private void saveChangeHistory(LocalDateTime createdAt, LocalDate previousDate, LocalTime previousStart) {
        ScheduleChangeNotificationPending change = ScheduleChangeNotificationPending.builder()
            .tenantId(tenantId)
            .scheduleId(SCHEDULE_ID)
            .fireAt(createdAt)
            .previousDate(previousDate)
            .previousStartTime(previousStart)
            .slotVersion(previousDate + "|" + previousStart)
            .status(ScheduleChangeNotificationPendingStatus.SENT)
            .build();
        ScheduleChangeNotificationPending saved = scheduleChangeHistoryRepository.save(change);
        jdbcTemplate.update(UPDATE_CHANGE_CREATED_AT_SQL, createdAt, saved.getId());
    }

    private NotificationBatchSendLog saveLegacyLateLog(LocalDateTime sentAt, boolean success) {
        return sendLogRepository.save(slotLog(BatchNotificationTemplateCodes.TARGET_SLOT_KEY_NONE, sentAt, success,
            success ? null : BatchNotificationTemplateCodes.ERROR_CODE_SEND_FAILED));
    }

    private void assertLegacyRowUnchanged(NotificationBatchSendLog legacy) {
        NotificationBatchSendLog after = sendLogRepository.findById(legacy.getId()).orElseThrow();
        assertThat(after.getTargetSlotKey()).isEqualTo(BatchNotificationTemplateCodes.TARGET_SLOT_KEY_NONE);
        assertThat(after.getSentAt()).isEqualTo(legacy.getSentAt());
        assertThat(after.getSuccess()).isEqualTo(legacy.getSuccess());
    }

    private long successCountForSlot(LocalDate date, LocalTime start) {
        String slotKey = BatchNotificationTemplateCodes.buildReminderSlotKey(date, start);
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

    private NotificationBatchSendLog slotLog(String slotKey, LocalDateTime sentAt, boolean success, String errorCode) {
        NotificationBatchSendLog log = NotificationBatchSendLog.builder()
            .templateCode(BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_LATE)
            .targetType(BatchNotificationTemplateCodes.TARGET_TYPE_SCHEDULE)
            .targetId(SCHEDULE_ID)
            .recipientUserId(CLIENT_ID)
            .targetSlotKey(slotKey)
            .recipientPhoneMasked(PhoneLogMasking.maskForLog(PHONE))
            .channelUsed(success ? BatchNotificationTemplateCodes.CHANNEL_SMS
                : BatchNotificationTemplateCodes.CHANNEL_ALIMTALK)
            .success(success)
            .fallbackToSms(success)
            .errorCode(errorCode)
            .sentAt(sentAt)
            .build();
        log.setTenantId(tenantId);
        log.setIsDeleted(Boolean.FALSE);
        return log;
    }

    private Schedule buildSchedule(LocalDate date) {
        Schedule s = new Schedule();
        s.setId(SCHEDULE_ID);
        s.setTenantId(tenantId);
        s.setConsultantId(CONSULTANT_ID);
        s.setClientId(CLIENT_ID);
        s.setDate(date);
        s.setStartTime(SLOT_START);
        s.setEndTime(SLOT_END);
        s.setStatus(ScheduleStatus.BOOKED);
        s.setIsDeleted(false);
        return s;
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
