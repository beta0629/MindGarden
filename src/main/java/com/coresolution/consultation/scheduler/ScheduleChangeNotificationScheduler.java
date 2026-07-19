package com.coresolution.consultation.scheduler;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;
import com.coresolution.consultation.service.ScheduleChangeNotificationDebounceService;
import com.coresolution.core.service.SchedulerAlertService;
import com.coresolution.core.service.SchedulerExecutionLogService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 일정 변경 SCHEDULE_CHANGED 외부 채널 디바운스 발송 스케줄러.
 *
 * <p>fire_at 경과 pending 을 폴링하여 최신 슬롯으로 1회 발송한다.
 * 참고: {@link ShopOrderHoldExpiryScheduler}.</p>
 *
 * @author MindGarden
 * @since 2026-07-19
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(
        name = "scheduler.schedule-change-notification.enabled",
        havingValue = "true",
        matchIfMissing = true)
public class ScheduleChangeNotificationScheduler {

    private static final String SCHEDULER_NAME = "ScheduleChangeNotification";

    private final ScheduleChangeNotificationDebounceService debounceService;
    private final SchedulerExecutionLogService logService;
    private final SchedulerAlertService alertService;

    /**
     * due pending 폴링 (기본 1분마다).
     */
    @Scheduled(cron = "${scheduler.schedule-change-notification.cron:0 * * * * *}")
    public void processDueScheduleChangeNotifications() {
        String executionId = UUID.randomUUID().toString();
        LocalDateTime startTime = LocalDateTime.now();

        log.debug("[{}] 스케줄러 시작: executionId={}", SCHEDULER_NAME, executionId);

        try {
            int processed = debounceService.processDuePending();

            logService.saveExecutionLog(
                    executionId,
                    "ALL",
                    SCHEDULER_NAME,
                    "SUCCESS",
                    "{\"processed\":" + processed + "}");

            long durationMs = Duration.between(startTime, LocalDateTime.now()).toMillis();
            if (processed > 0) {
                log.info(
                        "[{}] 완료: executionId={}, durationMs={}, processed={}",
                        SCHEDULER_NAME,
                        executionId,
                        durationMs,
                        processed);
            }

            logService.saveSummaryLog(
                    executionId, SCHEDULER_NAME, 1, 1, 0, durationMs, startTime, LocalDateTime.now());
        } catch (Exception e) {
            log.error("[{}] 실패: executionId={}, error={}", SCHEDULER_NAME, executionId, e.getMessage(), e);
            logService.saveExecutionLog(executionId, "ALL", SCHEDULER_NAME, "FAILED", null, e.getMessage());
            alertService.sendFailureAlert(SCHEDULER_NAME, executionId, 1, e.getMessage());
        }
    }
}
