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
 * <p>적용 스케줄러: {@code WellnessNotificationScheduler#sendDailyWellnessTip}
 * (lock name {@code "wellness-notification"}, lockAtMostFor {@code PT15M},
 * lockAtLeastFor {@code PT5M}).</p>
 *
 * @author CoreSolution
 * @version 1.0.0
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
