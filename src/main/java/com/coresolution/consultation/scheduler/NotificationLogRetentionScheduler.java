package com.coresolution.consultation.scheduler;

import java.time.LocalDateTime;
import java.time.ZoneId;
import com.coresolution.consultation.config.NotificationRetentionProperties;
import com.coresolution.consultation.repository.AdminTestNotificationLogRepository;
import com.coresolution.consultation.repository.NotificationBatchSendLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 알림 로그 보관기간(retention) 스케줄러.
 *
 * <p>매일 03:30 KST 에 두 테이블의 보관기간 초과 row 를 일괄 삭제하는 시스템 잡:
 * <ul>
 *   <li>{@code admin_test_notification_logs} — 어드민 테스트 발송 감사로그</li>
 *   <li>{@code notification_batch_send_log} — 배치/이벤트 발송 멱등 로그</li>
 * </ul>
 *
 * <p>운영 디스크 사용량 안정화를 위한 시스템 잡이며 멀티테넌트 무관(전역).
 * 컷오프 기준은 {@code created_at < now() - retentionDays}이다.
 *
 * <p>대량 lock 회피를 위해 1회 호출당 {@link NotificationRetentionProperties#getBatchSize()}
 * row 만 삭제(LIMIT)하고, 반환 카운트가 batchSize 미만이 될 때까지 반복한다.
 * 각 batch DELETE 는 repository 단의 {@code @Transactional} 로 호출 단위 커밋된다.
 * 한 테이블 cleanup 실패는 다른 테이블 cleanup 진행을 막지 않는다(try-catch 분리).
 *
 * <p>드라이런({@code app.notification.retention.dry-run=true}) 활성화 시
 * delete 호출 없이 대상 카운트만 로깅한다(운영 반영 직후 검증용).
 *
 * <p>{@code @ConditionalOnProperty} {@code matchIfMissing=true} — 기본 활성화.
 *
 * @author MindGarden
 * @since 2026-05-23
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(
    name = "app.notification.retention.enabled",
    havingValue = "true",
    matchIfMissing = true
)
public class NotificationLogRetentionScheduler {

    private static final String SCHEDULER_NAME = "NotificationLogRetention";
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    /** 안전 상한 — 무한 루프 방지(설계상 도달하지 않지만 운영 가드). */
    private static final int MAX_BATCH_ITERATIONS = 1_000;

    private final AdminTestNotificationLogRepository testNotificationLogRepository;
    private final NotificationBatchSendLogRepository batchSendLogRepository;
    private final NotificationRetentionProperties properties;

    /**
     * 매일 03:30 KST 일괄 삭제 (시스템 잡 — 테넌트 컨텍스트 없음).
     *
     * <p>두 테이블 cleanup 은 try-catch 로 분리되어 한 테이블 실패가 다른 테이블 cleanup 을
     * 막지 않는다. 호출당 누적 카운트와 컷오프, dryRun 여부를 단일 라인으로 로깅한다.
     */
    @Scheduled(
        cron = "${app.notification.retention.cron:0 30 3 * * *}",
        zone = "Asia/Seoul"
    )
    public void cleanupExpiredLogs() {
        LocalDateTime cutoff = LocalDateTime.now(KST).minusDays(properties.getRetentionDays());
        int testDeleted = 0;
        int batchDeleted = 0;

        try {
            testDeleted = cleanupTestNotificationLogs(cutoff);
        } catch (Exception testError) {
            log.error("[{}] admin_test_notification_logs cleanup failed: cutoff={}, error={}",
                SCHEDULER_NAME, cutoff, testError.getMessage(), testError);
        }

        try {
            batchDeleted = cleanupBatchSendLogs(cutoff);
        } catch (Exception batchError) {
            log.error("[{}] notification_batch_send_log cleanup failed: cutoff={}, error={}",
                SCHEDULER_NAME, cutoff, batchError.getMessage(), batchError);
        }

        log.info("[{}] executed: testNotificationLogs deleted={}, batchSendLogs deleted={},"
                + " cutoff={}, dryRun={}",
            SCHEDULER_NAME, testDeleted, batchDeleted, cutoff, properties.isDryRun());
    }

    /**
     * {@code admin_test_notification_logs} 대상 삭제.
     *
     * <p>드라이런 시 카운트만 로깅하고 0을 반환한다. 운영 시 batchSize LIMIT 으로 N회 반복
     * 호출하며 반환값이 batchSize 미만이면 중단한다.
     *
     * @param cutoff 컷오프 시각
     * @return 삭제된 누적 row 수(dryRun 시 0)
     */
    int cleanupTestNotificationLogs(LocalDateTime cutoff) {
        if (properties.isDryRun()) {
            long candidates = testNotificationLogRepository.countOlderThan(cutoff);
            log.info("[{}] dryRun — admin_test_notification_logs candidates={}, cutoff={}",
                SCHEDULER_NAME, candidates, cutoff);
            return 0;
        }
        int batchSize = properties.getBatchSize();
        int totalDeleted = 0;
        for (int iteration = 0; iteration < MAX_BATCH_ITERATIONS; iteration++) {
            int deleted = testNotificationLogRepository.deleteOlderThan(cutoff, batchSize);
            totalDeleted += deleted;
            if (deleted < batchSize) {
                break;
            }
        }
        return totalDeleted;
    }

    /**
     * {@code notification_batch_send_log} 대상 삭제.
     *
     * <p>드라이런 시 카운트만 로깅하고 0을 반환한다. 운영 시 batchSize LIMIT 으로 N회 반복
     * 호출하며 반환값이 batchSize 미만이면 중단한다.
     *
     * @param cutoff 컷오프 시각
     * @return 삭제된 누적 row 수(dryRun 시 0)
     */
    int cleanupBatchSendLogs(LocalDateTime cutoff) {
        if (properties.isDryRun()) {
            long candidates = batchSendLogRepository.countOlderThan(cutoff);
            log.info("[{}] dryRun — notification_batch_send_log candidates={}, cutoff={}",
                SCHEDULER_NAME, candidates, cutoff);
            return 0;
        }
        int batchSize = properties.getBatchSize();
        int totalDeleted = 0;
        for (int iteration = 0; iteration < MAX_BATCH_ITERATIONS; iteration++) {
            int deleted = batchSendLogRepository.deleteOlderThan(cutoff, batchSize);
            totalDeleted += deleted;
            if (deleted < batchSize) {
                break;
            }
        }
        return totalDeleted;
    }
}
