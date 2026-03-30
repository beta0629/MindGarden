package com.coresolution.core.config;

import com.coresolution.core.service.ErdGenerationService;
import java.util.Locale;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.FlywayException;
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

    private static final String FAILED_MIGRATION_MARKER = "failed migration";
    private static final String CONTAINS_FAILED_MIGRATION_MARKER = "contains a failed migration";
    private static final String FLYWAY_TROUBLESHOOTING_DOC_REF =
            "docs/troubleshooting/ONBOARDING_DEV_DEPLOY_FAILURE_ANALYSIS.md";

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
                    log.info("🔧 개발 환경 - Flyway repair 실행 (시도 {}/{} - checksum·히스토리 정리)", attempt, maxRetries);
                    tryRepairWithOptionalSecondAttempt(flyway, "dev-pre-migrate-attempt-" + attempt);

                    flyway.migrate();
                    log.info("✅ Flyway 마이그레이션 완료 (개발 서버 - ERD 자동 생성 비활성화)");
                    return; // 성공 시 종료
                } catch (FlywayException e) {
                    DevFailedMigrationHandleResult hintResult =
                            handleDevFailedMigrationHint(flyway, e, attempt, maxRetries, retryDelayMs);
                    if (hintResult == DevFailedMigrationHandleResult.EXIT_SUCCESS) {
                        return;
                    }
                    if (hintResult == DevFailedMigrationHandleResult.CONTINUE_OUTER_LOOP) {
                        continue;
                    }
                    if (e.getMessage() != null && (e.getMessage().contains("Validate failed")
                            || e.getMessage().contains("checksum mismatch")
                            || e.getMessage().contains("Migrations have failed validation"))) {
                        log.warn("⚠️ Flyway 검증 실패 (시도 {}/{}): {}", attempt, maxRetries, e.getMessage());
                        if (attempt < maxRetries) {
                            sleepQuietly(retryDelayMs);
                            continue; // 재시도
                        }
                    } else if (e.getMessage() != null && (e.getMessage().contains("Too many connections")
                            || e.getMessage().contains("Could not create connection"))) {
                        log.warn("⚠️ Flyway 연결 실패 (시도 {}/{}): {} - 재시도 대기 중...", attempt, maxRetries,
                                e.getMessage());
                        if (attempt < maxRetries) {
                            sleepQuietly(retryDelayMs * attempt); // 지수 백오프
                            continue; // 재시도
                        }
                    } else {
                        // 다른 오류는 마지막 시도에서만 전파
                        if (attempt == maxRetries) {
                            log.error("❌ Flyway 마이그레이션 실패 (최대 재시도 횟수 초과): {}", e.getMessage(), e);
                            logDevFlywayOperatorHint();
                            throw e;
                        }
                        log.warn("⚠️ Flyway 오류 발생 (시도 {}/{}): {} - 재시도 중...", attempt, maxRetries,
                                e.getMessage());
                        sleepQuietly(retryDelayMs);
                        continue;
                    }
                } catch (Exception e) {
                    // 예상치 못한 오류
                    if (e.getMessage() != null && (e.getMessage().contains("Too many connections")
                            || e.getMessage().contains("Could not create connection"))) {
                        log.warn("⚠️ Flyway 연결 실패 (시도 {}/{}): {} - 재시도 대기 중...", attempt, maxRetries,
                                e.getMessage());
                        if (attempt < maxRetries) {
                            sleepQuietly(retryDelayMs * attempt); // 지수 백오프
                            continue; // 재시도
                        }
                    }

                    log.error("❌ Flyway 마이그레이션 중 예상치 못한 오류 발생 (시도 {}/{}): {}", attempt, maxRetries,
                            e.getMessage(), e);
                    if (attempt == maxRetries) {
                        // 개발 환경에서는 예외를 던지지 않고 계속 진행
                        log.warn("⚠️ 개발 환경이므로 Flyway 오류를 무시하고 애플리케이션을 계속 시작합니다.");
                        return; // 마지막 시도에서도 실패하면 무시하고 계속 진행
                    }
                    sleepQuietly(retryDelayMs);
                }
            }

            // 모든 재시도 실패
            log.error("❌ Flyway 마이그레이션 최대 재시도 횟수 초과 - 개발 환경이므로 무시하고 계속 진행합니다.");
            logDevFlywayOperatorHint();
        };
    }

    /**
     * Flyway가 실패 마이그레이션(flyway_schema_history 등)을 알리는 메시지인지 판별합니다.
     *
     * @param message 예외 메시지
     * @return 해당 힌트가 포함되면 true
     */
    static boolean containsFailedMigrationHint(String message) {
        if (message == null || message.isEmpty()) {
            return false;
        }
        String lower = message.toLowerCase(Locale.ROOT);
        return lower.contains(FAILED_MIGRATION_MARKER) || lower.contains(CONTAINS_FAILED_MIGRATION_MARKER);
    }

    /**
     * repair 1회 실행. 실패 시 전체 스택을 ERROR로 남깁니다.
     *
     * @return 성공 시 true
     */
    private boolean tryRepairOnce(Flyway flyway, String context) {
        try {
            flyway.repair();
            log.info("✅ Flyway repair 완료 context={}", context);
            return true;
        } catch (Exception ex) {
            log.error("❌ Flyway repair 실패 context={}", context, ex);
            return false;
        }
    }

    /**
     * repair 후 실패 시 한 번 더 repair 시도(로깅 포함).
     */
    private void tryRepairWithOptionalSecondAttempt(Flyway flyway, String context) {
        if (tryRepairOnce(flyway, context + "-1")) {
            return;
        }
        log.warn("⚠️ Flyway repair 1차 실패 후 동일 루프에서 재시도 context={}", context);
        tryRepairOnce(flyway, context + "-2");
    }

    private enum DevFailedMigrationHandleResult {
        /** 이 예외는 failed migration 힌트가 아님 — 기존 분기로 처리 */
        NOT_APPLICABLE,
        /** migrate 성공 — 전략 람다 종료 */
        EXIT_SUCCESS,
        /** 다음 attempt 로 재시도 */
        CONTINUE_OUTER_LOOP
    }

    /**
     * failed migration 힌트 시 repair 강화 후 동일 시도 내 migrate 1회 재실행.
     */
    private DevFailedMigrationHandleResult handleDevFailedMigrationHint(Flyway flyway, FlywayException e, int attempt,
            int maxRetries, int retryDelayMs) {
        if (!containsFailedMigrationHint(e.getMessage())) {
            return DevFailedMigrationHandleResult.NOT_APPLICABLE;
        }
        log.warn("⚠️ Flyway 실패 마이그레이션 힌트 감지 (시도 {}/{}): {}", attempt, maxRetries, e.getMessage());
        tryRepairWithOptionalSecondAttempt(flyway, "dev-after-failed-migration-hint-attempt-" + attempt);
        try {
            flyway.migrate();
            log.info("✅ Flyway 마이그레이션 완료 (failed migration 수리 후, 개발 서버)");
            return DevFailedMigrationHandleResult.EXIT_SUCCESS;
        } catch (FlywayException retryEx) {
            log.error("❌ repair·재migrate 후에도 실패 (시도 {}/{}): {}", attempt, maxRetries, retryEx.getMessage(),
                    retryEx);
            if (attempt < maxRetries) {
                sleepQuietly(retryDelayMs);
                return DevFailedMigrationHandleResult.CONTINUE_OUTER_LOOP;
            }
            logDevFlywayOperatorHint();
            throw retryEx;
        }
    }

    private void sleepQuietly(int millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        }
    }

    private void logDevFlywayOperatorHint() {
        log.error("💡 조치: 대상 스키마의 flyway_schema_history(success=0 등) 확인, Flyway repair(CLI 또는 Maven 플러그인) 실행.");
        log.error("   참고 문서: {}", FLYWAY_TROUBLESHOOTING_DOC_REF);
    }
}
