package com.coresolution.consultation.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.service.TenantService;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ConfigurableApplicationContext;

/**
 * 오늘 만료 PL/SQL 성공 직후 {@code deductSessionAtCompletionIfNeeded} 호출 검증.
 *
 * @author CoreSolution
 * @since 2026-09-23
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleAutoCompleteService 오늘 만료 deduct 훅")
class ScheduleAutoCompleteServiceTodayExpiryDeductTest {

    private static final Long SCHEDULE_ID = 461L;
    private static final Long CONSULTANT_ID = 10L;
    private static final Long CLIENT_ID = 27L;
    private static final Long MAPPING_ID = 276L;

    @Mock
    private ScheduleService scheduleService;
    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private ConsultationRecordRepository consultationRecordRepository;
    @Mock
    private RealTimeStatisticsService realTimeStatisticsService;
    @Mock
    private PlSqlScheduleValidationService plSqlScheduleValidationService;
    @Mock
    private SalaryLateSessionAutoSyncService salaryLateSessionAutoSyncService;
    @Mock
    private TenantService tenantService;
    @Mock
    private ConfigurableApplicationContext applicationContext;

    @InjectMocks
    private ScheduleAutoCompleteService autoCompleteService;

    private String tenantId;

    @BeforeEach
    void setUp() {
        tenantId = "tenant-today-deduct-" + UUID.randomUUID();
        TenantContextHolder.setTenantId(tenantId);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("오늘 만료 PL/SQL completed=true → fresh 로드 후 deductSessionAtCompletionIfNeeded 호출")
    void todayExpiry_plsqlCompleted_callsDeduct() {
        when(applicationContext.isActive()).thenReturn(true);
        when(tenantService.getAllActiveTenantIds()).thenReturn(List.of(tenantId));

        Schedule expired = bookedTodayExpired();
        when(scheduleRepository.findExpiredConfirmedSchedules(eq(tenantId), any(LocalDate.class), any(LocalTime.class)))
                .thenReturn(List.of(expired));
        when(scheduleRepository.findByDateBeforeAndStatus(eq(tenantId), any(LocalDate.class), any()))
                .thenReturn(List.of());

        Map<String, Object> plsqlResult = new HashMap<>();
        plsqlResult.put("completed", true);
        plsqlResult.put("message", "ok");
        when(plSqlScheduleValidationService.processScheduleAutoCompletion(
                eq(SCHEDULE_ID), eq(CONSULTANT_ID), any(LocalDate.class), eq(false)))
                .thenReturn(plsqlResult);

        Schedule fresh = bookedTodayExpired();
        fresh.setStatus(ScheduleStatus.COMPLETED);
        when(scheduleRepository.findByTenantIdAndId(tenantId, SCHEDULE_ID))
                .thenReturn(Optional.of(fresh));

        autoCompleteService.autoCompleteExpiredSchedules();

        verify(scheduleService).deductSessionAtCompletionIfNeeded(fresh);
        verify(realTimeStatisticsService).updateStatisticsOnScheduleCompletion(fresh);
    }

    @Test
    @DisplayName("오늘 만료 PL/SQL completed=false → deduct 미호출")
    void todayExpiry_plsqlNotCompleted_skipsDeduct() {
        when(applicationContext.isActive()).thenReturn(true);
        when(tenantService.getAllActiveTenantIds()).thenReturn(List.of(tenantId));

        Schedule expired = bookedTodayExpired();
        when(scheduleRepository.findExpiredConfirmedSchedules(eq(tenantId), any(LocalDate.class), any(LocalTime.class)))
                .thenReturn(List.of(expired));
        when(scheduleRepository.findByDateBeforeAndStatus(eq(tenantId), any(LocalDate.class), any()))
                .thenReturn(List.of());

        Map<String, Object> plsqlResult = new HashMap<>();
        plsqlResult.put("completed", false);
        plsqlResult.put("message", "no record");
        when(plSqlScheduleValidationService.processScheduleAutoCompletion(
                eq(SCHEDULE_ID), eq(CONSULTANT_ID), any(LocalDate.class), eq(false)))
                .thenReturn(plsqlResult);

        Map<String, Object> reminder = new HashMap<>();
        reminder.put("success", false);
        when(plSqlScheduleValidationService.createConsultationRecordReminder(
                anyLong(), anyLong(), anyLong(), any(LocalDate.class), any()))
                .thenReturn(reminder);

        autoCompleteService.autoCompleteExpiredSchedules();

        verify(scheduleService, never()).deductSessionAtCompletionIfNeeded(any());
    }

    private Schedule bookedTodayExpired() {
        Schedule s = new Schedule();
        s.setId(SCHEDULE_ID);
        s.setTenantId(tenantId);
        s.setConsultantId(CONSULTANT_ID);
        s.setClientId(CLIENT_ID);
        s.setMappingId(MAPPING_ID);
        s.setStatus(ScheduleStatus.BOOKED);
        s.setScheduleType("CONSULTATION");
        s.setDate(LocalDate.now());
        s.setStartTime(LocalTime.of(9, 0));
        s.setEndTime(LocalTime.of(10, 0));
        s.setTitle("상담");
        return s;
    }
}
