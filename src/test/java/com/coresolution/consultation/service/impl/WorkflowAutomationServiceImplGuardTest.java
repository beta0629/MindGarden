package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.NotificationSchedulerFlagKeys;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.StatisticsService;
import com.coresolution.consultation.service.SystemConfigService;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * {@link WorkflowAutomationServiceImpl} DB 플래그 가드 단위 테스트.
 *
 * <p>4 개 @Scheduled 진입점이 동일한 DB 플래그로 차단되는지 검증한다.
 *
 * @author MindGarden
 * @since 2026-05-25
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("워크플로우 자동화 — DB 플래그 가드 (4 메서드)")
class WorkflowAutomationServiceImplGuardTest {

    @Mock private ScheduleRepository scheduleRepository;
    @Mock private UserRepository userRepository;
    @Mock private ConsultationMessageService consultationMessageService;
    @Mock private StatisticsService statisticsService;
    @Mock private CommonCodeService commonCodeService;
    @Mock private MobilePushDispatchService mobilePushDispatchService;
    @Mock private SystemConfigService systemConfigService;

    private WorkflowAutomationServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new WorkflowAutomationServiceImpl(
                scheduleRepository, userRepository, consultationMessageService,
                statisticsService, commonCodeService, mobilePushDispatchService,
                systemConfigService);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("DB 플래그 OFF — sendScheduleReminders 즉시 return")
    void sendScheduleReminders_disabledByDbFlag_shortCircuits() {
        flagReturning(false);

        service.sendScheduleReminders();

        assertNoDownstreamCalls();
    }

    @Test
    @DisplayName("DB 플래그 OFF — sendIncompleteConsultationAlerts 즉시 return")
    void sendIncompleteConsultationAlerts_disabledByDbFlag_shortCircuits() {
        flagReturning(false);

        service.sendIncompleteConsultationAlerts();

        assertNoDownstreamCalls();
    }

    @Test
    @DisplayName("DB 플래그 OFF — sendDailyPerformanceSummary 즉시 return")
    void sendDailyPerformanceSummary_disabledByDbFlag_shortCircuits() {
        flagReturning(false);
        TenantContextHolder.setTenantId("tenant-a");

        service.sendDailyPerformanceSummary();

        assertNoDownstreamCalls();
    }

    @Test
    @DisplayName("DB 플래그 OFF — generateMonthlyPerformanceReport 즉시 return")
    void generateMonthlyPerformanceReport_disabledByDbFlag_shortCircuits() {
        flagReturning(false);
        TenantContextHolder.setTenantId("tenant-a");

        service.generateMonthlyPerformanceReport();

        assertNoDownstreamCalls();
    }

    @Test
    @DisplayName("DB 플래그 ON + tenantId 없음 — 본문 진입 후 자체 early-return (downstream 호출 없음)")
    void sendDailyPerformanceSummary_enabledWithoutTenantContext_returnsEarly() {
        flagReturning(true);

        service.sendDailyPerformanceSummary();

        verifyNoInteractions(userRepository);
        verifyNoInteractions(statisticsService);
        verifyNoInteractions(consultationMessageService);
    }

    private void flagReturning(boolean value) {
        when(systemConfigService.getGlobalBoolean(
                eq(NotificationSchedulerFlagKeys.WORKFLOW_AUTOMATION_ENABLED), anyBoolean()))
            .thenReturn(value);
    }

    private void assertNoDownstreamCalls() {
        verifyNoInteractions(scheduleRepository);
        verifyNoInteractions(userRepository);
        verifyNoInteractions(consultationMessageService);
        verifyNoInteractions(statisticsService);
        verifyNoInteractions(commonCodeService);
        verifyNoInteractions(mobilePushDispatchService);
    }
}
