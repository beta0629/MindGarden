package com.coresolution.core.config;

import com.coresolution.core.service.ErdGenerationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.context.annotation.Profile;
import lombok.extern.slf4j.Slf4j;

/**
 * Flyway 마이그레이션 후 ERD 자동 생성 Hook
 * <p>
 * Flyway 마이그레이션이 성공적으로 완료된 후 전체 시스템 ERD를 자동으로 생성합니다.
 * </p>
 *
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Configuration
public class FlywayErdAutoGenerationHook {

    private ErdGenerationService erdGenerationService;

    @Value("${spring.datasource.schema:core_solution}")
    private String defaultSchemaName;

    @Value("${erd.auto-generation.enabled:true}")
    private boolean autoGenerationEnabled;

    @Value("${erd.auto-generation.trigger-on-migration:true}")
    private boolean triggerOnMigration;

    /**
     * ErdGenerationService 지연 주입 (순환 참조 방지)
     */
    @Autowired
    @Lazy
    public void setErdGenerationService(ErdGenerationService erdGenerationService) {
        this.erdGenerationService = erdGenerationService;
    }

    /**
     * Flyway 마이그레이션 전략 커스터마이징 마이그레이션 완료 후 ERD 자동 생성
     *
     * 주의: 개발 서버(dev 프로파일)에서는 ERD 자동 생성을 비활성화하여 jpaSharedEM_entityManagerFactory 빈 초기화 순환 참조 문제를
     * 방지합니다.
     */
    @Bean
    @Profile("!test & !dev & !local") // 테스트, 개발, 로컬 환경에서는 비활성화
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            // 기본 마이그레이션 실행
            flyway.migrate();

            // 마이그레이션 완료 후 ERD 자동 생성
            if (autoGenerationEnabled && triggerOnMigration) {
                log.info("🔄 Flyway 마이그레이션 완료 - ERD 자동 생성 시작");

                try {
                    // 전체 시스템 ERD 자동 생성
                    String createdBy = "system-flyway-hook";
                    erdGenerationService.generateFullSystemErd(defaultSchemaName, createdBy);

                    log.info("✅ ERD 자동 생성 완료 (Flyway 마이그레이션 후)");
                } catch (Exception e) {
                    log.error("❌ ERD 자동 생성 실패 (Flyway 마이그레이션 후): {}", e.getMessage(), e);
                    // ERD 생성 실패가 마이그레이션을 막지 않도록 예외를 로깅만 하고 계속 진행
                }
            }
        };
    }

    /**
     * 개발 서버용 Flyway 마이그레이션 전략 (ERD 자동 생성 없음) 
     * 개발 환경에서는 검증 오류 시 repair를 먼저 실행한 후 마이그레이션 진행
     */
    @Bean
    @Profile("dev")
    public FlywayMigrationStrategy flywayMigrationStrategyForDev() {
        return flyway -> {
            try {
                // 개발 환경에서는 먼저 repair를 실행하여 checksum 불일치 문제 해결
                log.info("🔧 개발 환경 - Flyway repair 실행 (checksum 불일치 해결)");
                try {
                    flyway.repair();
                    log.info("✅ Flyway repair 완료");
                } catch (Exception repairException) {
                    log.warn("⚠️ Flyway repair 실패 (무시하고 계속 진행): {}", repairException.getMessage());
                }
                
                // repair 후 마이그레이션 실행
                flyway.migrate();
                log.info("✅ Flyway 마이그레이션 완료 (개발 서버 - ERD 자동 생성 비활성화)");
            } catch (org.flywaydb.core.api.FlywayException e) {
                // 검증 오류가 발생하면 다시 repair 시도
                if (e.getMessage() != null && (e.getMessage().contains("Validate failed")
                        || e.getMessage().contains("checksum mismatch")
                        || e.getMessage().contains("Migrations have failed validation"))) {
                    log.warn("⚠️ Flyway 검증 실패 - repair 재실행: {}", e.getMessage());
                    try {
                        flyway.repair();
                        log.info("✅ Flyway repair 완료 - 마이그레이션 재시도");
                        flyway.migrate();
                        log.info("✅ Flyway 마이그레이션 완료 (repair 후)");
                    } catch (Exception repairException) {
                        log.error("❌ Flyway repair 실패: {}", repairException.getMessage(),
                                repairException);
                        // 개발 환경에서는 repair 실패해도 애플리케이션 시작 계속 진행
                        log.warn("⚠️ 개발 환경이므로 Flyway 검증 오류를 무시하고 애플리케이션을 계속 시작합니다.");
                        // 예외를 던지지 않고 계속 진행 (개발 환경이므로)
                    }
                } else {
                    // 다른 오류는 그대로 전파
                    log.error("❌ Flyway 마이그레이션 실패 (검증 오류 아님): {}", e.getMessage(), e);
                    throw e;
                }
            } catch (Exception e) {
                // 예상치 못한 오류
                log.error("❌ Flyway 마이그레이션 중 예상치 못한 오류 발생: {}", e.getMessage(), e);
                // 개발 환경에서는 예외를 던지지 않고 계속 진행
                log.warn("⚠️ 개발 환경이므로 Flyway 오류를 무시하고 애플리케이션을 계속 시작합니다.");
            }
        };
    }
}

