package com.coresolution.consultation.scheduler;

import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.AiUsageLogSchedulerFlagKeys;
import com.coresolution.consultation.service.DailyHealingContentGenerator;
import com.coresolution.consultation.service.SystemConfigService;
import com.coresolution.core.service.SchedulerAlertService;
import com.coresolution.core.service.SchedulerExecutionLogService;
import com.coresolution.core.service.TenantService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

/**
 * {@link DailyHealingAiUsageScheduler} DB 플래그 가드 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-07-11
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("힐링 AI 사용 로그 스케줄러 — DB 플래그 가드")
class DailyHealingAiUsageSchedulerGuardTest {

    @Mock private DailyHealingContentGenerator dailyHealingContentGenerator;
    @Mock private TenantService tenantService;
    @Mock private SchedulerExecutionLogService logService;
    @Mock private SchedulerAlertService alertService;
    @Mock private SystemConfigService systemConfigService;

    private DailyHealingAiUsageScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler = new DailyHealingAiUsageScheduler(
                dailyHealingContentGenerator, tenantService, logService, alertService, systemConfigService);
    }

    @Test
    @DisplayName("DB 플래그 OFF — 즉시 return, 다운스트림 호출 없음")
    void generate_disabledByDbFlag_shortCircuits() {
        when(systemConfigService.getGlobalBoolean(
                eq(AiUsageLogSchedulerFlagKeys.ENABLED), anyBoolean()))
                .thenReturn(false);

        scheduler.generateDailyHealingForAiUsage();

        verifyNoInteractions(tenantService);
        verifyNoInteractions(dailyHealingContentGenerator);
        verifyNoInteractions(logService);
    }

    @Test
    @DisplayName("DB 플래그 ON + 테넌트 0건 — tenantService 만 호출")
    void generate_enabledWithNoTenants_queriesTenantsOnly() {
        when(systemConfigService.getGlobalBoolean(
                eq(AiUsageLogSchedulerFlagKeys.ENABLED), anyBoolean()))
                .thenReturn(true);
        when(tenantService.getAllActiveTenantIds()).thenReturn(java.util.List.of());

        scheduler.generateDailyHealingForAiUsage();

        org.mockito.Mockito.verify(tenantService).getAllActiveTenantIds();
        verifyNoInteractions(dailyHealingContentGenerator);
    }
}
