package com.coresolution.core.scheduler;

import com.coresolution.core.service.SchemaChangeErdRegenerationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 스키마 변경 감지 스케줄러
 * <p>
 * 주기적으로 데이터베이스 스키마를 확인하여 변경사항을 감지하고,
 * 변경이 감지되면 관련 테넌트의 ERD를 자동으로 재생성합니다.
 * </p>
 *
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SchemaChangeDetectionScheduler {

    private final SchemaChangeErdRegenerationService schemaChangeErdRegenerationService;

    @Value("${spring.datasource.schema:core_solution}")
    private String defaultSchemaName;

    @Value("${erd.auto-generation.schedule-enabled:true}")
    private boolean scheduleEnabled;

    @Value("${erd.auto-generation.schema-change-detection.enabled:true}")
    private boolean changeDetectionEnabled;

    @Value("${erd.auto-generation.schema-change-detection.check-interval-seconds:3600}")
    private long checkIntervalSeconds;

    /**
     * 스키마 변경 감지 및 ERD 자동 재생성
     * <p>
     * 설정된 주기마다 스키마를 확인하고, 변경사항이 있으면 ERD를 재생성합니다.
     * </p>
     */
    @Scheduled(cron = "${erd.auto-generation.schedule-cron:0 0 2 * * ?}")
    public void detectSchemaChangesAndRegenerateErd() {
        if (!scheduleEnabled || !changeDetectionEnabled) {
            log.debug("스키마 변경 감지 스케줄러가 비활성화되어 있습니다.");
            return;
        }

        log.info("🔍 스키마 변경 감지 시작");

        try {
            // 스키마 변경 감지 및 ERD 자동 재생성
            int regeneratedCount = schemaChangeErdRegenerationService.detectAndRegenerateErds(defaultSchemaName);
            
            log.info("✅ 스키마 변경 감지 및 ERD 재생성 완료: 재생성된 ERD 수={}", regeneratedCount);

        } catch (Exception e) {
            log.error("❌ 스키마 변경 감지 실패: {}", e.getMessage(), e);
        }
    }

    /**
     * 스키마 변경 감지 (간격 기반)
     * <p>
     * 설정된 간격마다 스키마를 확인합니다.
     * </p>
     */
    @Scheduled(fixedDelayString = "${erd.auto-generation.schema-change-detection.check-interval-seconds:3600}000")
    public void checkSchemaChanges() {
        if (!scheduleEnabled || !changeDetectionEnabled) {
            return;
        }

        log.debug("🔍 스키마 변경 확인 (간격 기반)");

        try {
            // 스키마 변경 감지 및 ERD 자동 재생성
            // TODO: 이전 스키마 정보와 비교하여 변경사항이 있을 경우에만 재생성
            // 현재는 간격 기반 확인은 로깅만 수행 (실제 재생성은 cron 스케줄러에서 수행)
            log.debug("📊 스키마 변경 확인 완료 (간격 기반)");

        } catch (Exception e) {
            log.error("❌ 스키마 변경 확인 실패: {}", e.getMessage(), e);
        }
    }
}

