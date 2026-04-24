package com.coresolution.consultation.service.impl;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;

import com.coresolution.consultation.repository.ErpSyncLogRepository;
import com.coresolution.consultation.service.PlSqlStatisticsService;
import com.coresolution.core.service.TenantService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link StatisticsSchedulerServiceImpl} — 스케줄/수동 경로에서 성과 모니터링이 테넌트별로 호출되는지 검증.
 *
 * @author CoreSolution
 * @since 2026-04-24
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("StatisticsSchedulerServiceImpl")
class StatisticsSchedulerServiceImplTest {

    @Mock
    private PlSqlStatisticsService plSqlStatisticsService;
    @Mock
    private ErpSyncLogRepository erpSyncLogRepository;
    @Mock
    private TenantService tenantService;

    @InjectMocks
    private StatisticsSchedulerServiceImpl statisticsSchedulerService;

    @Test
    @DisplayName("updateStatisticsForDate는 활성 테넌트 수만큼 performDailyPerformanceMonitoring을 호출한다")
    void updateStatisticsForDate_callsPerformanceMonitoringPerTenant() {
        when(tenantService.getAllActiveTenantIds()).thenReturn(List.of("t1", "t2"));
        when(plSqlStatisticsService.updateAllBranchDailyStatistics(any())).thenReturn("ok");
        when(plSqlStatisticsService.updateAllConsultantPerformance(any())).thenReturn("ok");
        when(plSqlStatisticsService.performDailyPerformanceMonitoring(any())).thenReturn(0);

        LocalDate d = LocalDate.of(2026, 4, 1);
        statisticsSchedulerService.updateStatisticsForDate(d);

        verify(plSqlStatisticsService, times(1)).updateAllBranchDailyStatistics(d);
        verify(plSqlStatisticsService, times(1)).updateAllConsultantPerformance(d);
        verify(plSqlStatisticsService, times(2)).performDailyPerformanceMonitoring(d);
    }
}
