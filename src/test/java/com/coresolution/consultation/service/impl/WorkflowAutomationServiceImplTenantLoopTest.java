package com.coresolution.consultation.service.impl;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.NotificationSchedulerFlagKeys;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.StatisticsService;
import com.coresolution.consultation.service.SystemConfigService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.service.TenantService;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

/**
 * {@link WorkflowAutomationServiceImpl} — 스케줄러 스레드에서 활성 테넌트별 루프·컨텍스트 설정 검증.
 *
 * @author MindGarden
 * @since 2026-06-26
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("WorkflowAutomationServiceImpl — 활성 테넌트 루프")
class WorkflowAutomationServiceImplTenantLoopTest {

    private static final String TENANT_A = "tenant-a";
    private static final String TENANT_B = "tenant-b";

    @Mock private ScheduleRepository scheduleRepository;
    @Mock private UserRepository userRepository;
    @Mock private ConsultationMessageService consultationMessageService;
    @Mock private StatisticsService statisticsService;
    @Mock private CommonCodeService commonCodeService;
    @Mock private MobilePushDispatchService mobilePushDispatchService;
    @Mock private SystemConfigService systemConfigService;
    @Mock private TenantService tenantService;

    private WorkflowAutomationServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new WorkflowAutomationServiceImpl(
                scheduleRepository, userRepository, consultationMessageService,
                statisticsService, commonCodeService, mobilePushDispatchService,
                systemConfigService, tenantService);
        when(systemConfigService.getGlobalBoolean(
                eq(NotificationSchedulerFlagKeys.WORKFLOW_AUTOMATION_ENABLED), anyBoolean()))
            .thenReturn(true);
        when(commonCodeService.getCodeValue(anyString(), anyString())).thenReturn(null);
        when(scheduleRepository.findByTenantIdAndDateAndStatusIn(anyString(), any(LocalDate.class), anyList()))
            .thenReturn(Collections.emptyList());
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("sendScheduleReminders — 활성 테넌트 수만큼 findByTenantIdAndDateAndStatusIn 호출")
    void sendScheduleReminders_queriesPerActiveTenant() {
        when(tenantService.getAllActiveTenantIds()).thenReturn(List.of(TENANT_A, TENANT_B));

        service.sendScheduleReminders();

        verify(scheduleRepository, times(1))
            .findByTenantIdAndDateAndStatusIn(eq(TENANT_A), any(LocalDate.class), anyList());
        verify(scheduleRepository, times(1))
            .findByTenantIdAndDateAndStatusIn(eq(TENANT_B), any(LocalDate.class), anyList());
    }

    @Test
    @DisplayName("sendIncompleteConsultationAlerts — 활성 테넌트 수만큼 findByTenantIdAndDateAndStatusIn 호출")
    void sendIncompleteConsultationAlerts_queriesPerActiveTenant() {
        when(tenantService.getAllActiveTenantIds()).thenReturn(List.of(TENANT_A, TENANT_B));

        service.sendIncompleteConsultationAlerts();

        verify(scheduleRepository, times(1))
            .findByTenantIdAndDateAndStatusIn(eq(TENANT_A), any(LocalDate.class), anyList());
        verify(scheduleRepository, times(1))
            .findByTenantIdAndDateAndStatusIn(eq(TENANT_B), any(LocalDate.class), anyList());
    }

    @Test
    @DisplayName("sendDailyPerformanceSummary — 활성 테넌트 수만큼 상담사 조회")
    void sendDailyPerformanceSummary_queriesConsultantsPerActiveTenant() {
        when(tenantService.getAllActiveTenantIds()).thenReturn(List.of(TENANT_A, TENANT_B));
        when(userRepository.findByRoleAndIsDeletedFalse(anyString(), anyString()))
            .thenReturn(Collections.emptyList());

        service.sendDailyPerformanceSummary();

        verify(userRepository, times(1))
            .findByRoleAndIsDeletedFalse(eq(TENANT_A), eq(UserRole.CONSULTANT.name()));
        verify(userRepository, times(1))
            .findByRoleAndIsDeletedFalse(eq(TENANT_B), eq(UserRole.CONSULTANT.name()));
    }

    @Test
    @DisplayName("generateMonthlyPerformanceReport — 활성 테넌트 수만큼 월간 통계·관리자 조회")
    void generateMonthlyPerformanceReport_queriesPerActiveTenant() {
        when(tenantService.getAllActiveTenantIds()).thenReturn(List.of(TENANT_A, TENANT_B));
        when(statisticsService.getMonthlyStatistics(any(LocalDate.class), any(LocalDate.class), eq(null)))
            .thenReturn(Map.of("totalConsultations", 0, "totalRevenue", "0", "avgRating", 0));
        when(userRepository.findByRoleInAndIsDeletedFalse(anyString(), anyList()))
            .thenReturn(Collections.emptyList());

        service.generateMonthlyPerformanceReport();

        verify(statisticsService, times(2))
            .getMonthlyStatistics(any(LocalDate.class), any(LocalDate.class), eq(null));
        verify(userRepository, times(1))
            .findByRoleInAndIsDeletedFalse(eq(TENANT_A), anyList());
        verify(userRepository, times(1))
            .findByRoleInAndIsDeletedFalse(eq(TENANT_B), anyList());
    }
}
