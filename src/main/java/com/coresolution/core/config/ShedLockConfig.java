package com.coresolution.core.config;

import javax.sql.DataSource;
import net.javacrumbs.shedlock.core.LockProvider;
import net.javacrumbs.shedlock.provider.jdbctemplate.JdbcTemplateLockProvider;
import net.javacrumbs.shedlock.provider.jdbctemplate.JdbcTemplateLockProvider.Configuration;
import net.javacrumbs.shedlock.spring.annotation.EnableSchedulerLock;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * ShedLock 분산 락 설정 (트랙 A 핫픽스, 2026-05-23).
 *
 * <p>blue/green 컷오버 시점이 09:00 ± n 분과 겹치는 경우 cron 누락 및 중복 실행을 방지하기
 * 위해 ShedLock 을 도입한다. {@code shedlock} 테이블은 {@code V20260528_005} Flyway
 * 마이그레이션으로 생성되며, {@link JdbcTemplateLockProvider} 가 기본 스키마를 사용한다.</p>
 *
 * <p>핫픽스 (2026-05-25, N1 후속): 기존에는 blue/green 양 슬롯이 동일 hostname
 * (예: {@code beta74.cafe24.com}) 으로 {@code locked_by} 컬럼에 기록되어 어느 슬롯이 락을
 * 잡았는지 식별 불가능했다. 슬롯 식별자({@code app.instance.id}) 를 명시적으로 주입해
 * {@code shedlock.locked_by} 컬럼에 {@code blue} / {@code green} / {@code dev} 가 기록되도록
 * 변경한다. 환경변수 {@code APP_INSTANCE_ID} 를 systemd unit 에 추가해 슬롯별로 다른 값을
 * 주입해야 한다(deployer 후속 작업).</p>
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
 * @version 1.2.0
 * @since 2026-05-23
 */
@org.springframework.context.annotation.Configuration
@EnableSchedulerLock(defaultLockAtMostFor = "PT30M")
public class ShedLockConfig {

    /**
     * 슬롯 식별자. systemd unit 에서 {@code APP_INSTANCE_ID=blue|green|dev} 로 주입하며,
     * 미설정 시 {@code "default"} 로 기록된다. {@code shedlock.locked_by} 컬럼에 기록되어
     * 어느 슬롯이 락을 점유했는지 운영에서 식별 가능하게 한다.
     */
    @Value("${app.instance.id:default}")
    private String instanceId;

    /**
     * 메인 DataSource 기반 JDBC LockProvider 빈 등록.
     *
     * <p>{@code withLockedByValue(instanceId)} 로 슬롯 식별자를 명시 주입한다.
     * ShedLock 기본값(hostname) 사용 시 blue/green 양 슬롯이 동일 hostname 으로 기록되어
     * 슬롯 식별이 불가능했던 문제를 해소한다.</p>
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
                .withLockedByValue(instanceId)
                .build()
        );
    }
}
