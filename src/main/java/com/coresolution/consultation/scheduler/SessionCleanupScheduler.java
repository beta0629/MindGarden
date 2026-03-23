package com.coresolution.consultation.scheduler;

import com.coresolution.consultation.service.UserSessionService;
import com.coresolution.core.service.SchedulerAlertService;
import com.coresolution.core.service.SchedulerExecutionLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 세션 정리 스케줄러 (표준화 적용)
 * 주기적으로 만료된 세션을 정리
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-12-02
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(
    name = "scheduler.session-cleanup.enabled",
    havingValue = "true",
    matchIfMissing = true
)
public class SessionCleanupScheduler {

    private static final String SCHEDULER_NAME = "SessionCleanup";

    private final UserSessionService userSessionService;
    private final SchedulerExecutionLogService logService;
    private final SchedulerAlertService alertService;
    
    /**
     * 만료된 세션 정리 (5분마다 실행, 전역 1회 실행)
     * UserSessionRepository.deactivateExpiredSessions는 tenantId 무관 전역 UPDATE이므로
     * 테넌트 루프 제거, 1회 호출로 최적화
     * Cron: 매 5분마다
     */
    @Scheduled(cron = "${scheduler.session-cleanup.cron:0 */5 * * * *}")
    public void cleanupExpiredSessions() {
        String executionId = UUID.randomUUID().toString();
        LocalDateTime startTime = LocalDateTime.now();
        
        log.debug("⏰ [SessionCleanup] 스케줄러 시작: executionId={}", executionId);
        
        try {
            int totalCleaned = userSessionService.cleanupExpiredSessions();
            
            logService.saveExecutionLog(
                executionId, "ALL", SCHEDULER_NAME, "SUCCESS",
                "{\"totalCleaned\":" + totalCleaned + "}"
            );
            
            LocalDateTime endTime = LocalDateTime.now();
            long durationMs = Duration.between(startTime, endTime).toMillis();
            
            if (totalCleaned > 0) {
                log.info("✅ [SessionCleanup] 스케줄러 완료: executionId={}, duration={}ms, totalCleaned={}",
                    executionId, durationMs, totalCleaned);
            }
            
            logService.saveSummaryLog(
                executionId,
                SCHEDULER_NAME,
                1,
                1,
                0,
                durationMs,
                startTime,
                endTime
            );
            
        } catch (Exception e) {
            log.error("❌ [SessionCleanup] 스케줄러 실행 실패: executionId={}, error={}",
                executionId, e.getMessage(), e);
            logService.saveExecutionLog(
                executionId, "ALL", SCHEDULER_NAME, "FAILED", null, e.getMessage()
            );
            alertService.sendFailureAlert(
                SCHEDULER_NAME, executionId, 1, e.getMessage()
            );
        }
    }
    
    /**
     * 세션 통계 로깅 (1시간마다 실행)
     * getSessionStatistics는 전역 통계 반환(tenantId 무관)이므로 단일 조회로 단순화
     * Cron: 매시간 정각
     */
    @Scheduled(cron = "0 0 * * * ?")
    public void logSessionStatistics() {
        log.debug("📊 [SessionCleanup] 세션 통계 조회 시작");
        
        try {
            var statistics = userSessionService.getSessionStatistics();
            
            if (!statistics.isEmpty()) {
                log.info("📊 [SessionCleanup] 활성 세션 통계 (전역):");
                for (Object[] stat : statistics) {
                    Long userId = (Long) stat[0];
                    Long sessionCount = (Long) stat[1];
                    log.info("  - 사용자 ID: {}, 활성 세션 수: {}", userId, sessionCount);
                }
            }
        } catch (Exception e) {
            log.error("❌ 세션 통계 조회 실패: error={}", e.getMessage(), e);
        }
    }
}
