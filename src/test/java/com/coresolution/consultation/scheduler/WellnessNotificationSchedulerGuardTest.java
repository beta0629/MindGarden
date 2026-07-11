package com.coresolution.consultation.scheduler;

import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.NotificationSchedulerFlagKeys;
import com.coresolution.consultation.repository.SystemNotificationReadRepository;
import com.coresolution.consultation.repository.SystemNotificationRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.DailyHealingContentGenerator;
import com.coresolution.consultation.service.SystemConfigService;
import com.coresolution.consultation.service.WellnessTemplateService;
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
 * {@link WellnessNotificationScheduler} DB 플래그 가드 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-05-25
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("웰니스 알림 스케줄러 — DB 플래그 가드")
class WellnessNotificationSchedulerGuardTest {

    @Mock private SystemNotificationRepository systemNotificationRepository;
    @Mock private SystemNotificationReadRepository systemNotificationReadRepository;
    @Mock private UserRepository userRepository;
    @Mock private WellnessTemplateService wellnessTemplateService;
    @Mock private DailyHealingContentGenerator dailyHealingContentGenerator;
    @Mock private TenantService tenantService;
    @Mock private SchedulerExecutionLogService logService;
    @Mock private SchedulerAlertService alertService;
    @Mock private SystemConfigService systemConfigService;

    private WellnessNotificationScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler = new WellnessNotificationScheduler(
                systemNotificationRepository, systemNotificationReadRepository, userRepository,
                wellnessTemplateService, dailyHealingContentGenerator,
                tenantService, logService, alertService, systemConfigService);
    }

    @Test
    @DisplayName("DB 플래그 OFF — sendDailyWellnessTip 즉시 return, 다운스트림 호출 없음")
    void sendDailyWellnessTip_disabledByDbFlag_shortCircuits() {
        when(systemConfigService.getGlobalBoolean(
                eq(NotificationSchedulerFlagKeys.WELLNESS_TIP_ENABLED), anyBoolean()))
            .thenReturn(false);

        scheduler.sendDailyWellnessTip();

        verifyNoInteractions(tenantService);
        verifyNoInteractions(systemNotificationRepository);
        verifyNoInteractions(logService);
        verifyNoInteractions(dailyHealingContentGenerator);
    }

    @Test
    @DisplayName("DB 플래그 OFF — catchUpMissedDispatchOnStartup 즉시 return, 다운스트림 호출 없음")
    void catchUp_disabledByDbFlag_shortCircuits() {
        when(systemConfigService.getGlobalBoolean(
                eq(NotificationSchedulerFlagKeys.WELLNESS_TIP_ENABLED), anyBoolean()))
            .thenReturn(false);

        scheduler.catchUpMissedDispatchOnStartup();

        verifyNoInteractions(tenantService);
        verifyNoInteractions(systemNotificationRepository);
        verifyNoInteractions(logService);
        verifyNoInteractions(dailyHealingContentGenerator);
    }

    @Test
    @DisplayName("DB 플래그 ON + 활성 테넌트 0건 — 정상 진입 (다운스트림 호출은 발생 안 함)")
    void sendDailyWellnessTip_enabledWithNoTenants_executesNormally() {
        when(systemConfigService.getGlobalBoolean(
                eq(NotificationSchedulerFlagKeys.WELLNESS_TIP_ENABLED), anyBoolean()))
            .thenReturn(true);
        when(tenantService.getAllActiveTenantIds()).thenReturn(java.util.List.of());

        scheduler.sendDailyWellnessTip();

        org.mockito.Mockito.verify(tenantService).getAllActiveTenantIds();
        verifyNoInteractions(systemNotificationRepository);
        verifyNoInteractions(dailyHealingContentGenerator);
    }
}
