package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.lang.reflect.Method;
import java.time.LocalDate;
import java.util.List;

import com.coresolution.consultation.repository.ErpSyncLogRepository;
import com.coresolution.consultation.service.PlSqlStatisticsService;
import com.coresolution.core.service.TenantService;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link StatisticsSchedulerServiceImpl} — 스케줄/수동 경로에서 성과 모니터링이 테넌트별로 호출되는지 검증.
 *
 * <p>핫픽스 (2026-05-25, N1) 추가 검증: 일별 스케줄 메서드 3종이 모두 {@link SchedulerLock}
 * 으로 보호되어 blue/green 양 슬롯 중복 실행이 차단되는지 reflection 으로 확인한다.</p>
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

    /**
     * 핫픽스 (2026-05-25, N1) — blue/green 양 슬롯 동시 실행 차단 검증.
     */
    @Nested
    @DisplayName("@SchedulerLock 어노테이션 메타데이터 (N1 핫픽스)")
    class SchedulerLockMetadata {

        @Test
        @DisplayName("scheduleDailyStatisticsUpdate — name=statistics-scheduler-daily-update")
        void scheduleDailyStatisticsUpdate_hasSchedulerLock() throws NoSuchMethodException {
            SchedulerLock lock = findLock("scheduleDailyStatisticsUpdate");
            assertThat(lock)
                .as("일별 통계 업데이트 — blue/green 동시 실행 차단을 위해 ShedLock 필수")
                .isNotNull();
            assertThat(lock.name()).isEqualTo("statistics-scheduler-daily-update");
            assertThat(lock.lockAtMostFor()).isEqualTo("PT30M");
            assertThat(lock.lockAtLeastFor()).isEqualTo("PT5M");
        }

        @Test
        @DisplayName("scheduleConsultantPerformanceUpdate — name=statistics-scheduler-consultant-performance")
        void scheduleConsultantPerformanceUpdate_hasSchedulerLock() throws NoSuchMethodException {
            SchedulerLock lock = findLock("scheduleConsultantPerformanceUpdate");
            assertThat(lock).isNotNull();
            assertThat(lock.name()).isEqualTo("statistics-scheduler-consultant-performance");
            assertThat(lock.lockAtMostFor()).isEqualTo("PT30M");
            assertThat(lock.lockAtLeastFor()).isEqualTo("PT5M");
        }

        @Test
        @DisplayName("schedulePerformanceMonitoring — name=statistics-scheduler-performance-monitoring")
        void schedulePerformanceMonitoring_hasSchedulerLock() throws NoSuchMethodException {
            SchedulerLock lock = findLock("schedulePerformanceMonitoring");
            assertThat(lock).isNotNull();
            assertThat(lock.name()).isEqualTo("statistics-scheduler-performance-monitoring");
            assertThat(lock.lockAtMostFor()).isEqualTo("PT30M");
            assertThat(lock.lockAtLeastFor()).isEqualTo("PT5M");
        }

        @Test
        @DisplayName("세 스케줄러는 서로 다른 lock name 을 사용한다 — 일별/성과/모니터링 락이 서로 충돌하지 않음")
        void distinctLockNames() throws NoSuchMethodException {
            String a = findLock("scheduleDailyStatisticsUpdate").name();
            String b = findLock("scheduleConsultantPerformanceUpdate").name();
            String c = findLock("schedulePerformanceMonitoring").name();
            assertThat(a).isNotEqualTo(b);
            assertThat(b).isNotEqualTo(c);
            assertThat(a).isNotEqualTo(c);
        }

        private SchedulerLock findLock(String methodName) throws NoSuchMethodException {
            Method method = StatisticsSchedulerServiceImpl.class.getDeclaredMethod(methodName);
            return method.getAnnotation(SchedulerLock.class);
        }
    }
}
