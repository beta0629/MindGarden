package com.coresolution.consultation.scheduler;

import com.coresolution.consultation.service.ShopOrderHoldExpiryService;
import com.coresolution.core.service.SchedulerAlertService;
import com.coresolution.core.service.SchedulerExecutionLogService;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 미결제 쇼핑 주문 hold TTL 만료 스케줄러.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(
        name = "scheduler.shop-order-hold-expiry.enabled",
        havingValue = "true",
        matchIfMissing = true)
public class ShopOrderHoldExpiryScheduler {

    private static final String SCHEDULER_NAME = "ShopOrderHoldExpiry";

    private final ShopOrderHoldExpiryService shopOrderHoldExpiryService;
    private final SchedulerExecutionLogService logService;
    private final SchedulerAlertService alertService;

    /**
     * hold TTL 경과 주문 만료 (기본 5분마다).
     */
    @Scheduled(cron = "${scheduler.shop-order-hold-expiry.cron:0 */5 * * * *}")
    public void expireStaleOrderHolds() {
        String executionId = UUID.randomUUID().toString();
        LocalDateTime startTime = LocalDateTime.now();

        log.debug("[{}] 스케줄러 시작: executionId={}", SCHEDULER_NAME, executionId);

        try {
            int totalExpired = shopOrderHoldExpiryService.expireStaleHoldsForAllActiveTenants();

            logService.saveExecutionLog(
                    executionId,
                    "ALL",
                    SCHEDULER_NAME,
                    "SUCCESS",
                    "{\"totalExpired\":" + totalExpired + "}");

            long durationMs = Duration.between(startTime, LocalDateTime.now()).toMillis();
            if (totalExpired > 0) {
                log.info(
                        "[{}] 완료: executionId={}, durationMs={}, totalExpired={}",
                        SCHEDULER_NAME,
                        executionId,
                        durationMs,
                        totalExpired);
            }

            logService.saveSummaryLog(executionId, SCHEDULER_NAME, 1, 1, 0, durationMs, startTime, LocalDateTime.now());

        } catch (Exception e) {
            log.error("[{}] 실패: executionId={}, error={}", SCHEDULER_NAME, executionId, e.getMessage(), e);
            logService.saveExecutionLog(executionId, "ALL", SCHEDULER_NAME, "FAILED", null, e.getMessage());
            alertService.sendFailureAlert(SCHEDULER_NAME, executionId, 1, e.getMessage());
        }
    }
}
