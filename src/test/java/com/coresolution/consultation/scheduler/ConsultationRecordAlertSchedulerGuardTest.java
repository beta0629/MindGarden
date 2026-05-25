package com.coresolution.consultation.scheduler;

import com.coresolution.consultation.constant.NotificationSchedulerFlagKeys;
import com.coresolution.consultation.service.PlSqlConsultationRecordAlertService;
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

import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * {@link ConsultationRecordAlertScheduler} DB 플래그 가드 단위 테스트.
 *
 * <p>일/주/월 3 진입점이 동일한 DB 플래그로 차단되는지 검증한다.
 *
 * @author MindGarden
 * @since 2026-05-25
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("상담일지 미작성 알림 — DB 플래그 가드 (Daily/Weekly/Monthly)")
class ConsultationRecordAlertSchedulerGuardTest {

    @Mock private PlSqlConsultationRecordAlertService consultationRecordAlertService;
    @Mock private TenantService tenantService;
    @Mock private SchedulerExecutionLogService logService;
    @Mock private SchedulerAlertService alertService;
    @Mock private SystemConfigService systemConfigService;

    private ConsultationRecordAlertScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler = new ConsultationRecordAlertScheduler(
                consultationRecordAlertService, tenantService, logService, alertService,
                systemConfigService);
    }

    @Test
    @DisplayName("DB 플래그 OFF — checkDailyMissingConsultationRecords 즉시 return")
    void daily_disabledByDbFlag_shortCircuits() {
        flagReturning(false);

        scheduler.checkDailyMissingConsultationRecords();

        assertNoDownstreamCalls();
    }

    @Test
    @DisplayName("DB 플래그 OFF — checkWeeklyMissingConsultationRecords 즉시 return")
    void weekly_disabledByDbFlag_shortCircuits() {
        flagReturning(false);

        scheduler.checkWeeklyMissingConsultationRecords();

        assertNoDownstreamCalls();
    }

    @Test
    @DisplayName("DB 플래그 OFF — checkMonthlyMissingConsultationRecords 즉시 return")
    void monthly_disabledByDbFlag_shortCircuits() {
        flagReturning(false);

        scheduler.checkMonthlyMissingConsultationRecords();

        assertNoDownstreamCalls();
    }

    @Test
    @DisplayName("DB 플래그 ON + 활성 테넌트 0건 — 정상 진입 (PlSql 호출은 발생 안 함)")
    void daily_enabledWithNoTenants_executesNormally() {
        flagReturning(true);
        when(tenantService.getAllActiveTenantIds()).thenReturn(java.util.List.of());

        scheduler.checkDailyMissingConsultationRecords();

        org.mockito.Mockito.verify(tenantService).getAllActiveTenantIds();
        verifyNoInteractions(consultationRecordAlertService);
    }

    @Test
    @DisplayName("수동 실행 메서드는 DB 플래그와 무관 — 관리자 수동 트리거 보장")
    void manualCheckMissingRecords_notGatedByDbFlag() {
        flagReturning(false);
        when(tenantService.getAllActiveTenantIds()).thenReturn(java.util.List.of());

        scheduler.manualCheckMissingRecords(7);

        org.mockito.Mockito.verify(tenantService).getAllActiveTenantIds();
    }

    private void flagReturning(boolean value) {
        when(systemConfigService.getGlobalBoolean(
                eq(NotificationSchedulerFlagKeys.CONSULTATION_RECORD_ALERT_ENABLED), anyBoolean()))
            .thenReturn(value);
    }

    private void assertNoDownstreamCalls() {
        verifyNoInteractions(tenantService);
        verifyNoInteractions(consultationRecordAlertService);
        verifyNoInteractions(logService);
    }
}
