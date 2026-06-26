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
import com.coresolution.core.service.TenantService;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.lang.reflect.Method;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
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
    @Mock private TenantService tenantService;

    private WorkflowAutomationServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new WorkflowAutomationServiceImpl(
                scheduleRepository, userRepository, consultationMessageService,
                statisticsService, commonCodeService, mobilePushDispatchService,
                systemConfigService, tenantService);
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
    @DisplayName("DB 플래그 ON + 활성 테넌트 없음 — tenantService만 호출, downstream 없음")
    void sendDailyPerformanceSummary_enabledWithNoActiveTenants_returnsEarly() {
        flagReturning(true);
        when(tenantService.getAllActiveTenantIds()).thenReturn(Collections.emptyList());

        service.sendDailyPerformanceSummary();

        verify(tenantService).getAllActiveTenantIds();
        verifyNoInteractions(userRepository);
        verifyNoInteractions(statisticsService);
        verifyNoInteractions(consultationMessageService);
    }

    @Nested
    @DisplayName("@SchedulerLock 어노테이션 메타데이터 (blue/green dedup)")
    class SchedulerLockMetadata {

        @Test
        @DisplayName("sendDailyPerformanceSummary — name=workflow-automation-daily-summary")
        void sendDailyPerformanceSummary_hasSchedulerLock() throws NoSuchMethodException {
            SchedulerLock lock = findLock("sendDailyPerformanceSummary");
            assertThat(lock)
                .as("일일 성과 요약 — blue/green 동시 실행 차단을 위해 ShedLock 필수")
                .isNotNull();
            assertThat(lock.name()).isEqualTo("workflow-automation-daily-summary");
            assertThat(lock.lockAtMostFor()).isEqualTo("PT30M");
            assertThat(lock.lockAtLeastFor()).isEqualTo("PT5M");
        }

        @Test
        @DisplayName("generateMonthlyPerformanceReport — name=workflow-automation-monthly-report")
        void generateMonthlyPerformanceReport_hasSchedulerLock() throws NoSuchMethodException {
            SchedulerLock lock = findLock("generateMonthlyPerformanceReport");
            assertThat(lock).isNotNull();
            assertThat(lock.name()).isEqualTo("workflow-automation-monthly-report");
            assertThat(lock.lockAtMostFor()).isEqualTo("PT30M");
            assertThat(lock.lockAtLeastFor()).isEqualTo("PT5M");
        }

        @Test
        @DisplayName("일일/월간 스케줄러는 서로 다른 lock name 을 사용한다")
        void distinctLockNames() throws NoSuchMethodException {
            String daily = findLock("sendDailyPerformanceSummary").name();
            String monthly = findLock("generateMonthlyPerformanceReport").name();
            assertThat(daily).isNotEqualTo(monthly);
        }

        private SchedulerLock findLock(String methodName) throws NoSuchMethodException {
            Method method = WorkflowAutomationServiceImpl.class.getDeclaredMethod(methodName);
            return method.getAnnotation(SchedulerLock.class);
        }
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
        verifyNoInteractions(tenantService);
    }
}
