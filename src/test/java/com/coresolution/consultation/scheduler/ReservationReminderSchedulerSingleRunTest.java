package com.coresolution.consultation.scheduler;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.lang.reflect.Method;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import javax.sql.DataSource;
import com.coresolution.consultation.config.BatchNotificationProperties;
import com.coresolution.consultation.constant.BookingReminderPushConstants;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.constant.NotificationSchedulerFlagKeys;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ImmediateReservationSmsPendingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.BatchNotificationDispatchService;
import com.coresolution.consultation.service.BatchNotificationDispatchService.DispatchOutcome;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.ScheduleNotificationEligibility;
import com.coresolution.consultation.service.SmsTemplateService;
import com.coresolution.consultation.service.SystemConfigService;
import com.coresolution.core.service.SchedulerAlertService;
import com.coresolution.core.service.SchedulerExecutionLogService;
import com.coresolution.core.service.TenantService;
import net.javacrumbs.shedlock.core.LockProvider;
import net.javacrumbs.shedlock.provider.jdbctemplate.JdbcTemplateLockProvider;
import net.javacrumbs.shedlock.spring.annotation.EnableSchedulerLock;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.h2.jdbcx.JdbcDataSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * 2026-11-11 운영 RCA — blue·green 두 인스턴스가 09:00 리마인드 배치를 모두 실행하고(D-1 3건·2건 분할),
 * 실행 요약 저장이 같은 {@code execution_id} UNIQUE 충돌로 rollback-only 실패하던 문제의 회귀 테스트.
 *
 * @author MindGarden
 * @since 2026-11-11
 */
@DisplayName("예약 리마인드 스케줄러 — 단일 실행(ShedLock) + 종류별 요약 execution_id")
class ReservationReminderSchedulerSingleRunTest {

    private static final String TENANT = "tenant-single-run";
    private static final Long SCHEDULE_ID = 703L;
    private static final Long CONSULTANT_ID = 3L;
    private static final Long CLIENT_ID = 108L;
    private static final int SUMMARY_EXECUTION_ID_MAX_LENGTH = 50;

    private TenantService tenantService;
    private ScheduleRepository scheduleRepository;
    private ConsultantClientMappingRepository mappingRepository;
    private ImmediateReservationSmsPendingRepository pendingRepository;
    private BatchNotificationDispatchService dispatchService;
    private SchedulerExecutionLogService logService;
    private SystemConfigService systemConfigService;
    private SmsTemplateService smsTemplateService;
    private SchedulerAlertService alertServiceHolder;
    private BatchNotificationProperties properties;

    @BeforeEach
    void setUp() {
        tenantService = mock(TenantService.class);
        scheduleRepository = mock(ScheduleRepository.class);
        mappingRepository = mock(ConsultantClientMappingRepository.class);
        pendingRepository = mock(ImmediateReservationSmsPendingRepository.class);
        dispatchService = mock(BatchNotificationDispatchService.class);
        logService = mock(SchedulerExecutionLogService.class);
        systemConfigService = mock(SystemConfigService.class);
        smsTemplateService = mock(SmsTemplateService.class);
        alertServiceHolder = mock(SchedulerAlertService.class);
        properties = new BatchNotificationProperties();
        properties.setReservationReminderDaysAhead(2);

        when(systemConfigService.getGlobalBoolean(
                eq(NotificationSchedulerFlagKeys.RESERVATION_REMINDER_ENABLED), anyBoolean()))
            .thenReturn(true);
        when(smsTemplateService.isAutoDispatchEnabledFor(anyString(), anyString())).thenReturn(true);
        when(tenantService.getAllActiveTenantIds()).thenReturn(List.of(TENANT));
        when(scheduleRepository.findByTenantIdAndDateAndStatusIn(any(), any(), anyList()))
            .thenReturn(Collections.emptyList());
        LocalDate d1 = LocalDate.now().plusDays(BookingReminderPushConstants.REMINDER_D1_DAYS_AHEAD);
        when(scheduleRepository.findByTenantIdAndDateAndStatusIn(eq(TENANT), eq(d1), anyList()))
            .thenReturn(List.of(buildSchedule(d1)));
        when(mappingRepository.findActiveExhaustedOrPendingPaymentListByTenantIdAndConsultantIdAndClientId(
                TENANT, CONSULTANT_ID, CLIENT_ID))
            .thenReturn(List.of(buildMapping()));
        when(dispatchService.dispatchReservationImmediateLate(anyLong()))
            .thenReturn(new DispatchOutcome(DispatchOutcome.Status.SMS_ONLY_SENT, "SMS", true, null, null, 1L));
    }

    @Test
    @DisplayName("runDailyReminder 에 ShedLock 락이 선언돼 있다 (이름·최소 보유)")
    void runDailyReminder_declaresSchedulerLock() throws Exception {
        Method method = ReservationReminderScheduler.class.getMethod("runDailyReminder");
        SchedulerLock lock = method.getAnnotation(SchedulerLock.class);

        assertThat(lock).isNotNull();
        assertThat(lock.name()).isEqualTo(ReservationReminderScheduler.SCHEDULER_LOCK_NAME);
        assertThat(lock.lockAtLeastFor()).isEqualTo(ReservationReminderScheduler.SCHEDULER_LOCK_AT_LEAST_FOR);
        assertThat(lock.lockAtMostFor()).isEqualTo(ReservationReminderScheduler.SCHEDULER_LOCK_AT_MOST_FOR);
    }

    @Test
    @DisplayName("두 인스턴스(blue·green)가 같은 락 테이블로 동시에 깨어나도 배치는 1회 — D-1 발송 1번")
    void twoInstances_sameLockStore_runOnce() throws Exception {
        try (AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext()) {
            context.register(LockConfig.class);
            context.registerBean("reservationReminderBlue", ReservationReminderScheduler.class, this::newScheduler);
            context.registerBean("reservationReminderGreen", ReservationReminderScheduler.class, this::newScheduler);
            context.refresh();
            ReservationReminderScheduler blue = context.getBean("reservationReminderBlue", ReservationReminderScheduler.class);
            ReservationReminderScheduler green = context.getBean("reservationReminderGreen", ReservationReminderScheduler.class);

            Thread blueThread = new Thread(blue::runDailyReminder);
            Thread greenThread = new Thread(green::runDailyReminder);
            blueThread.start();
            greenThread.start();
            blueThread.join();
            greenThread.join();
        }

        verify(dispatchService, times(1)).dispatchReservationImmediateLate(SCHEDULE_ID);
        verify(tenantService, times(1)).getAllActiveTenantIds();
    }

    @Test
    @DisplayName("실행 요약은 D-2/D-1/D-0 마다 다른 execution_id(같은 접두) — UNIQUE 충돌·rollback-only 없음")
    void summaries_useDistinctExecutionIdsPerKind() {
        newScheduler().runDailyReminder();

        ArgumentCaptor<String> ids = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> names = ArgumentCaptor.forClass(String.class);
        verify(logService, times(ReservationReminderScheduler.ReminderSmsKind.values().length))
            .saveSummaryLog(ids.capture(), names.capture(), anyInt(), anyInt(), anyInt(), anyLong(), any(), any());
        Set<String> distinct = new HashSet<>(ids.getAllValues());
        assertThat(distinct).hasSize(ReservationReminderScheduler.ReminderSmsKind.values().length);
        assertThat(names.getAllValues())
            .containsExactly("ReservationReminderD2", "ReservationReminderD1", "ReservationReminderD0");
        String prefix = ids.getAllValues().get(0).substring(0, ids.getAllValues().get(0).lastIndexOf('-'));
        assertThat(ids.getAllValues()).allSatisfy(id -> {
            assertThat(id).startsWith(prefix);
            assertThat(id.length()).isLessThanOrEqualTo(SUMMARY_EXECUTION_ID_MAX_LENGTH);
        });
        verify(alertServiceHolder, never()).sendFailureAlert(any(), any(), anyInt(), any());
        verify(alertServiceHolder, never()).sendCompleteFailureAlert(any(), any(), anyInt(), any());
    }

    private ReservationReminderScheduler newScheduler() {
        return new ReservationReminderScheduler(tenantService, scheduleRepository, mappingRepository,
            pendingRepository, dispatchService, mock(MobilePushDispatchService.class), properties,
            logService, alertServiceHolder, systemConfigService, smsTemplateService,
            mock(ScheduleNotificationEligibility.class));
    }

    private Schedule buildSchedule(LocalDate date) {
        Schedule schedule = new Schedule();
        schedule.setId(SCHEDULE_ID);
        schedule.setTenantId(TENANT);
        schedule.setConsultantId(CONSULTANT_ID);
        schedule.setClientId(CLIENT_ID);
        schedule.setDate(date);
        schedule.setStartTime(LocalTime.of(19, 0));
        schedule.setEndTime(LocalTime.of(20, 0));
        schedule.setStatus(ScheduleStatus.CONFIRMED);
        schedule.setIsDeleted(false);
        return schedule;
    }

    private ConsultantClientMapping buildMapping() {
        User consultant = new User();
        consultant.setId(CONSULTANT_ID);
        User client = new User();
        client.setId(CLIENT_ID);
        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
            .consultant(consultant).client(client)
            .totalSessions(10).remainingSessions(5).usedSessions(5)
            .status(MappingStatus.ACTIVE).build();
        mapping.setId(1L);
        mapping.setTenantId(TENANT);
        return mapping;
    }

    /** 두 인스턴스가 공유하는 운영 DB 의 {@code shedlock} 테이블을 H2 로 재현. */
    @Configuration
    @EnableSchedulerLock(defaultLockAtMostFor = "PT30M")
    static class LockConfig {

        @Bean
        DataSource lockDataSource() {
            JdbcDataSource dataSource = new JdbcDataSource();
            dataSource.setURL("jdbc:h2:mem:shedlock-reminder-" + System.nanoTime() + ";DB_CLOSE_DELAY=-1");
            new JdbcTemplate(dataSource).execute("CREATE TABLE shedlock (name VARCHAR(64) NOT NULL PRIMARY KEY, "
                + "lock_until TIMESTAMP(3) NOT NULL, locked_at TIMESTAMP(3) NOT NULL, locked_by VARCHAR(255) NOT NULL)");
            return dataSource;
        }

        @Bean
        LockProvider lockProvider(DataSource lockDataSource) {
            return new JdbcTemplateLockProvider(new JdbcTemplate(lockDataSource));
        }
    }
}
