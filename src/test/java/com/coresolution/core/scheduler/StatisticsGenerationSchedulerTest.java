package com.coresolution.core.scheduler;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.lang.reflect.Method;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import com.coresolution.core.domain.Tenant;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.service.SchedulerAlertService;
import com.coresolution.core.service.SchedulerExecutionLogService;
import com.coresolution.core.service.statistics.StatisticsMetadataService;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.scheduling.annotation.Scheduled;

/**
 * {@link StatisticsGenerationScheduler} 단위 테스트.
 *
 * <p>핫픽스 (2026-05-25, N1) 검증: blue/green 양 슬롯 동시 실행 → {@code StaleStateException}
 * 차단을 위해 부착된 {@code @SchedulerLock} 어노테이션의 존재·name·lockAtMostFor·lockAtLeastFor
 * 값을 reflection 으로 검증한다.</p>
 *
 * <p>실제 분산 락 동작은 ShedLock 라이브러리가 책임지므로 본 테스트는 메서드별 락 메타데이터가
 * 올바르게 선언되었는지에 한정한다. 락 보유 시 skip 동작은 통합 환경(실 DB + 2 인스턴스)에서
 * 별도 검증 대상.</p>
 *
 * @author MindGarden
 * @since 2026-05-25
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("StatisticsGenerationScheduler — N1 핫픽스 ShedLock 어노테이션 검증")
class StatisticsGenerationSchedulerTest {

    @Mock
    private StatisticsMetadataService statisticsMetadataService;
    @Mock
    private TenantRepository tenantRepository;
    @Mock
    private SchedulerExecutionLogService logService;
    @Mock
    private SchedulerAlertService alertService;

    @InjectMocks
    private StatisticsGenerationScheduler scheduler;

    @Nested
    @DisplayName("@SchedulerLock 어노테이션 메타데이터 (reflection)")
    class SchedulerLockMetadata {

        @Test
        @DisplayName("generateDailyStatistics — name=statistics-generation-daily, lockAtMostFor=PT30M, lockAtLeastFor=PT5M")
        void generateDailyStatistics_hasSchedulerLockAnnotation() throws NoSuchMethodException {
            // Given
            Method method = StatisticsGenerationScheduler.class.getDeclaredMethod("generateDailyStatistics");

            // When
            SchedulerLock lock = method.getAnnotation(SchedulerLock.class);
            Scheduled scheduled = method.getAnnotation(Scheduled.class);

            // Then
            assertThat(lock)
                .as("일별 통계 스케줄러는 ShedLock 으로 보호되어야 한다 (blue/green 동시 실행 차단)")
                .isNotNull();
            assertThat(lock.name()).isEqualTo("statistics-generation-daily");
            assertThat(lock.lockAtMostFor()).isEqualTo("PT30M");
            assertThat(lock.lockAtLeastFor()).isEqualTo("PT5M");
            assertThat(scheduled)
                .as("@Scheduled 도 그대로 유지되어야 한다")
                .isNotNull();
        }

        @Test
        @DisplayName("refreshRealtimeStatistics — name=statistics-generation-hourly, lockAtMostFor=PT10M, lockAtLeastFor=PT2M")
        void refreshRealtimeStatistics_hasSchedulerLockAnnotation() throws NoSuchMethodException {
            // Given
            Method method = StatisticsGenerationScheduler.class.getDeclaredMethod("refreshRealtimeStatistics");

            // When
            SchedulerLock lock = method.getAnnotation(SchedulerLock.class);
            Scheduled scheduled = method.getAnnotation(Scheduled.class);

            // Then
            assertThat(lock)
                .as("매시간 통계 스케줄러는 N1 핫픽스로 ShedLock 부착 — StaleStateException 차단")
                .isNotNull();
            assertThat(lock.name()).isEqualTo("statistics-generation-hourly");
            assertThat(lock.lockAtMostFor()).isEqualTo("PT10M");
            assertThat(lock.lockAtLeastFor()).isEqualTo("PT2M");
            assertThat(scheduled).isNotNull();
            assertThat(scheduled.cron()).isEqualTo("0 0 * * * ?");
        }

        @Test
        @DisplayName("두 스케줄러는 서로 다른 lock name 을 사용한다 — 일/시간 락이 서로를 차단하지 않음")
        void distinctLockNames() throws NoSuchMethodException {
            // Given
            SchedulerLock dailyLock = StatisticsGenerationScheduler.class
                .getDeclaredMethod("generateDailyStatistics")
                .getAnnotation(SchedulerLock.class);
            SchedulerLock hourlyLock = StatisticsGenerationScheduler.class
                .getDeclaredMethod("refreshRealtimeStatistics")
                .getAnnotation(SchedulerLock.class);

            // Then
            assertThat(dailyLock.name())
                .as("일별/시간별 통계는 독립 락 — 일별 실행이 시간별 실행을 차단하지 않아야 한다")
                .isNotEqualTo(hourlyLock.name());
        }
    }

    @Nested
    @DisplayName("스케줄러 정상 동작 (락 획득 가정)")
    class HappyPath {

        @Test
        @DisplayName("generateDailyStatistics — 활성 테넌트별로 일별 통계 생성 호출")
        void generateDailyStatistics_invokesPerActiveTenant() {
            // Given
            Tenant tenantA = buildTenant("tenant-a");
            Tenant tenantB = buildTenant("tenant-b");
            when(tenantRepository.findAllActive()).thenReturn(List.of(tenantA, tenantB));

            // When
            scheduler.generateDailyStatistics();

            // Then
            verify(statisticsMetadataService).generateDailyStatistics(eq("tenant-a"), any(LocalDate.class));
            verify(statisticsMetadataService).generateDailyStatistics(eq("tenant-b"), any(LocalDate.class));
            verify(logService, times(2)).saveExecutionLog(
                anyString(), anyString(), anyString(), anyString(), anyString());
        }

        @Test
        @DisplayName("refreshRealtimeStatistics — 활성 테넌트 0개일 때 generateDailyStatistics 미호출")
        void refreshRealtimeStatistics_emptyTenants_noop() {
            // Given
            when(tenantRepository.findAllActive()).thenReturn(Collections.emptyList());

            // When
            scheduler.refreshRealtimeStatistics();

            // Then
            verify(statisticsMetadataService, never()).generateDailyStatistics(anyString(), any(LocalDate.class));
        }

        @Test
        @DisplayName("refreshRealtimeStatistics — 한 테넌트가 예외를 던져도 나머지 테넌트는 계속 처리한다")
        void refreshRealtimeStatistics_continuesOnTenantException() {
            // Given
            Tenant tenantA = buildTenant("tenant-a");
            Tenant tenantB = buildTenant("tenant-b");
            when(tenantRepository.findAllActive()).thenReturn(List.of(tenantA, tenantB));
            Mockito.doThrow(new RuntimeException("StaleState simulated"))
                .when(statisticsMetadataService).generateDailyStatistics(eq("tenant-a"), any(LocalDate.class));

            // When
            scheduler.refreshRealtimeStatistics();

            // Then
            verify(statisticsMetadataService).generateDailyStatistics(eq("tenant-b"), any(LocalDate.class));
        }
    }

    // ---------------------------------------------------------------- fixtures

    private static Tenant buildTenant(String tenantId) {
        Tenant tenant = new Tenant();
        tenant.setTenantId(tenantId);
        return tenant;
    }
}
