package com.coresolution.core.config;

import com.coresolution.core.service.ErdGenerationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

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
@RequiredArgsConstructor
public class FlywayErdAutoGenerationHook {

    private final ErdGenerationService erdGenerationService;

    @Value("${spring.datasource.schema:core_solution}")
    private String defaultSchemaName;

    @Value("${erd.auto-generation.enabled:true}")
    private boolean autoGenerationEnabled;

    @Value("${erd.auto-generation.trigger-on-migration:true}")
    private boolean triggerOnMigration;

    /**
     * Flyway 마이그레이션 전략 커스터마이징
     * 마이그레이션 완료 후 ERD 자동 생성
     */
    @Bean
    @Profile("!test") // 테스트 환경에서는 비활성화
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
}

