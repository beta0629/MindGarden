package com.coresolution.core.scheduler;

import com.coresolution.core.service.SchemaChangeErdRegenerationService;
import com.coresolution.core.service.SchedulerAlertService;
import com.coresolution.core.service.SchedulerExecutionLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 스키마 변경 감지 스케줄러 (표준화 적용)
 * <p>
 * 주기적으로 데이터베이스 스키마를 확인하여 변경사항을 감지하고,
 * 변경이 감지되면 관련 테넌트의 ERD를 자동으로 재생성합니다.
 * </p>
 *
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-12-02
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(
    name = "scheduler.schema-change-detection.enabled",
    havingValue = "true",
    matchIfMissing = true
)
public class SchemaChangeDetectionScheduler {

    private final SchemaChangeErdRegenerationService schemaChangeErdRegenerationService;
    private final SchedulerExecutionLogService logService;
    private final SchedulerAlertService alertService;

    @Value("${spring.datasource.schema:core_solution}")
    private String defaultSchemaName;

    @Value("${erd.auto-generation.schedule-enabled:true}")
    private boolean scheduleEnabled;

    @Value("${erd.auto-generation.schema-change-detection.enabled:true}")
    private boolean changeDetectionEnabled;

    @Value("${scheduler.schema-change-detection.cron:0 0 2 * * ?}")
    private String cronExpression;

    /**
     * 스키마 변경 감지 및 ERD 자동 재생성 (표준화 적용)
     * <p>
     * 설정된 주기마다 스키마를 확인하고, 변경사항이 있으면 ERD를 재생성합니다.
     * </p>
     * Cron: 매일 새벽 2시
     */
    @Scheduled(cron = "${scheduler.schema-change-detection.cron:0 0 2 * * ?}")
    public void detectSchemaChangesAndRegenerateErd() {
        if (!scheduleEnabled || !changeDetectionEnabled) {
            log.debug("스키마 변경 감지 스케줄러가 비활성화되어 있습니다.");
            return;
        }

        String executionId = UUID.randomUUID().toString();
        LocalDateTime startTime = LocalDateTime.now();
        
        log.info("⏰ [SchemaChangeDetection] 스케줄러 시작: executionId={}, startTime={}",
            executionId, startTime);

        try {
            // 스키마 변경 감지 및 ERD 자동 재생성
            int regeneratedCount = schemaChangeErdRegenerationService.detectAndRegenerateErds(defaultSchemaName);
            
            LocalDateTime endTime = LocalDateTime.now();
            long durationMs = Duration.between(startTime, endTime).toMillis();
            
            log.info("✅ [SchemaChangeDetection] 스케줄러 완료: executionId={}, duration={}ms, regenerated={}",
                executionId, durationMs, regeneratedCount);
            
            // 시스템 레벨 스케줄러이므로 tenantId는 null
            logService.saveExecutionLog(
                executionId, null, "SchemaChangeDetection", "SUCCESS", 
                "Regenerated " + regeneratedCount + " ERDs"
            );
            
            logService.saveSummaryLog(
                executionId,
                "SchemaChangeDetection",
                1, // 시스템 레벨 작업
                1, // 성공
                0, // 실패
                durationMs,
                startTime,
                endTime
            );

        } catch (Exception e) {
            log.error("❌ [SchemaChangeDetection] 스케줄러 실패: executionId={}, error={}", 
                executionId, e.getMessage(), e);
            
            logService.saveExecutionLog(
                executionId, null, "SchemaChangeDetection", "FAILED", e.getMessage()
            );
            
            alertService.sendFailureAlert(
                "SchemaChangeDetection", executionId, 1, e.getMessage()
            );
        }
    }

    /**
     * 스키마 변경 감지 (간격 기반)
     * <p>
     * 설정된 간격마다 스키마를 확인합니다.
     * </p>
     * Interval: 1시간마다
     */
    @Scheduled(fixedDelayString = "${erd.auto-generation.schema-change-detection.check-interval-seconds:3600}000")
    public void checkSchemaChanges() {
        if (!scheduleEnabled || !changeDetectionEnabled) {
            return;
        }

        log.debug("🔍 [SchemaChangeDetection] 스키마 변경 확인 (간격 기반)");

        try {
            int changedCount = schemaChangeErdRegenerationService.detectAndRegenerateErds(defaultSchemaName);
            
            if (changedCount > 0) {
                log.info("✅ [SchemaChangeDetection] 스키마 변경 감지 및 ERD 재생성: count={}", changedCount);
            }
            
        } catch (Exception e) {
            log.warn("스키마 변경 확인 실패: {}", e.getMessage());
        }
    }
}
