package com.coresolution.consultation.scheduler;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import com.coresolution.consultation.service.ClientGradeAutoPromotionService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.service.SchedulerAlertService;
import com.coresolution.core.service.SchedulerExecutionLogService;
import com.coresolution.core.service.TenantService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 내담자 CLIENT 등급 자동 승급 (일 1회, 테넌트별).
 *
 * @author CoreSolution
 * @since 2026-04-04
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(
    name = "scheduler.client-grade-auto.enabled",
    havingValue = "true",
    matchIfMissing = true
)
public class ClientGradeAutoPromotionScheduler {

    private static final String SCHEDULER_NAME = "ClientGradeAutoPromotion";

    private final ClientGradeAutoPromotionService clientGradeAutoPromotionService;
    private final TenantService tenantService;
    private final SchedulerExecutionLogService logService;
    private final SchedulerAlertService alertService;

    /**
     * 매일 1회 실행 (기본: 새벽 3시 15분 — 다른 일일 배치와 분산).
     */
    @Scheduled(cron = "${scheduler.client-grade-auto.cron:0 15 3 * * ?}")
    public void runDailyClientGradeAutoPromotion() {
        String executionId = UUID.randomUUID().toString();
        LocalDateTime startTime = LocalDateTime.now();
        log.info("⏰ [{}] 시작: executionId={}", SCHEDULER_NAME, executionId);

        int successCount = 0;
        int failureCount = 0;
        int totalTenants = 0;

        try {
            List<String> activeTenantIds = tenantService.getAllActiveTenantIds();
            totalTenants = activeTenantIds.size();
            log.info("📋 [{}] 대상 테넌트 수: {}", SCHEDULER_NAME, totalTenants);

            for (String tenantId : activeTenantIds) {
                try {
                    TenantContextHolder.setTenantId(tenantId);
                    ClientGradeAutoPromotionService.Result result =
                        clientGradeAutoPromotionService.runForTenant(tenantId);
                    log.info("✅ [{}] 테넌트 완료: tenantId={}, scanned={}, updated={}",
                        SCHEDULER_NAME, tenantId, result.clientsScanned(), result.gradesUpdated());
                    logService.saveExecutionLog(
                        executionId,
                        tenantId,
                        SCHEDULER_NAME,
                        "SUCCESS",
                        String.format("scanned=%d, updated=%d", result.clientsScanned(), result.gradesUpdated())
                    );
                    successCount++;
                } catch (Exception e) {
                    log.error("❌ [{}] 테넌트 실패: tenantId={}, error={}",
                        SCHEDULER_NAME, tenantId, e.getMessage(), e);
                    logService.saveExecutionLog(
                        executionId,
                        tenantId,
                        SCHEDULER_NAME,
                        "FAILED",
                        null,
                        e.getMessage()
                    );
                    failureCount++;
                } finally {
                    TenantContextHolder.clear();
                }
            }

            LocalDateTime endTime = LocalDateTime.now();
            long durationMs = Duration.between(startTime, endTime).toMillis();
            log.info("✅ [{}] 완료: executionId={}, duration={}ms, success={}, failure={}",
                SCHEDULER_NAME, executionId, durationMs, successCount, failureCount);

            logService.saveSummaryLog(
                executionId,
                SCHEDULER_NAME,
                totalTenants,
                successCount,
                failureCount,
                durationMs,
                startTime,
                endTime
            );

            if (failureCount > 0) {
                alertService.sendFailureAlert(
                    SCHEDULER_NAME,
                    executionId,
                    failureCount,
                    "일부 테넌트에서 내담자 등급 자동 승급이 실패했습니다."
                );
            }
        } catch (Exception e) {
            log.error("❌ [{}] 전체 실패: executionId={}, error={}",
                SCHEDULER_NAME, executionId, e.getMessage(), e);
            alertService.sendCompleteFailureAlert(SCHEDULER_NAME, executionId, totalTenants, e.getMessage());
        }
    }
}
