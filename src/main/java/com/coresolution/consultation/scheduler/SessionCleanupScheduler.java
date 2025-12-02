package com.coresolution.consultation.scheduler;

import com.coresolution.consultation.service.UserSessionService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.service.SchedulerAlertService;
import com.coresolution.core.service.SchedulerExecutionLogService;
import com.coresolution.core.service.TenantService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
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
    
    private final UserSessionService userSessionService;
    private final TenantService tenantService;
    private final SchedulerExecutionLogService logService;
    private final SchedulerAlertService alertService;
    
    @Value("${scheduler.session-cleanup.cron:0 */5 * * * *}")
    private String cronExpression;
    
    /**
     * 만료된 세션 정리 (5분마다 실행, 테넌트별 독립 실행)
     * Cron: 매 5분마다
     */
    @Scheduled(cron = "${scheduler.session-cleanup.cron:0 */5 * * * *}")
    public void cleanupExpiredSessions() {
        String executionId = UUID.randomUUID().toString();
        LocalDateTime startTime = LocalDateTime.now();
        
        log.debug("⏰ [SessionCleanup] 스케줄러 시작: executionId={}", executionId);
        
        int successCount = 0;
        int failureCount = 0;
        int totalTenants = 0;
        int totalCleaned = 0;
        
        try {
            // 활성 테넌트 목록 조회
            List<String> activeTenantIds = tenantService.getAllActiveTenantIds();
            totalTenants = activeTenantIds.size();
            
            for (String tenantId : activeTenantIds) {
                try {
                    TenantContextHolder.setTenantId(tenantId);
                    
                    int cleanedCount = userSessionService.cleanupExpiredSessions();
                    totalCleaned += cleanedCount;
                    
                    if (cleanedCount > 0) {
                        log.debug("✅ [SessionCleanup] 세션 정리 완료: tenantId={}, count={}", 
                            tenantId, cleanedCount);
                    }
                    
                    logService.saveExecutionLog(
                        executionId, tenantId, "SessionCleanup", "SUCCESS", 
                        "Cleaned " + cleanedCount + " expired sessions"
                    );
                    successCount++;
                    
                } catch (Exception e) {
                    log.error("❌ [SessionCleanup] 세션 정리 실패: tenantId={}, error={}", 
                        tenantId, e.getMessage(), e);
                    logService.saveExecutionLog(
                        executionId, tenantId, "SessionCleanup", "FAILED", e.getMessage()
                    );
                    failureCount++;
                } finally {
                    TenantContextHolder.clear();
                }
            }
            
            LocalDateTime endTime = LocalDateTime.now();
            long durationMs = Duration.between(startTime, endTime).toMillis();
            
            if (totalCleaned > 0) {
                log.info("✅ [SessionCleanup] 스케줄러 완료: executionId={}, duration={}ms, totalCleaned={}, success={}, failure={}",
                    executionId, durationMs, totalCleaned, successCount, failureCount);
            }
            
            logService.saveSummaryLog(
                executionId,
                "SessionCleanup",
                totalTenants,
                successCount,
                failureCount,
                durationMs,
                startTime,
                endTime
            );
            
        } catch (Exception e) {
            log.error("❌ [SessionCleanup] 스케줄러 전체 실행 실패: executionId={}, error={}",
                executionId, e.getMessage(), e);
            alertService.sendFailureAlert(
                "SessionCleanup", executionId, failureCount, e.getMessage()
            );
        }
    }
    
    /**
     * 세션 통계 로깅 (1시간마다 실행)
     * Cron: 매시간 정각
     */
    @Scheduled(cron = "0 0 * * * ?")
    public void logSessionStatistics() {
        log.debug("📊 [SessionCleanup] 세션 통계 조회 시작");
        
        try {
            List<String> activeTenantIds = tenantService.getAllActiveTenantIds();
            
            for (String tenantId : activeTenantIds) {
                try {
                    TenantContextHolder.setTenantId(tenantId);
                    
                    var statistics = userSessionService.getSessionStatistics();
                    
                    if (!statistics.isEmpty()) {
                        log.info("📊 [SessionCleanup] 활성 세션 통계 (tenantId={}):", tenantId);
                        for (Object[] stat : statistics) {
                            Long userId = (Long) stat[0];
                            Long sessionCount = (Long) stat[1];
                            log.info("  - 사용자 ID: {}, 활성 세션 수: {}", userId, sessionCount);
                        }
                    }
                } catch (Exception e) {
                    log.warn("세션 통계 조회 실패: tenantId={}", tenantId, e);
                } finally {
                    TenantContextHolder.clear();
                }
            }
            
        } catch (Exception e) {
            log.error("❌ 세션 통계 조회 실패: error={}", e.getMessage(), e);
        }
    }
}
