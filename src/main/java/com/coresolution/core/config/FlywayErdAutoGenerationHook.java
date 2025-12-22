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
     * 개발 서버용 Flyway 마이그레이션 전략 (ERD 자동 생성 없음) 개발 환경에서는 검증 오류 시 repair를 먼저 실행한 후 마이그레이션 진행
     */
    @Bean
    @Profile("dev")
    public FlywayMigrationStrategy flywayMigrationStrategyForDev() {
        return flyway -> {
            int maxRetries = 3;
            int retryDelayMs = 2000; // 2초 대기
            
            for (int attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    // 개발 환경에서는 먼저 repair를 실행하여 checksum 불일치 문제 해결
                    log.info("🔧 개발 환경 - Flyway repair 실행 (시도 {}/{} - checksum 불일치 해결)", attempt, maxRetries);
                    try {
                        flyway.repair();
                        log.info("✅ Flyway repair 완료");
                    } catch (Exception repairException) {
                        log.warn("⚠️ Flyway repair 실패 (무시하고 계속 진행): {}", repairException.getMessage());
                    }

                    // repair 후 마이그레이션 실행
                    flyway.migrate();
                    log.info("✅ Flyway 마이그레이션 완료 (개발 서버 - ERD 자동 생성 비활성화)");
                    return; // 성공 시 종료
                } catch (org.flywaydb.core.api.FlywayException e) {
                    // 검증 오류 또는 연결 오류 처리
                    if (e.getMessage() != null && (e.getMessage().contains("Validate failed")
                            || e.getMessage().contains("checksum mismatch")
                            || e.getMessage().contains("Migrations have failed validation"))) {
                        log.warn("⚠️ Flyway 검증 실패 (시도 {}/{}): {}", attempt, maxRetries, e.getMessage());
                        if (attempt < maxRetries) {
                            try {
                                Thread.sleep(retryDelayMs);
                            } catch (InterruptedException ie) {
                                Thread.currentThread().interrupt();
                            }
                            continue; // 재시도
                        }
                    } else if (e.getMessage() != null && (e.getMessage().contains("Too many connections")
                            || e.getMessage().contains("Could not create connection"))) {
                        log.warn("⚠️ Flyway 연결 실패 (시도 {}/{}): {} - 재시도 대기 중...", attempt, maxRetries, e.getMessage());
                        if (attempt < maxRetries) {
                            try {
                                Thread.sleep(retryDelayMs * attempt); // 지수 백오프
                            } catch (InterruptedException ie) {
                                Thread.currentThread().interrupt();
                            }
                            continue; // 재시도
                        }
                    } else {
                        // 다른 오류는 마지막 시도에서만 전파
                        if (attempt == maxRetries) {
                            log.error("❌ Flyway 마이그레이션 실패 (최대 재시도 횟수 초과): {}", e.getMessage(), e);
                            throw e;
                        }
                        log.warn("⚠️ Flyway 오류 발생 (시도 {}/{}): {} - 재시도 중...", attempt, maxRetries, e.getMessage());
                        try {
                            Thread.sleep(retryDelayMs);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                        }
                        continue;
                    }
                } catch (Exception e) {
                    // 예상치 못한 오류
                    if (e.getMessage() != null && (e.getMessage().contains("Too many connections")
                            || e.getMessage().contains("Could not create connection"))) {
                        log.warn("⚠️ Flyway 연결 실패 (시도 {}/{}): {} - 재시도 대기 중...", attempt, maxRetries, e.getMessage());
                        if (attempt < maxRetries) {
                            try {
                                Thread.sleep(retryDelayMs * attempt); // 지수 백오프
                            } catch (InterruptedException ie) {
                                Thread.currentThread().interrupt();
                            }
                            continue; // 재시도
                        }
                    }
                    
                    log.error("❌ Flyway 마이그레이션 중 예상치 못한 오류 발생 (시도 {}/{}): {}", attempt, maxRetries, e.getMessage(), e);
                    if (attempt == maxRetries) {
                        // 개발 환경에서는 예외를 던지지 않고 계속 진행
                        log.warn("⚠️ 개발 환경이므로 Flyway 오류를 무시하고 애플리케이션을 계속 시작합니다.");
                        return; // 마지막 시도에서도 실패하면 무시하고 계속 진행
                    }
                    try {
                        Thread.sleep(retryDelayMs);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                }
            }
            
            // 모든 재시도 실패
            log.error("❌ Flyway 마이그레이션 최대 재시도 횟수 초과 - 개발 환경이므로 무시하고 계속 진행합니다.");
            log.error("💡 서버에서 다음 명령어로 연결 상태를 확인하고 정리하세요:");
            log.error("   ssh root@beta0629.cafe24.com");
            log.error("   /opt/mindgarden/scripts/development/utilities/check-db-connections.sh");
            log.error("   /opt/mindgarden/scripts/development/utilities/cleanup-db-connections.sh");
            // 개발 환경에서는 예외를 던지지 않고 계속 진행
        };
    }
}

