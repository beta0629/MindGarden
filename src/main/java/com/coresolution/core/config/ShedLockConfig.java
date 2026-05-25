package com.coresolution.core.config;

import javax.sql.DataSource;
import net.javacrumbs.shedlock.core.LockProvider;
import net.javacrumbs.shedlock.provider.jdbctemplate.JdbcTemplateLockProvider;
import net.javacrumbs.shedlock.provider.jdbctemplate.JdbcTemplateLockProvider.Configuration;
import net.javacrumbs.shedlock.spring.annotation.EnableSchedulerLock;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * ShedLock 분산 락 설정 (트랙 A 핫픽스, 2026-05-23).
 *
 * <p>blue/green 컷오버 시점이 09:00 ± n 분과 겹치는 경우 cron 누락 및 중복 실행을 방지하기
 * 위해 ShedLock 을 도입한다. {@code shedlock} 테이블은 {@code V20260528_005} Flyway
 * 마이그레이션으로 생성되며, {@link JdbcTemplateLockProvider} 가 기본 스키마를 사용한다.</p>
 *
 * <p>적용 스케줄러:</p>
 * <ul>
 *   <li>{@code WellnessNotificationScheduler#sendDailyWellnessTip} —
 *     lock name {@code "wellness-notification"}, lockAtMostFor {@code PT15M},
 *     lockAtLeastFor {@code PT5M}.</li>
 *   <li>{@code StatisticsGenerationScheduler#generateDailyStatistics} —
 *     lock name {@code "statistics-generation-daily"}, lockAtMostFor {@code PT30M},
 *     lockAtLeastFor {@code PT5M}. (핫픽스 2026-05-25, N1)</li>
 *   <li>{@code StatisticsGenerationScheduler#refreshRealtimeStatistics} —
 *     lock name {@code "statistics-generation-hourly"}, lockAtMostFor {@code PT10M},
 *     lockAtLeastFor {@code PT2M}. (핫픽스 2026-05-25, N1 — 매 시각 정시 {@code StaleStateException} 차단)</li>
 *   <li>{@code StatisticsSchedulerServiceImpl#scheduleDailyStatisticsUpdate} —
 *     lock name {@code "statistics-scheduler-daily-update"}, lockAtMostFor {@code PT30M},
 *     lockAtLeastFor {@code PT5M}. (핫픽스 2026-05-25, N1)</li>
 *   <li>{@code StatisticsSchedulerServiceImpl#scheduleConsultantPerformanceUpdate} —
 *     lock name {@code "statistics-scheduler-consultant-performance"}, lockAtMostFor {@code PT30M},
 *     lockAtLeastFor {@code PT5M}. (핫픽스 2026-05-25, N1)</li>
 *   <li>{@code StatisticsSchedulerServiceImpl#schedulePerformanceMonitoring} —
 *     lock name {@code "statistics-scheduler-performance-monitoring"}, lockAtMostFor {@code PT30M},
 *     lockAtLeastFor {@code PT5M}. (핫픽스 2026-05-25, N1)</li>
 * </ul>
 *
 * @author CoreSolution
 * @version 1.1.0
 * @since 2026-05-23
 */
@org.springframework.context.annotation.Configuration
@EnableSchedulerLock(defaultLockAtMostFor = "PT30M")
public class ShedLockConfig {

    /**
     * 메인 DataSource 기반 JDBC LockProvider 빈 등록.
     *
     * @param dataSource Spring 이 관리하는 메인 DataSource
     * @return JdbcTemplateLockProvider (ShedLock 기본 스키마: shedlock 테이블)
     */
    @Bean
    public LockProvider lockProvider(DataSource dataSource) {
        return new JdbcTemplateLockProvider(
            Configuration.builder()
                .withJdbcTemplate(new JdbcTemplate(dataSource))
                .usingDbTime()
                .build()
        );
    }
}
