package com.coresolution.consultation.scheduler;

import com.coresolution.consultation.constant.NotificationSchedulerFlagKeys;
import com.coresolution.consultation.repository.DailyHealingContentRepository;
import com.coresolution.consultation.repository.SystemNotificationReadRepository;
import com.coresolution.consultation.repository.SystemNotificationRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.SystemConfigService;
import com.coresolution.consultation.service.WellnessTemplateService;
import com.coresolution.consultation.service.impl.HealingContentServiceImpl;
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

import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * {@link WellnessNotificationScheduler} DB 플래그 가드 단위 테스트.
 *
 * <p>외부 의존(템플릿/리포지토리/AI) 호출을 트리거하지 않고 가드 동작만 검증한다.
 * 풀 시나리오는 통합 테스트(별도 PR) 에서 다룬다.
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
    @Mock private DailyHealingContentRepository dailyHealingContentRepository;
    @Mock private HealingContentServiceImpl healingContentService;
    @Mock private TenantService tenantService;
    @Mock private SchedulerExecutionLogService logService;
    @Mock private SchedulerAlertService alertService;
    @Mock private SystemConfigService systemConfigService;

    private WellnessNotificationScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler = new WellnessNotificationScheduler(
                systemNotificationRepository, systemNotificationReadRepository, userRepository,
                wellnessTemplateService, dailyHealingContentRepository, healingContentService,
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
    }

    @Test
    @DisplayName("DB 플래그 ON + 활성 테넌트 0건 — 정상 진입 (다운스트림 호출은 발생 안 함)")
    void sendDailyWellnessTip_enabledWithNoTenants_executesNormally() {
        when(systemConfigService.getGlobalBoolean(
                eq(NotificationSchedulerFlagKeys.WELLNESS_TIP_ENABLED), anyBoolean()))
            .thenReturn(true);
        when(tenantService.getAllActiveTenantIds()).thenReturn(java.util.List.of());

        scheduler.sendDailyWellnessTip();

        // 활성 테넌트 0건이라 발송 본문은 호출되지 않지만 tenantService 는 호출되어야 함.
        org.mockito.Mockito.verify(tenantService).getAllActiveTenantIds();
        verifyNoInteractions(systemNotificationRepository);
    }
}
