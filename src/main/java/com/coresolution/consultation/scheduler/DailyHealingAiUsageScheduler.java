package com.coresolution.consultation.scheduler;

import com.coresolution.consultation.constant.AiUsageLogSchedulerFlagKeys;
import com.coresolution.consultation.service.DailyHealingContentGenerator;
import com.coresolution.consultation.service.SystemConfigService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.service.SchedulerAlertService;
import com.coresolution.core.service.SchedulerExecutionLogService;
import com.coresolution.core.service.TenantService;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 힐링 컨텐츠 생성(AI 사용 로그 적재) 전용 스케줄러.
 *
 * <p>{@link WellnessNotificationScheduler} 의 알림 발송과 분리한다.
 * {@code notification.scheduler.wellness-tip.enabled=false} 여도
 * {@code ai.usage-log.scheduler.enabled=true} 이면 모니터링용 적재가 가능하다.</p>
 *
 * <p><b>DEV</b>: system_config 에서 본 플래그만 ON. <b>prod</b> 에서 wellness-tip 무단 ON 금지.</p>
 *
 * @author CoreSolution
 * @since 2026-07-11
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(
        name = "scheduler.daily-healing-ai-usage.enabled",
        havingValue = "true",
        matchIfMissing = true
)
public class DailyHealingAiUsageScheduler {

    private final DailyHealingContentGenerator dailyHealingContentGenerator;
    private final TenantService tenantService;
    private final SchedulerExecutionLogService logService;
    private final SchedulerAlertService alertService;
    private final SystemConfigService systemConfigService;

    /**
     * 매일 오전 9시 10분 — 웰니스 알림(09:00) 직후, 알림 OFF 시에도 적재 가능.
     */
    @Scheduled(cron = "${scheduler.daily-healing-ai-usage.cron:0 10 9 * * ?}")
    @SchedulerLock(
            name = "daily-healing-ai-usage",
            lockAtMostFor = "PT20M",
            lockAtLeastFor = "PT2M"
    )
    public void generateDailyHealingForAiUsage() {
        if (!systemConfigService.getGlobalBoolean(
                AiUsageLogSchedulerFlagKeys.ENABLED,
                AiUsageLogSchedulerFlagKeys.DEFAULT_ENABLED)) {
            log.info("⏸️ [DailyHealingAiUsage] 스케줄러 비활성 - DB 플래그 OFF: key={}",
                    AiUsageLogSchedulerFlagKeys.ENABLED);
            return;
        }

        String executionId = UUID.randomUUID().toString();
        LocalDateTime startTime = LocalDateTime.now();
        LocalDate today = LocalDate.now();
        int successCount = 0;
        int failureCount = 0;
        int totalTenants = 0;

        log.info("⏰ [DailyHealingAiUsage] 스케줄러 시작: executionId={}, date={}", executionId, today);

        try {
            List<String> activeTenantIds = tenantService.getAllActiveTenantIds();
            totalTenants = activeTenantIds.size();

            for (String tenantId : activeTenantIds) {
                try {
                    TenantContextHolder.setTenantId(tenantId);
                    dailyHealingContentGenerator.generateForTenant(today, tenantId);
                    logService.saveExecutionLog(
                            executionId, tenantId, "DailyHealingAiUsage", "SUCCESS",
                            "Healing content generated for AI usage log");
                    successCount++;
                } catch (Exception e) {
                    log.error("❌ [DailyHealingAiUsage] 테넌트 실패: tenantId={}, error={}",
                            tenantId, e.getMessage(), e);
                    logService.saveExecutionLog(
                            executionId, tenantId, "DailyHealingAiUsage", "FAILED", e.getMessage());
                    failureCount++;
                } finally {
                    TenantContextHolder.clear();
                }
            }

            LocalDateTime endTime = LocalDateTime.now();
            long durationMs = Duration.between(startTime, endTime).toMillis();
            log.info("✅ [DailyHealingAiUsage] 완료: executionId={}, duration={}ms, success={}, failure={}",
                    executionId, durationMs, successCount, failureCount);
            logService.saveSummaryLog(
                    executionId, "DailyHealingAiUsage", totalTenants,
                    successCount, failureCount, durationMs, startTime, endTime);
        } catch (Exception e) {
            log.error("❌ [DailyHealingAiUsage] 전체 실패: executionId={}, error={}",
                    executionId, e.getMessage(), e);
            alertService.sendFailureAlert(
                    "DailyHealingAiUsage", executionId, failureCount, e.getMessage());
        }
    }
}
